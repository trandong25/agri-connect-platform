from rest_framework import serializers

from orders.models import OrderItem

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    order_item = serializers.PrimaryKeyRelatedField(
        queryset=OrderItem.objects.select_related(
            "product", "seller_order", "seller_order__order"
        ),
        write_only=True
    )
    product = serializers.IntegerField(source="order_item.product_id", read_only=True)
    product_name = serializers.CharField(source="order_item.product_name", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id", "order_item", "product", "product_name",
            "rating", "comment", "created_date", "updated_date"
        ]
        read_only_fields = [
            "id", "product", "product_name",
            "created_date", "updated_date"
        ]

    def validate_order_item(self, order_item):
        request = self.context["request"]
        product = self.context.get("product")

        if self.instance and order_item.pk != self.instance.order_item_id:
            raise serializers.ValidationError(
                "Không được thay đổi sản phẩm đã đánh giá."
            )

        if product and order_item.product_id != product.id:
            raise serializers.ValidationError(
                "Sản phẩm đã mua không khớp với sản phẩm đang đánh giá."
            )

        if order_item.seller_order.order.consumer_id != request.user.id:
            raise serializers.ValidationError(
                "Bạn chỉ được đánh giá sản phẩm mình đã mua."
            )

        if order_item.seller_order.status != "COMPLETED":
            raise serializers.ValidationError(
                "Chỉ được đánh giá sau khi đơn hàng đã hoàn thành."
            )

        reviews = Review.objects.filter(order_item=order_item)

        if self.instance:
            reviews = reviews.exclude(pk=self.instance.pk)

        if reviews.exists():
            raise serializers.ValidationError(
                "Sản phẩm trong đơn hàng này đã được đánh giá."
            )

        return order_item