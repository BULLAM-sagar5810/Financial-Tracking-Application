from decimal import Decimal
from django.contrib.auth.models import User
from rest_framework.test import APITestCase


class FinanceAPITests(APITestCase):
    def register_login(self, name="alice"):
        r = self.client.post("/api/auth/register/", {"username": name, "email": f"{name}@x.com", "password": "Str0ng!Pass99"}, format="json")
        self.assertEqual(r.status_code, 201, r.data)
        r = self.client.post("/api/auth/login/", {"username": name, "password": "Str0ng!Pass99"}, format="json")
        self.assertEqual(r.status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + r.data["access"])

    def cat(self, name, t):
        return next(c["id"] for c in self.client.get(f"/api/categories/?type={t}").data if c["name"] == name)

    def add(self, t, cat, amt, date="2026-01-10"):
        return self.client.post("/api/transactions/", {"type": t, "category": self.cat(cat, t), "amount": amt, "date": date,
                                                       "description": "x", "payment_method": "UPI"}, format="json")

    def test_registration_hashes_password_and_seeds_categories(self):
        self.register_login()
        self.assertNotEqual(User.objects.get(username="alice").password, "Str0ng!Pass99")
        self.assertEqual(len(self.client.get("/api/categories/").data), 14)

    def test_requires_auth(self):
        self.assertEqual(self.client.get("/api/transactions/").status_code, 401)

    def test_crud_and_dashboard(self):
        self.register_login()
        r = self.add("income", "Salary", "50000"); self.assertEqual(r.status_code, 201)
        r2 = self.add("expense", "Food", "1200.50"); self.assertEqual(r2.status_code, 201)
        r3 = self.client.patch(f"/api/transactions/{r2.data['id']}/", {"amount": "1000"}, format="json")
        self.assertEqual(Decimal(r3.data["amount"]), Decimal("1000"))
        d = self.client.get("/api/dashboard/").data
        self.assertEqual(Decimal(str(d["totals"]["balance"])), Decimal("49000"))
        self.assertEqual(d["totals"]["transactions"], 2)
        self.assertEqual(self.client.delete(f"/api/transactions/{r2.data['id']}/").status_code, 204)
        self.assertEqual(self.client.get("/api/dashboard/").data["totals"]["transactions"], 1)

    def test_validation(self):
        self.register_login()
        self.assertEqual(self.add("expense", "Food", "-5").status_code, 400)
        bad = self.client.post("/api/transactions/", {"type": "expense", "category": self.cat("Salary", "income"),
                                                      "amount": 5, "date": "2026-01-01"}, format="json")
        self.assertEqual(bad.status_code, 400)

    def test_budget_utilisation(self):
        self.register_login()
        self.add("expense", "Food", "900", "2026-03-05")
        r = self.client.post("/api/budgets/", {"category": self.cat("Food", "expense"), "month": "2026-03-01", "amount": "1000"}, format="json")
        self.assertEqual(r.status_code, 201, r.data)
        self.assertEqual(r.data["status"], "warning"); self.assertEqual(r.data["percent_used"], 90.0)
        self.assertEqual(Decimal(r.data["remaining"]), Decimal("100"))

    def test_reports_and_csv(self):
        self.register_login()
        self.add("income", "Salary", "1000", "2026-02-01"); self.add("expense", "Rent", "400", "2026-02-02")
        r = self.client.get("/api/reports/?period=monthly&date_from=2026-01-01&date_to=2026-12-31").data
        self.assertEqual(r["summary"]["savings"], 600)
        c = self.client.get("/api/reports/export/")
        self.assertEqual(c["Content-Type"], "text/csv"); self.assertIn("Rent", c.content.decode())

    def test_user_data_isolation(self):
        self.register_login("alice")
        tid = self.add("income", "Salary", "100").data["id"]
        self.client.credentials()
        self.register_login("bob")
        self.assertEqual(self.client.get("/api/transactions/").data, [])
        self.assertEqual(self.client.get(f"/api/transactions/{tid}/").status_code, 404)
        self.assertEqual(self.client.delete(f"/api/transactions/{tid}/").status_code, 404)

    def test_demo_data(self):
        self.register_login()
        self.assertEqual(self.client.post("/api/demo-data/").status_code, 201)
        self.assertGreater(self.client.get("/api/dashboard/").data["totals"]["transactions"], 50)
