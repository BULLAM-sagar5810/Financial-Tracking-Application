from django.urls import include, path
from rest_framework.routers import DefaultRouter
from . import views

r = DefaultRouter()
r.register("categories", views.CategoryViewSet, basename="category")
r.register("transactions", views.TransactionViewSet, basename="transaction")
r.register("income", views.IncomeViewSet, basename="income")
r.register("expenses", views.ExpenseViewSet, basename="expense")
r.register("budgets", views.BudgetViewSet, basename="budget")

urlpatterns = [
    path("dashboard/", views.dashboard),
    path("reports/", views.report),
    path("reports/export/", views.export_csv),
    path("demo-data/", views.demo_data),
    path("", include(r.urls)),
]
