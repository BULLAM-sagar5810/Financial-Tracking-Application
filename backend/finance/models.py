from decimal import Decimal
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from django.db import models

INCOME, EXPENSE = "income", "expense"
TYPES = [(INCOME, "Income"), (EXPENSE, "Expense")]
PAYMENT_METHODS = [(m, m) for m in ["Cash", "UPI", "Credit Card", "Debit Card", "Bank Transfer"]]


class Category(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="categories")
    name = models.CharField(max_length=50)
    type = models.CharField(max_length=7, choices=TYPES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "name", "type")
        ordering = ["type", "name"]
        verbose_name_plural = "categories"

    def __str__(self):
        return f"{self.name} ({self.type})"


class Transaction(models.Model):
    """Single table for income and expense records (type column distinguishes them)."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="transactions")
    type = models.CharField(max_length=7, choices=TYPES, db_index=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="transactions")
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
    description = models.CharField(max_length=255, blank=True)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default="Cash")
    date = models.DateField(db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-id"]
        constraints = [models.CheckConstraint(condition=models.Q(amount__gt=0), name="txn_amount_positive")]


class Budget(models.Model):
    """category=NULL means the overall monthly budget."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="budgets")
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.CASCADE, related_name="budgets")
    month = models.DateField(help_text="First day of the budget month")
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "category", "month")
        ordering = ["-month", "category__name"]
