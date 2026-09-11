from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import KOC, Address, Farmer, User


class SimpleUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("first_name","last_name","phone_number","avatar")

    def validate_phone_number(self, value):
        return value or None

    def to_representation(self, instance):
        data = super().to_representation(instance)

        if instance.avatar:
            data["avatar"] = instance.avatar.url

        return data

class FarmerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Farmer
        fields = ("id", "farm_name","address","description",
            "verification_document","approval_status","approved_at",
            "created_date","updated_date")
        read_only_fields = ("id","approval_status","approved_at",
            "created_date","updated_date")

    def to_representation(self, instance):
        data = super().to_representation(instance)

        if instance.verification_document:
            data["verification_document"] = (
                instance.verification_document.url
            )

        return data


class KOCSerializer(serializers.ModelSerializer):
    class Meta:
        model = KOC
        fields = ("id","koc_name","social_platform","social_url",
            "follower","approval_status","approved_at","created_date","updated_date")
        read_only_fields = ("id","approval_status","approved_at",
            "created_date","updated_date")

    def validate_follower(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Số người theo dõi không được nhỏ hơn 0."
            )

        return value

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ("id","recipient_name","phone_number","province",
            "ward","address_detail","is_default","created_date","updated_date")
        read_only_fields = ("id","is_default","created_date","updated_date")

class UserSerializer(SimpleUserSerializer):
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = SimpleUserSerializer.Meta.fields + (
            "id",
            "username",
            "email",
            "password",
            "role",
            "is_phone_verified",
            "date_joined",
        )
        read_only_fields = (
            "id",
            "is_phone_verified",
            "date_joined",
        )
        extra_kwargs = {
            "role": {"required": True},
        }

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email này đã được sử dụng.")

        return value.lower()

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    login = serializers.CharField()
    password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )

    def validate(self, attrs):
        login = attrs["login"]
        password = attrs["password"]

        user_by_email = User.objects.filter(email__iexact=login).first()
        username = user_by_email.username if user_by_email else login
        user = authenticate(username=username, password=password)

        if user is None:
            raise serializers.ValidationError(
                "Tên đăng nhập/email hoặc mật khẩu không đúng."
            )

        refresh = RefreshToken.for_user(user)

        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": UserSerializer(user).data,
        }