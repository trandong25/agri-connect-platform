from django.conf import settings
from django.db import transaction
from django.db.models import Avg, Count
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, parsers, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.models import Farmer
from accounts.permissions import IsApprovedFarmer, IsConsumer
from reviews import serializers as review_serializers
from reviews.models import Review

from . import serializers
from .models import Category, Product, ProductImage, Unit
from .services.image_analysis import analyze_image_bytes


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

    def get_permissions(self):
        if self.action == "reviews" and self.request.method == "POST":
            return [permissions.IsAuthenticated(), IsConsumer()]

        return [permissions.AllowAny()]

    def get_queryset(self):
        queryset = (
            Product.objects
            .select_related("farmer", "category", "unit")
            .prefetch_related("images", "images__quality_result")
            .annotate(
                average_rating=Avg("order_items__review__rating"),
                review_count=Count("order_items__review", distinct=True)
            )
        )

        if getattr(self, "action", None) == "reviews":
            return queryset

        return queryset.filter(status="AVAILABLE")

    @action(methods=["get", "post"], detail=True, url_path="reviews")
    def reviews(self, request, pk=None):
        product = self.get_object()

        if request.method == "POST":
            context = self.get_serializer_context()
            context["product"] = product

            serializer = review_serializers.ReviewSerializer(
                data=request.data,
                context=context
            )
            serializer.is_valid(raise_exception=True)
            review = serializer.save()

            response_serializer = review_serializers.ReviewSerializer(
                review,
                context=self.get_serializer_context()
            )

            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        reviews = Review.objects.filter(
            order_item__product=product
        ).select_related("order_item")

        page = self.paginate_queryset(reviews)

        if page is not None:
            serializer = review_serializers.ReviewSerializer(
                page, many=True, context=self.get_serializer_context()
            )
            return self.get_paginated_response(serializer.data)

        serializer = review_serializers.ReviewSerializer(
            reviews, many=True, context=self.get_serializer_context()
        )

        return Response(serializer.data, status=status.HTTP_200_OK)


class FarmerProductViewSet(viewsets.ViewSet, generics.ListCreateAPIView, generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = serializers.ProductSerializer
    permission_classes = [permissions.IsAuthenticated, IsApprovedFarmer]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return (
            Product.objects.filter(farmer__user=self.request.user).select_related("farmer", "category", "unit")
            .prefetch_related("images", "images__quality_result")
        )

    def perform_create(self, serializer):
        farmer = get_object_or_404(Farmer, user=self.request.user)
        serializer.save(farmer=farmer)

    @action(methods=["post"], detail=False, url_path="analyze-image",
            parser_classes=[parsers.MultiPartParser, parsers.FormParser]
            )
    def analyze_image(self, request):
        serializer = serializers.ProductImageAnalysisSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        image = serializer.validated_data["image"]

        result = analyze_image_bytes(image.read(), settings.CV_MODEL_PATH, settings.CV_QUALITY_CONFIG_PATH,
                                     settings.CV_DETECTION_CONFIDENCE, settings.CV_SUGGESTION_CONFIDENCE,
                                     settings.CV_DEVICE
                                     )
        print("CV ANALYSIS:", result)
        return Response(result, status=status.HTTP_200_OK)

    @action(methods=["get", "post"], detail=True, url_path="images",
            parser_classes=[parsers.MultiPartParser, parsers.FormParser]
            )
    def images(self, request, pk=None):
        product = self.get_object()

        if request.method == "POST":
            serializer = serializers.ProductImageSerializer(
                data=request.data,
                context=self.get_serializer_context()
            )
            serializer.is_valid(raise_exception=True)

            image = serializer.validated_data["image"]

            analysis_result = analyze_image_bytes(
                image.read(), settings.CV_MODEL_PATH, settings.CV_QUALITY_CONFIG_PATH,
                settings.CV_DETECTION_CONFIDENCE, settings.CV_SUGGESTION_CONFIDENCE, settings.CV_DEVICE
            )

            image.seek(0)

            if not analysis_result.get("can_continue", False):
                return Response(
                    {"detail": analysis_result.get("message") or "Ảnh chưa đạt yêu cầu.",
                     "analysis": analysis_result
                     },
                    status=status.HTTP_400_BAD_REQUEST
                )

            with transaction.atomic():
                product_image = serializer.save(
                    product=product,
                    analysis_result=analysis_result
                )

                if not product.images.filter(is_primary=True).exists():
                    product_image.is_primary = True
                    product_image.save(
                        update_fields=["is_primary", "updated_date"]
                    )

            response_serializer = serializers.ProductImageSerializer(
                product_image,
                context=self.get_serializer_context()
            )

            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        product_images = (product.images.select_related("quality_result").all())

        serializer = serializers.ProductImageSerializer(
            product_images, many=True, context=self.get_serializer_context()
        )

        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=["post"], detail=True, url_path=r"images/(?P<image_id>\d+)/primary", url_name="image-primary")
    def set_primary_image(self, request, pk=None, image_id=None):
        with transaction.atomic():
            product = self.get_object()

            product_image = get_object_or_404(
                ProductImage, pk=image_id, product=product
            )

            quality_result = getattr(product_image, "quality_result", None)

            if not quality_result or not quality_result.is_acceptable:
                return Response({"detail": "Chỉ có thể chọn ảnh đạt yêu cầu làm ảnh chính."},
                                status=status.HTTP_400_BAD_REQUEST
                                )

            product.images.filter(is_primary=True).exclude(
                pk=product_image.id
            ).update(
                is_primary=False
            )

            if not product_image.is_primary:
                product_image.is_primary = True
                product_image.save(
                    update_fields=["is_primary", "updated_date"]
                )

        serializer = serializers.ProductImageSerializer(product_image, context=self.get_serializer_context())

        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=["delete"], detail=True, url_path=r"images/(?P<image_id>\d+)", url_name="image-detail")
    def image_detail(self, request, pk=None, image_id=None):
        with transaction.atomic():
            product = self.get_object()

            product_image = get_object_or_404(
                ProductImage, pk=image_id, product=product
            )

            was_primary = product_image.is_primary
            product_image.delete()

            if was_primary:
                replacement = (product.images.filter(quality_result__is_acceptable=True)
                               .order_by("display_order", "created_date").first()
                               )

                if replacement:
                    replacement.is_primary = True
                    replacement.save(update_fields=["is_primary", "updated_date"])

            acceptable_images_exist = product.images.filter(
                quality_result__is_acceptable=True
            ).exists()

            if product.status == "AVAILABLE" and not acceptable_images_exist:
                product.status = "HIDDEN"
                product.save(update_fields=["status", "updated_date"])

        return Response(status=status.HTTP_204_NO_CONTENT)
