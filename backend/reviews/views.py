from rest_framework import generics, permissions, viewsets

from accounts.permissions import IsConsumer

from . import serializers
from .models import Review


class ReviewViewSet(
    viewsets.ViewSet,
    generics.RetrieveUpdateDestroyAPIView
):
    serializer_class = serializers.ReviewSerializer
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_permissions(self):
        if self.action == "retrieve":
            return [permissions.AllowAny()]

        return [permissions.IsAuthenticated(), IsConsumer()]

    def get_queryset(self):
        queryset = Review.objects.select_related(
            "order_item",
            "order_item__product",
            "order_item__seller_order",
            "order_item__seller_order__order"
        )

        if self.action in ["update", "partial_update", "destroy"]:
            if not self.request.user.is_authenticated:
                return Review.objects.none()

            return queryset.filter(
                order_item__seller_order__order__consumer=self.request.user
            )

        return queryset