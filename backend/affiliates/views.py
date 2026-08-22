from django.shortcuts import get_object_or_404
from rest_framework import generics, parsers, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsApprovedKOC

from . import serializers
from .models import AffiliateLink, Commission, PromotionPost, PromotionPostMedia


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
        owner_actions = [
            "create", "partial_update", "destroy",
            "mine", "media", "media_detail"
        ]

        if self.action in owner_actions:
            return [permissions.IsAuthenticated(), IsApprovedKOC()]

        return [permissions.AllowAny()]

    def get_queryset(self):
        queryset = (PromotionPost.objects.select_related(
            "affiliate_link", "affiliate_link__koc",
            "affiliate_link__product"
        ).prefetch_related("media"))

        owner_actions = [
            "partial_update", "destroy", "mine",
            "media", "media_detail"
        ]

        if self.action in owner_actions:
            return queryset.filter(affiliate_link__koc__user=self.request.user)

        return queryset.filter(status="PUBLISHED")

    @action(methods=["get"], detail=False, url_path="mine")
    def mine(self, request):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(
        methods=["post"], detail=True, url_path="media",
        parser_classes=[parsers.MultiPartParser, parsers.FormParser]
    )
    def media(self, request, pk=None):
        promotion_post = self.get_object()
        context = self.get_serializer_context()
        context["promotion_post"] = promotion_post

        serializer = serializers.PromotionPostMediaSerializer(
            data=request.data, context=context
        )
        serializer.is_valid(raise_exception=True)
        media = serializer.save()

        response_serializer = serializers.PromotionPostMediaSerializer(
            media, context=context
        )

        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(
        methods=["delete"], detail=True,
        url_path=r"media/(?P<media_id>\d+)",
        url_name="media-detail"
    )
    def media_detail(self, request, pk=None, media_id=None):
        promotion_post = self.get_object()
        media = get_object_or_404(
            PromotionPostMedia,
            pk=media_id,
            promotion_post=promotion_post
        )
        media.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


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