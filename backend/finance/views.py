import csv
from datetime import date, timedelta
from decimal import Decimal

from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncDay, TruncMonth, TruncWeek, TruncYear
from django.http import HttpResponse
from rest_framework import status, viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Budget, Category, Transaction
from .serializers import BudgetSerializer, CategorySerializer, TransactionSerializer
from .utils import create_demo_data


class OwnedViewSet(viewsets.ModelViewSet):
    """Every query is scoped to request.user, so users can never see/modify others' data."""
    def perform_create(self, s):
        s.save(user=self.request.user)


class CategoryViewSet(OwnedViewSet):
    serializer_class = CategorySerializer

    def get_queryset(self):
        qs = Category.objects.filter(user=self.request.user)
        t = self.request.query_params.get("type")
        return qs.filter(type=t) if t else qs

    def destroy(self, request, *a, **k):
        if self.get_object().transactions.exists():
            return Response({"detail": "Category is used by transactions and cannot be deleted."}, status=400)
        return super().destroy(request, *a, **k)


class TransactionViewSet(OwnedViewSet):
    serializer_class = TransactionSerializer
    fixed_type = None  # set by /income/ and /expenses/ routes

    def get_queryset(self):
        p = self.request.query_params
        qs = Transaction.objects.filter(user=self.request.user).select_related("category")
        t = self.fixed_type or p.get("type")
        if t: qs = qs.filter(type=t)
        if p.get("category"): qs = qs.filter(category_id=p["category"])
        if p.get("payment_method"): qs = qs.filter(payment_method=p["payment_method"])
        if p.get("date_from"): qs = qs.filter(date__gte=p["date_from"])
        if p.get("date_to"): qs = qs.filter(date__lte=p["date_to"])
        if p.get("search"):
            qs = qs.filter(Q(description__icontains=p["search"]) | Q(category__name__icontains=p["search"]))
        order = p.get("ordering")
        if order in ("amount", "-amount", "date", "-date"):
            qs = qs.order_by(order, "-id")
        return qs

    def perform_create(self, s):
        s.save(user=self.request.user, **({"type": self.fixed_type} if self.fixed_type else {}))


class IncomeViewSet(TransactionViewSet):
    fixed_type = "income"


class ExpenseViewSet(TransactionViewSet):
    fixed_type = "expense"


class BudgetViewSet(OwnedViewSet):
    serializer_class = BudgetSerializer

    def get_queryset(self):
        qs = Budget.objects.filter(user=self.request.user).select_related("category", "user")
        m = self.request.query_params.get("month")  # YYYY-MM
        if m:
            y, mo = m.split("-")[:2]
            qs = qs.filter(month__year=y, month__month=mo)
        return qs


def _sum(qs):
    return qs.aggregate(s=Sum("amount"))["s"] or Decimal("0")


@api_view(["GET"])
def dashboard(request):
    u, today = request.user, date.today()
    tx = Transaction.objects.filter(user=u)
    inc, exp = _sum(tx.filter(type="income")), _sum(tx.filter(type="expense"))
    month = tx.filter(date__year=today.year, date__month=today.month)
    m_inc, m_exp = _sum(month.filter(type="income")), _sum(month.filter(type="expense"))
    overall = Budget.objects.filter(user=u, category=None, month=today.replace(day=1)).first()
    months = []
    y, m = today.year, today.month
    for _ in range(6):
        months.append((y, m)); m -= 1
        if m == 0: m, y = 12, y - 1
    months.reverse()
    start = date(months[0][0], months[0][1], 1)
    rows = tx.filter(date__gte=start).annotate(m=TruncMonth("date")).values("m", "type").annotate(t=Sum("amount"))
    lookup = {(r["m"].year, r["m"].month, r["type"]): float(r["t"]) for r in rows}
    monthly = [{"month": f"{yy}-{mm:02d}", "income": lookup.get((yy, mm, "income"), 0),
                "expense": lookup.get((yy, mm, "expense"), 0)} for yy, mm in months]
    cats = month.filter(type="expense").values("category__name").annotate(total=Sum("amount")).order_by("-total")
    return Response({
        "totals": {"income": inc, "expense": exp, "balance": inc - exp, "transactions": tx.count()},
        "month": {"income": m_inc, "expense": m_exp, "savings": m_inc - m_exp,
                  "budget": overall.amount if overall else None,
                  "budget_used_percent": round(float(m_exp / overall.amount * 100), 1) if overall else None},
        "monthly": monthly,
        "categories": [{"name": c["category__name"], "total": float(c["total"])} for c in cats],
        "recent": TransactionSerializer(tx.select_related("category")[:6], many=True, context={"request": request}).data,
    })


TRUNC = {"daily": (TruncDay, "%Y-%m-%d"), "weekly": (TruncWeek, "%Y-%m-%d"),
         "monthly": (TruncMonth, "%b %Y"), "yearly": (TruncYear, "%Y")}


@api_view(["GET"])
def report(request):
    p = request.query_params
    period = p.get("period", "monthly")
    if period not in TRUNC:
        return Response({"detail": "period must be daily, weekly, monthly or yearly"}, status=400)
    today = date.today()
    days = {"daily": 30, "weekly": 84, "monthly": 365, "yearly": 365 * 5}[period]
    d_from, d_to = p.get("date_from") or str(today - timedelta(days=days)), p.get("date_to") or str(today)
    fn, fmt = TRUNC[period]
    qs = Transaction.objects.filter(user=request.user, date__gte=d_from, date__lte=d_to)
    rows = qs.annotate(p=fn("date")).values("p").annotate(
        income=Sum("amount", filter=Q(type="income")), expense=Sum("amount", filter=Q(type="expense"))).order_by("p")
    series = []
    for r in rows:
        i, e = float(r["income"] or 0), float(r["expense"] or 0)
        series.append({"period": r["p"].strftime(fmt), "income": i, "expense": e, "savings": i - e})
    cats = qs.filter(type="expense").values("category__name").annotate(total=Sum("amount"), count=Count("id")).order_by("-total")
    ti, te = sum(s["income"] for s in series), sum(s["expense"] for s in series)
    return Response({
        "period": period, "date_from": d_from, "date_to": d_to, "series": series,
        "categories": [{"name": c["category__name"], "total": float(c["total"]), "count": c["count"]} for c in cats],
        "summary": {"income": ti, "expense": te, "savings": ti - te,
                    "savings_rate": round((ti - te) / ti * 100, 1) if ti else 0},
    })


@api_view(["GET"])
def export_csv(request):
    p = request.query_params
    qs = Transaction.objects.filter(user=request.user).select_related("category")
    if p.get("date_from"): qs = qs.filter(date__gte=p["date_from"])
    if p.get("date_to"): qs = qs.filter(date__lte=p["date_to"])
    if p.get("type") in ("income", "expense"): qs = qs.filter(type=p["type"])
    resp = HttpResponse(content_type="text/csv")
    resp["Content-Disposition"] = 'attachment; filename="transactions.csv"'
    w = csv.writer(resp)
    w.writerow(["Transaction ID", "Date", "Type", "Category", "Amount", "Description", "Payment Method", "Created"])
    for t in qs:
        w.writerow([t.id, t.date, t.type, t.category.name, t.amount, t.description, t.payment_method, t.created_at.isoformat()])
    return resp


@api_view(["POST"])
def demo_data(request):
    if request.user.transactions.exists():
        return Response({"detail": "You already have transactions; demo data is only added to empty accounts."}, status=400)
    return Response({"created": create_demo_data(request.user)}, status=status.HTTP_201_CREATED)
