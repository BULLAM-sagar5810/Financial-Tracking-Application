from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import UserProfile


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "first_name", "last_name"]

    def validate_email(self, v):
        if User.objects.filter(email__iexact=v).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return v

    def validate_password(self, v):
        validate_password(v)
        return v

    def create(self, d):
        return User.objects.create_user(**d)  # hashes the password (PBKDF2)


class ProfileSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(source="profile.phone", required=False, allow_blank=True)
    currency = serializers.CharField(source="profile.currency", required=False)

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "phone", "currency", "date_joined"]
        read_only_fields = ["id", "username", "date_joined"]

    def update(self, inst, d):
        prof = d.pop("profile", {})
        for k, v in d.items():
            setattr(inst, k, v)
        inst.save()
        p, _ = UserProfile.objects.get_or_create(user=inst)
        for k, v in prof.items():
            setattr(p, k, v)
        p.save()
        return inst
