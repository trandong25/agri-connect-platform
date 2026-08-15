from django.db.models import Q
from rest_framework import serializers

from .models import (
    Category,
    ImageQualityResult,
    Product,
    ProductImage,
    Unit,
)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = (
            "id",
            "name",
            "description",
        )
        read_only_fields = fields


class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = (
            "id",
            "name",
            "symbol",
        )
        read_only_fields = fields


class ImageQualityResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImageQualityResult
        fields = (
            "id",
            "raw_blur_score",
            "normalized_blur_score",
            "brightness_mean",
            "contrast_std",
            "dark_ratio",
            "bright_ratio",
            "is_blurry",
            "is_too_dark",
            "is_too_bright",
            "is_acceptable",
            "feedback",
            "created_date",
            "updated_date",
        )
        read_only_fields = fields


class ProductImageSerializer(serializers.ModelSerializer):
    quality_result = ImageQualityResultSerializer(
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = ProductImage
        fields = (
            "id",
            "image",
            "is_primary",
            "display_order",
            "quality_result",
            "created_date",
            "updated_date",
        )
        read_only_fields = (
            "id",
            "is_primary",
            "quality_result",
            "created_date",
            "updated_date",
        )

    def to_representation(self, instance):
        data = super().to_representation(instance)

        if instance.image:
            data["image"] = instance.image.url

        return data


class PublicProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = (
            "id",
            "image",
            "is_primary",
            "display_order",
        )
        read_only_fields = fields

    def to_representation(self, instance):
        data = super().to_representation(instance)

        if instance.image:
            data["image"] = instance.image.url

        return data


class ProductSerializer(serializers.ModelSerializer):
    farmer_name = serializers.CharField(
        source="farmer.farm_name",
        read_only=True,
    )
    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )
    unit_name = serializers.CharField(
        source="unit.name",
        read_only=True,
    )
    unit_symbol = serializers.CharField(
        source="unit.symbol",
        read_only=True,
    )
    images = ProductImageSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Product
        fields = (
            "id",
            "farmer",
            "farmer_name",
            "category",
            "category_name",
            "unit",
            "unit_name",
            "unit_symbol",
            "name",
            "description",
            "origin",
            "price",
            "stock_quantity",
            "minimum_order_quantity",
            "harvest_date",
            "expiry_date",
            "status",
            "rejection_reason",
            "images",
            "created_date",
            "updated_date",
        )
        read_only_fields = (
            "id",
            "farmer",
            "farmer_name",
            "category_name",
            "unit_name",
            "unit_symbol",
            "rejection_reason",
            "images",
            "created_date",
            "updated_date",
        )

    def validate(self, attrs):
        harvest_date = attrs.get(
            "harvest_date",
            getattr(self.instance, "harvest_date", None),
        )
        expiry_date = attrs.get(
            "expiry_date",
            getattr(self.instance, "expiry_date", None),
        )

        if (
            harvest_date
            and expiry_date
            and expiry_date < harvest_date
        ):
            raise serializers.ValidationError(
                {
                    "expiry_date": (
                        "Ngày hết hạn không được trước ngày thu hoạch."
                    )
                }
            )

        return attrs

    def validate_status(self, value):
        if self.instance is None:
            if value != "DRAFT":
                raise serializers.ValidationError(
                    "Sản phẩm mới phải được tạo ở trạng thái DRAFT."
                )

            return value

        current_status = self.instance.status

        if value == current_status:
            return value

        if (
            current_status == "AVAILABLE"
            and value == "HIDDEN"
        ):
            return value

        if (
            current_status in {"DRAFT", "PENDING", "HIDDEN"}
            and value == "AVAILABLE"
        ):
            self._validate_product_images()
            return value

        raise serializers.ValidationError(
            (
                f"Không thể chuyển trạng thái từ "
                f"{current_status} sang {value}."
            )
        )

    def _validate_product_images(self):
        images = self.instance.images.all()

        if not images.exists():
            raise serializers.ValidationError(
                "Sản phẩm phải có ít nhất một ảnh."
            )

        unchecked_images_exist = images.filter(
            quality_result__isnull=True
        ).exists()

        if unchecked_images_exist:
            raise serializers.ValidationError(
                "Một số ảnh chưa được kiểm tra chất lượng."
            )

        unacceptable_images_exist = images.filter(
            Q(quality_result__is_acceptable=False)
        ).exists()

        if unacceptable_images_exist:
            raise serializers.ValidationError(
                "Một số ảnh chưa đạt chất lượng. Vui lòng chụp lại."
            )


class PublicProductSerializer(serializers.ModelSerializer):
    farmer_name = serializers.CharField(
        source="farmer.farm_name",
        read_only=True,
    )
    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )
    unit_name = serializers.CharField(
        source="unit.name",
        read_only=True,
    )
    unit_symbol = serializers.CharField(
        source="unit.symbol",
        read_only=True,
    )
    images = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "farmer",
            "farmer_name",
            "category",
            "category_name",
            "unit",
            "unit_name",
            "unit_symbol",
            "name",
            "description",
            "origin",
            "price",
            "stock_quantity",
            "minimum_order_quantity",
            "harvest_date",
            "expiry_date",
            "status",
            "images",
            "created_date",
            "updated_date",
        )
        read_only_fields = fields

    def get_images(self, product):
        acceptable_images = [
            image
            for image in product.images.all()
            if (
                    hasattr(image, "quality_result")
                    and image.quality_result.is_acceptable
            )
        ]

        return PublicProductImageSerializer(
            acceptable_images,
            many=True,
            context=self.context,
        ).data