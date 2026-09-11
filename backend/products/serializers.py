from django.db.models import Q
from rest_framework import serializers

from .models import Category, ImageQualityResult, Product, ProductImage, Unit


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name","description")
        read_only_fields = fields


class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = ("id","name","symbol")
        read_only_fields = fields


class ProductImageAnalysisSerializer(serializers.Serializer):
    image = serializers.ImageField()

    def validate_image(self, image):
        if image.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Ảnh không được vượt quá 5 MB.")

        allowed_types = {"image/jpeg", "image/png", "image/webp"}

        if image.content_type not in allowed_types:
            raise serializers.ValidationError("Chỉ hỗ trợ ảnh JPEG, PNG hoặc WEBP.")

        return image


class ImageQualityResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImageQualityResult
        fields = (
            "id","raw_blur_score","normalized_blur_score","brightness_mean",
            "contrast_std","dark_ratio","bright_ratio","is_blurry","is_too_dark",
            "is_too_bright","is_acceptable","feedback","created_date","updated_date",
        )
        read_only_fields = fields


class ProductImageSerializer(serializers.ModelSerializer):
    quality_result = ImageQualityResultSerializer(read_only=True,allow_null=True)

    class Meta:
        model = ProductImage
        fields = (
            "id","image","is_primary","display_order",
            "quality_result","created_date","updated_date"
        )
        read_only_fields = (
            "id","is_primary","quality_result",
            "created_date","updated_date"
        )

    def validate_image(self, image):
        if image.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Ảnh không được vượt quá 5 MB.")

        allowed_types = {"image/jpeg", "image/png", "image/webp"}

        if image.content_type not in allowed_types:
            raise serializers.ValidationError("Chỉ hỗ trợ ảnh JPEG, PNG hoặc WEBP.")

        return image

    def create(self, validated_data):
        analysis_result = validated_data.pop("analysis_result", None)
        product = validated_data["product"]

        if not product.images.exists():
            validated_data["is_primary"] = True

        product_image = super().create(validated_data)

        if analysis_result is not None:
            self._create_quality_result(
                product_image,
                analysis_result,
            )

        return product_image

    def _create_quality_result(self,product_image,analysis_result):
        quality = analysis_result.get("quality_metrics") or {}
        issues = {
            str(issue).upper()
            for issue in analysis_result.get("quality_issues") or []
        }

        instructions = analysis_result.get("instructions") or []

        feedback = "\n".join(
            str(instruction)
            for instruction in instructions
        )

        if not feedback:
            feedback = analysis_result.get("message") or ""

        ImageQualityResult.objects.create(
            image=product_image,
            raw_blur_score=quality.get("laplacian_raw"),
            normalized_blur_score=quality.get("laplacian_normalized"),
            brightness_mean=quality.get("brightness_mean"),
            contrast_std=quality.get("contrast_std"),
            dark_ratio=quality.get("dark_pixel_ratio"),
            bright_ratio=quality.get("bright_pixel_ratio"),
            is_blurry=bool({"BLUR", "BLURRY"} & issues),
            is_too_dark="DARK" in issues,
            is_too_bright=bool(
                {
                    "BRIGHT","TOO_BRIGHT","OVEREXPOSED"
                }
                & issues
            ),
            is_acceptable=bool(analysis_result.get("can_continue")),
            feedback=feedback,
        )

    def to_representation(self, instance):
        data = super().to_representation(instance)

        if instance.image:
            data["image"] = instance.image.url

        return data


class PublicProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ("id","image","is_primary","display_order")
        read_only_fields = fields

    def to_representation(self, instance):
        data = super().to_representation(instance)

        if instance.image:
            data["image"] = instance.image.url

        return data


class ProductSerializer(serializers.ModelSerializer):
    farmer_name = serializers.CharField(source="farmer.farm_name",read_only=True)
    category_name = serializers.CharField(source="category.name",read_only=True)
    unit_name = serializers.CharField( source="unit.name",read_only=True)
    unit_symbol = serializers.CharField(source="unit.symbol",read_only=True)
    images = ProductImageSerializer(many=True,read_only=True)

    class Meta:
        model = Product
        fields = (
            "id","farmer", "farmer_name","category","category_name","unit","unit_name",
            "unit_symbol","name","description","origin","price","stock_quantity",
            "minimum_order_quantity","harvest_date","expiry_date","status","rejection_reason",
            "images","created_date","updated_date",
        )
        read_only_fields = (
            "id","farmer","farmer_name","category_name","unit_name","unit_symbol",
            "rejection_reason","images","created_date","updated_date"
        )

    def validate(self, attrs):
        harvest_date = attrs.get("harvest_date",getattr(self.instance, "harvest_date", None))
        expiry_date = attrs.get("expiry_date",getattr(self.instance, "expiry_date", None))

        if (harvest_date and expiry_date and expiry_date < harvest_date):
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

        if (current_status == "AVAILABLE" and value == "HIDDEN"):
            return value

        if (current_status in {"DRAFT", "PENDING", "HIDDEN"} and value == "AVAILABLE"):
            self._validate_product_images()
            return value

        raise serializers.ValidationError((f"Không thể chuyển trạng thái từ "f"{current_status} sang {value}."))

    def _validate_product_images(self):
        images = self.instance.images.all()

        if not images.exists():
            raise serializers.ValidationError(
                "Sản phẩm phải có ít nhất một ảnh."
            )

        unchecked_images_exist = images.filter(quality_result__isnull=True).exists()

        if unchecked_images_exist:
            raise serializers.ValidationError(
                "Một số ảnh chưa được kiểm tra chất lượng."
            )

        unacceptable_images_exist = images.filter(Q(quality_result__is_acceptable=False)).exists()

        if unacceptable_images_exist:
            raise serializers.ValidationError(
                "Một số ảnh chưa đạt chất lượng. Vui lòng chụp lại."
            )


class PublicProductSerializer(serializers.ModelSerializer):
    farmer_name = serializers.CharField(source="farmer.farm_name",read_only=True)
    category_name = serializers.CharField(source="category.name",read_only=True)
    unit_name = serializers.CharField(source="unit.name",read_only=True)
    unit_symbol = serializers.CharField(source="unit.symbol",read_only=True)
    images = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id","farmer","farmer_name","category","category_name","unit",
            "unit_name","unit_symbol","name","description","origin","price",
            "stock_quantity","minimum_order_quantity","harvest_date","expiry_date",
            "status","images","average_rating","review_count", "created_date","updated_date",
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

        return PublicProductImageSerializer(acceptable_images,many=True,context=self.context).data

    def get_average_rating(self, product):
        average_rating = getattr(product, "average_rating", None)

        if average_rating is None:
            return None

        return round(float(average_rating), 1)

    def get_review_count(self, product):
        return getattr(product, "review_count", 0)