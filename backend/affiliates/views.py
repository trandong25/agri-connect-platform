from rest_framework import generics, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsApprovedKOC

from . import serializers
from .models import AffiliateLink, Commission, PromotionPost


class AffiliateLinkViewSet(viewsets.ViewSet, generics.ListCreateAPIView, generics.RetrieveAPIView):
    serializer_class = serializers.AffiliateLinkSerializer
    permission_classes = [permissions.IsAuthenticated, IsApprovedKOC]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return AffiliateLink.objects.none()

        return (AffiliateLink.objects.filter(koc__user=self.request.user)
                .select_related("koc", "koc__user", "product"))


class PromotionPostViewSet(
    viewsets.ViewSet,
    generics.ListCreateAPIView,
    generics.RetrieveUpdateDestroyAPIView
):
    serializer_class = serializers.PromotionPostSerializer
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_permissions(self):
        if self.action in ["create", "partial_update", "destroy", "mine"]:
            return [permissions.IsAuthenticated(), IsApprovedKOC()]

        return [permissions.AllowAny()]

    def get_queryset(self):
        queryset = PromotionPost.objects.select_related(
            "affiliate_link", "affiliate_link__koc",
            "affiliate_link__product"
        )

        if self.action in ["partial_update", "destroy", "mine"]:
            return queryset.filter(affiliate_link__koc__user=self.request.user)

        return queryset.filter(status="PUBLISHED")

    @action(methods=["get"], detail=False, url_path="mine")
    def mine(self, request):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class CommissionViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    serializer_class = serializers.CommissionSerializer
    permission_classes = [permissions.IsAuthenticated, IsApprovedKOC]
    http_method_names = ["get", "head", "options"]

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Commission.objects.none()

        return (Commission.objects.filter(affiliate_link__koc__user=self.request.user)
                .select_related(
                    "affiliate_link", "affiliate_link__koc",
                    "order_item", "order_item__product",
                    "order_item__seller_order", "order_item__seller_order__order"
                ))