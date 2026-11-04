from decimal import Decimal

from django.db.models import Sum
from rest_framework import serializers

from .models import Budget, Category, Transaction


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "type", "created_at"]

    def validate(self, a):
        u = self.context["request"].user
        qs = Category.objects.filter(user=u, name__iexact=a.get("name"), type=a.get("type"))
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This category already exists.")
        return a


class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    user_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Transaction
        fields = ["id", "user_id", "type", "category", "category_name", "amount", "description",
                  "payment_method", "date", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]

    def validate_category(self, c):
        if c.user_id != self.context["request"].user.id:
            raise serializers.ValidationError("Invalid category.")
        return c

    def validate(self, a):
        t = a.get("type", getattr(self.instance, "type", None))
        c = a.get("category", getattr(self.instance, "category", None))
        if c and t and c.type != t:
            raise serializers.ValidationError({"category": f"Category '{c.name}' is not an {t} category."})
        return a


class BudgetSerializer(serializers.ModelSerializer):
    category_name = serializers.SerializerMethodField()
    spent = serializers.SerializerMethodField()
    remaining = serializers.SerializerMethodField()
    percent_used = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = Budget
        fields = ["id", "category", "category_name", "month", "amount", "spent", "remaining", "percent_used", "status"]

    def get_category_name(self, b):
        return b.category.name if b.category else "Overall Monthly Budget"

    def get_spent(self, b):
        qs = Transaction.objects.filter(user=b.user, type="expense", date__year=b.month.year, date__month=b.month.month)
        if b.category_id:
            qs = qs.filter(category_id=b.category_id)
        return qs.aggregate(s=Sum("amount"))["s"] or Decimal("0")

    def get_remaining(self, b):
        return b.amount - self.get_spent(b)

    def get_percent_used(self, b):
        return round(float(self.get_spent(b) / b.amount * 100), 1)

    def get_status(self, b):
        p = self.get_percent_used(b)
        return "exceeded" if p >= 100 else "warning" if p >= 80 else "ok"

    def validate_month(self, m):
        return m.replace(day=1)

    def validate_category(self, c):
        if c and (c.user_id != self.context["request"].user.id or c.type != "expense"):
            raise serializers.ValidationError("Invalid expense category.")
        return c

    def validate(self, a):
        u = self.context["request"].user
        qs = Budget.objects.filter(user=u, category=a.get("category", getattr(self.instance, "category", None)),
                                   month=a.get("month", getattr(self.instance, "month", None)))
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A budget already exists for this category and month.")
        return a
