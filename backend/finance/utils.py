import random
from datetime import date
from decimal import Decimal

from .models import Budget, Category, Transaction

INCOME_CATS = ["Salary", "Freelancing", "Business", "Investments", "Other Income"]
EXPENSE_CATS = ["Food", "Shopping", "Transportation", "Education", "Healthcare", "Rent", "Entertainment", "Bills", "Other"]


def seed_categories(user):
    for n in INCOME_CATS:
        Category.objects.get_or_create(user=user, name=n, type="income")
    for n in EXPENSE_CATS:
        Category.objects.get_or_create(user=user, name=n, type="expense")


def create_demo_data(user):
    """Creates ~6 months of realistic transactions + budgets for the user. Returns count created."""
    seed_categories(user)
    cat = {(c.name, c.type): c for c in user.categories.all()}
    rnd = random.Random(42)
    today = date.today()
    out = []
    pm = ["Cash", "UPI", "Credit Card", "Debit Card", "Bank Transfer"]
    for back in range(6):
        y, m = today.year, today.month - back
        while m <= 0:
            m += 12; y -= 1
        out.append(Transaction(user=user, type="income", category=cat[("Salary", "income")], amount=Decimal("65000"),
                               description="Monthly salary", payment_method="Bank Transfer", date=date(y, m, 1)))
        if back % 2 == 0:
            out.append(Transaction(user=user, type="income", category=cat[("Freelancing", "income")],
                                   amount=Decimal(rnd.randint(8, 20) * 1000), description="Freelance project",
                                   payment_method="UPI", date=date(y, m, 12)))
        out.append(Transaction(user=user, type="expense", category=cat[("Rent", "expense")], amount=Decimal("18000"),
                               description="House rent", payment_method="Bank Transfer", date=date(y, m, 3)))
        for name, lo, hi, n in [("Food", 150, 900, 8), ("Transportation", 100, 800, 4), ("Shopping", 500, 4000, 2),
                                ("Bills", 300, 2500, 3), ("Entertainment", 200, 1500, 2), ("Healthcare", 300, 2000, 1),
                                ("Education", 500, 3000, 1)]:
            for _ in range(n):
                d = min(date(y, m, rnd.randint(2, 27)), today)
                out.append(Transaction(user=user, type="expense", category=cat[(name, "expense")],
                                       amount=Decimal(rnd.randint(lo, hi)), description=f"{name} spending",
                                       payment_method=rnd.choice(pm), date=d))
    Transaction.objects.bulk_create(out)
    first = today.replace(day=1)
    Budget.objects.get_or_create(user=user, category=None, month=first, defaults={"amount": Decimal("45000")})
    for name, amt in [("Food", 6000), ("Shopping", 5000), ("Transportation", 3000), ("Entertainment", 2500)]:
        Budget.objects.get_or_create(user=user, category=cat[(name, "expense")], month=first, defaults={"amount": Decimal(amt)})
    return len(out)
