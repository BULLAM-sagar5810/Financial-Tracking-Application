from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from finance.utils import seed_categories
from .models import UserProfile
from .serializers import ProfileSerializer, RegisterSerializer


class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def perform_create(self, s):
        u = s.save()
        UserProfile.objects.create(user=u)
        seed_categories(u)


class ProfileView(APIView):
    def get(self, request):
        UserProfile.objects.get_or_create(user=request.user)
        return Response(ProfileSerializer(request.user).data)

    def put(self, request):
        UserProfile.objects.get_or_create(user=request.user)
        s = ProfileSerializer(request.user, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data)


class ChangePasswordView(APIView):
    def post(self, request):
        old, new = request.data.get("old_password", ""), request.data.get("new_password", "")
        if not request.user.check_password(old):
            return Response({"old_password": ["Current password is incorrect."]}, status=400)
        try:
            validate_password(new, request.user)
        except ValidationError as e:
            return Response({"new_password": list(e.messages)}, status=400)
        request.user.set_password(new)
        request.user.save()
        return Response({"detail": "Password updated."})


class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email", "")
        if User.objects.filter(email__iexact=email).exists():
            send_mail("Password reset", "Password reset requested. (Demo: configure a real SMTP backend in settings.)",
                      "noreply@finance.local", [email])
        return Response({"detail": "If that email is registered, reset instructions have been sent."})
