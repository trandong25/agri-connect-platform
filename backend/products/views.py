from django.db import transaction
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, parsers, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.models import Farmer
from accounts.permissions import IsFarmer

from . import serializers
from .models import Category, Product, ProductImage, Unit


class CategoryViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = serializers.CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class UnitViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Unit.objects.all()
    serializer_class = serializers.UnitSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class ProductViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    serializer_class = serializers.PublicProductSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        "category": ["exact"],
        "price": ["gte", "lte"]
    }
    search_fields = ["name"]
    ordering_fields = ["price", "created_date"]

    def get_queryset(self):
        return (Product.objects.filter(status="AVAILABLE")
                .select_related("farmer", "category", "unit")
                .prefetch_related("images", "images__quality_result"))


class FarmerProductViewSet(viewsets.ViewSet, generics.ListCreateAPIView, generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = serializers.ProductSerializer
    permission_classes = [IsFarmer]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return ((Product.objects.filter(farmer__user=self.request.user)
                .select_related("farmer", "category", "unit"))
                .prefetch_related("images", "images__quality_result"))

    def perform_create(self, serializer):
        farmer = get_object_or_404(Farmer, user=self.request.user)
        serializer.save(farmer=farmer)

    @action(methods=["get", "post"], detail=True, url_path="images",
            parser_classes=[parsers.MultiPartParser, parsers.FormParser])
    def images(self, request, pk=None):
        product = self.get_object()

        if request.method == "POST":
            serializer = serializers.ProductImageSerializer(data=request.data, context=self.get_serializer_context())
            serializer.is_valid(raise_exception=True)
            product_image = serializer.save(product=product)

            response_serializer = serializers.ProductImageSerializer(
                product_image, context=self.get_serializer_context())

            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        product_images = product.images.select_related("quality_result").all()

        serializer = serializers.ProductImageSerializer(
            product_images, many=True, context=self.get_serializer_context())

        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=["delete"], detail=True, url_path=r"images/(?P<image_id>\d+)", url_name="image-detail")
    def image_detail(self, request, pk=None, image_id=None):
        with transaction.atomic():
            product = self.get_object()
            product_image = get_object_or_404(ProductImage, pk=image_id, product=product)

            was_primary = product_image.is_primary
            product_image.delete()

            if was_primary:
                replacement = (product.images.filter(quality_result__is_acceptable=True)
                               .order_by("display_order", "created_date").first())

                if replacement:
                    replacement.is_primary = True
                    replacement.save(update_fields=["is_primary", "updated_date"])

            acceptable_images_exist = product.images.filter(
                quality_result__is_acceptable=True).exists()

            if product.status == "AVAILABLE" and not acceptable_images_exist:
                product.status = "HIDDEN"
                product.save(update_fields=["status", "updated_date"])

        return Response(status=status.HTTP_204_NO_CONTENT)