from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    path("register/", views.RegisterView.as_view()),
    path("login/", TokenObtainPairView.as_view()),
    path("refresh/", TokenRefreshView.as_view()),
    path("profile/", views.ProfileView.as_view()),
    path("change-password/", views.ChangePasswordView.as_view()),
    path("forgot-password/", views.ForgotPasswordView.as_view()),
]
