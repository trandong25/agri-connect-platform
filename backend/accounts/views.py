from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from . import serializers
from .models import KOC, Address, Farmer, User
from .permissions import IsFarmer, IsKOC


class UserViewSet(viewsets.ViewSet, generics.CreateAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = serializers.UserSerializer
    permission_classes = [permissions.AllowAny]

    @action(
        methods=["get", "patch"],
        url_path="current-user",
        detail=False,
        permission_classes=[permissions.IsAuthenticated],
    )
    def current_user(self, request):
        user = request.user

        if request.method == "PATCH":
            serializer = serializers.SimpleUserSerializer(
                user,
                data=request.data,
                partial=True,
            )
            serializer.is_valid(raise_exception=True)
            user = serializer.save()

        return Response(
            serializers.UserSerializer(user).data,
            status=status.HTTP_200_OK,
        )

class FarmerViewSet(viewsets.ViewSet, generics.CreateAPIView):
    queryset = Farmer.objects.all()
    serializer_class = serializers.FarmerSerializer
    permission_classes = [
        permissions.IsAuthenticated,
        IsFarmer
    ]

    def perform_create(self, serializer):
        if Farmer.objects.filter(user=self.request.user).exists():
            raise ValidationError("Tài khoản này đã có hồ sơ nông dân.")

        serializer.save(user=self.request.user)

    @action(methods=["get", "patch"],url_path="current-profile",detail=False)
    def current_profile(self, request):
        farmer = get_object_or_404(
            Farmer,
            user=request.user
        )

        if request.method == "PATCH":
            serializer = self.get_serializer(
                farmer,
                data=request.data,
                partial=True
            )
            serializer.is_valid(raise_exception=True)
            farmer = serializer.save()

        serializer = self.get_serializer(farmer)

        return Response(serializer.data, status=status.HTTP_200_OK)


class KOCViewSet(viewsets.ViewSet, generics.CreateAPIView):
    queryset = KOC.objects.all()
    serializer_class = serializers.KOCSerializer
    permission_classes = [permissions.IsAuthenticated,IsKOC]

    def perform_create(self, serializer):
        if KOC.objects.filter(user=self.request.user).exists():
            raise ValidationError(
                "Tài khoản này đã có hồ sơ KOC/KOL."
            )

        serializer.save(user=self.request.user)

    @action(methods=["get", "patch"],url_path="current-profile",detail=False)
    def current_profile(self, request):
        koc = get_object_or_404(KOC,user=request.user)

        if request.method == "PATCH":
            serializer = self.get_serializer(
                koc,
                data=request.data,
                partial=True
            )
            serializer.is_valid(raise_exception=True)
            koc = serializer.save()

        serializer = self.get_serializer(koc)

        return Response(serializer.data,status=status.HTTP_200_OK)

class LoginView(TokenObtainPairView):
    serializer_class = serializers.LoginSerializer
    permission_classes = [permissions.AllowAny]

class AddressViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(
            user=self.request.user
        ).order_by("-is_default", "-created_date")

    def list(self, request):
        addresses = self.get_queryset()

        serializer = serializers.AddressSerializer(addresses,many=True)

        return Response(serializer.data,status=status.HTTP_200_OK)

    def create(self, request):
        serializer = serializers.AddressSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            is_first_address = not Address.objects.filter(
                user=request.user
            ).exists()

            address = serializer.save(user=request.user,is_default=is_first_address)

        return Response(serializers.AddressSerializer(address).data,status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        address = get_object_or_404(
            self.get_queryset(),
            pk=pk,
        )

        serializer = serializers.AddressSerializer(address,data=request.data,partial=True)
        serializer.is_valid(raise_exception=True)
        address = serializer.save()

        return Response(serializers.AddressSerializer(address).data,status=status.HTTP_200_OK)

    def destroy(self, request, pk=None):
        with transaction.atomic():
            address = get_object_or_404(
                self.get_queryset().select_for_update(),
                pk=pk,
            )

            was_default = address.is_default
            address.delete()

            if was_default:
                replacement = (
                    Address.objects.filter(user=request.user)
                    .order_by("-created_date", "-id")
                    .first()
                )

                if replacement:
                    replacement.is_default = True
                    replacement.save(
                        update_fields=[
                            "is_default",
                            "updated_date",
                        ]
                    )

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(methods=["patch"],detail=True,url_path="set-default",)
    def set_default(self, request, pk=None):
        with transaction.atomic():
            address = get_object_or_404(
                self.get_queryset().select_for_update(),
                pk=pk
            )

            now = timezone.now()

            (
                Address.objects.filter(
                    user=request.user,
                    is_default=True
                )
                .exclude(pk=address.pk)
                .update(
                    is_default=False,
                    updated_date=now
                )
            )

            if not address.is_default:
                address.is_default = True
                address.save(
                    update_fields=[
                        "is_default",
                        "updated_date"
                    ]
                )

        return Response(serializers.AddressSerializer(address).data,status=status.HTTP_200_OK)