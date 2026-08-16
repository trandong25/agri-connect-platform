from decimal import Decimal

from rest_framework import serializers

from affiliates.models import AffiliateLink
from products.serializers import PublicProductSerializer

from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    affiliate_code = serializers.UUIDField(write_only=True,required=False,allow_null=True)

    class Meta:
        model = CartItem
        fields = ["id","product","quantity","affiliate_code","created_date","updated_date"]
        read_only_fields = ["id","created_date","updated_date"]

    def validate(self, data):
        product = data.get("product")
        affiliate_code = data.pop("affiliate_code", None)

        if (self.instance and product and
                product != self.instance.product):
            raise serializers.ValidationError({
                "product": ("Không thể thay đổi sản phẩm. "
                    "Hãy xóa sản phẩm cũ và thêm lại.")
            })

        if self.instance and affiliate_code:
            raise serializers.ValidationError({
                "affiliate_code": (
                    "Không thể thay đổi nguồn KOC của sản phẩm trong giỏ."
                )
            })

        if affiliate_code:
            if product is None:
                raise serializers.ValidationError({
                    "product": "Bạn phải chọn sản phẩm."
                })

            affiliate_link = AffiliateLink.objects.filter(
                code=affiliate_code, product=product
            ).first()

            if affiliate_link is None:
                raise serializers.ValidationError({
                    "affiliate_code": (
                        "Liên kết KOC không hợp lệ với sản phẩm này."
                    )
                })

            data["affiliate_link"] = affiliate_link

        return data

    def to_representation(self, instance):
        data = super().to_representation(instance)

        data["product"] = PublicProductSerializer(instance.product,context=self.context).data

        if instance.affiliate_link:
            data["affiliate_code"] = str(instance.affiliate_link.code)
        else:
            data["affiliate_code"] = None

        subtotal = instance.product.price * instance.quantity
        data["subtotal"] = f"{subtotal:.2f}"

        return data

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True,read_only=True)

    class Meta:
        model = Cart
        fields = ["id","items","created_date","updated_date"]

    def to_representation(self, instance):
        data = super().to_representation(instance)

        total_amount = sum(
            (
                item.product.price * item.quantity
                for item in instance.items.all()
            ),Decimal("0.00"))

        data["total_amount"] = f"{total_amount:.2f}"
        data["is_empty"] = not instance.items.exists()

        return data