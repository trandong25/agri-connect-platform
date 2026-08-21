from django.utils import timezone
from rest_framework import serializers

from accounts.models import KOC

from .models import AffiliateLink, Commission, PromotionPost


class AffiliateLinkSerializer(serializers.ModelSerializer):
    koc_name = serializers.CharField(source="koc.koc_name", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = AffiliateLink
        fields = [
            "id", "koc", "koc_name", "product", "product_name",
            "code", "created_date", "updated_date"
        ]
        read_only_fields = [
            "id", "koc", "koc_name", "product_name",
            "code", "created_date", "updated_date"
        ]

    def validate_product(self, product):
        if product.status != "AVAILABLE":
            raise serializers.ValidationError("Chỉ được quảng bá sản phẩm đang bán.")

        return product

    def create(self, validated_data):
        koc = KOC.objects.get(user=self.context["request"].user)
        affiliate_link, created = AffiliateLink.objects.get_or_create(
            koc=koc, product=validated_data["product"]
        )

        return affiliate_link


class PromotionPostSerializer(serializers.ModelSerializer):
    koc_name = serializers.CharField(source="affiliate_link.koc.koc_name", read_only=True)
    affiliate_code = serializers.UUIDField(source="affiliate_link.code", read_only=True)
    product = serializers.IntegerField(source="affiliate_link.product_id", read_only=True)
    product_name = serializers.CharField(source="affiliate_link.product.name", read_only=True)

    class Meta:
        model = PromotionPost
        fields = [
            "id", "affiliate_link", "affiliate_code", "koc_name",
            "product", "product_name", "content", "status",
            "published_at", "created_date", "updated_date"
        ]
        read_only_fields = [
            "id", "affiliate_code", "koc_name", "product",
            "product_name", "published_at", "created_date", "updated_date"
        ]

    def validate_affiliate_link(self, affiliate_link):
        if affiliate_link.koc.user_id != self.context["request"].user.id:
            raise serializers.ValidationError("Liên kết quảng bá không thuộc tài khoản của bạn.")

        if self.instance and affiliate_link != self.instance.affiliate_link:
            raise serializers.ValidationError("Không được thay đổi sản phẩm của bài quảng bá.")

        return affiliate_link

    def create(self, validated_data):
        if validated_data.get("status") == "PUBLISHED":
            validated_data["published_at"] = timezone.now()

        return PromotionPost.objects.create(**validated_data)

    def update(self, instance, validated_data):
        new_status = validated_data.get("status", instance.status)

        for field, value in validated_data.items():
            setattr(instance, field, value)

        if new_status == "PUBLISHED" and instance.published_at is None:
            instance.published_at = timezone.now()

        instance.save()
        return instance


class CommissionSerializer(serializers.ModelSerializer):
    koc = serializers.IntegerField(source="affiliate_link.koc_id", read_only=True)
    koc_name = serializers.CharField(source="affiliate_link.koc.koc_name", read_only=True)
    product = serializers.IntegerField(source="order_item.product_id", read_only=True)
    product_name = serializers.CharField(source="order_item.product_name", read_only=True)
    order_code = serializers.UUIDField(source="order_item.seller_order.order.code", read_only=True)

    class Meta:
        model = Commission
        fields = [
            "id", "affiliate_link", "koc", "koc_name", "order_item",
            "order_code", "product", "product_name", "rate", "amount",
            "status", "paid_at", "created_date", "updated_date"
        ]
        read_only_fields = fields