from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from finance.utils import create_demo_data
from users.models import UserProfile


class Command(BaseCommand):
    help = "Create demo user (demo / Demo@12345) with sample data"

    def handle(self, *a, **o):
        u, created = User.objects.get_or_create(username="demo", defaults={"email": "demo@example.com", "first_name": "Demo", "last_name": "User"})
        if created:
            u.set_password("Demo@12345"); u.save()
        UserProfile.objects.get_or_create(user=u)
        if not u.transactions.exists():
            n = create_demo_data(u)
            self.stdout.write(self.style.SUCCESS(f"Created {n} demo transactions"))
        self.stdout.write(self.style.SUCCESS("Login: demo / Demo@12345"))
