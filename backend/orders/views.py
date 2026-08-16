from django.db import transaction
from django.db.models import Prefetch
from rest_framework import generics, permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsConsumer
from orders import serializers as order_serializers
from orders.models import Cart, CartItem
from products.models import Product, ProductImage


def validate_cart_quantity(product, quantity):
    if product.status != "AVAILABLE":
        raise serializers.ValidationError({"product": "Sản phẩm hiện không còn được bán."})

    if quantity < product.minimum_order_quantity:
        raise serializers.ValidationError({
            "quantity": f"Số lượng tối thiểu của sản phẩm là {product.minimum_order_quantity}."
        })

    if quantity > product.stock_quantity:
        raise serializers.ValidationError({
            "quantity": f"Số lượng sản phẩm hiện có chỉ còn {product.stock_quantity}."
        })


class CartViewSet(viewsets.ViewSet, generics.ListAPIView):
    serializer_class = order_serializers.CartSerializer
    permission_classes = [permissions.IsAuthenticated, IsConsumer]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Cart.objects.none()

        product_images = ProductImage.objects.select_related("quality_result").order_by(
            "-is_primary", "display_order", "created_date"
        )

        cart_items = CartItem.objects.select_related(
            "product", "product__category", "product__unit", "product__farmer",
            "product__farmer__user", "affiliate_link"
        ).prefetch_related(
            Prefetch("product__images", queryset=product_images)
        )

        return Cart.objects.filter(user=self.request.user).prefetch_related(
            Prefetch("items", queryset=cart_items)
        )

    def get_cart(self):
        Cart.objects.get_or_create(user=self.request.user)
        return self.get_queryset().get()

    def list(self, request, *args, **kwargs):
        cart = self.get_cart()
        serializer = self.get_serializer(cart, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=["post"], detail=False, url_path="items")
    @transaction.atomic
    def add_item(self, request):
        input_serializer = order_serializers.CartItemSerializer(
            data=request.data, context={"request": request}
        )
        input_serializer.is_valid(raise_exception=True)

        product_input = input_serializer.validated_data["product"]
        quantity = input_serializer.validated_data["quantity"]
        affiliate_link = input_serializer.validated_data.get("affiliate_link")

        product = Product.objects.select_for_update().get(pk=product_input.pk)
        cart, _ = Cart.objects.get_or_create(user=request.user)

        cart_item = CartItem.objects.select_for_update().filter(
            cart=cart, product=product
        ).first()

        if cart_item is None:
            validate_cart_quantity(product, quantity)

            CartItem.objects.create(
                cart=cart, product=product, quantity=quantity, affiliate_link=affiliate_link
            )

            response_status = status.HTTP_201_CREATED
            message = "Đã thêm sản phẩm vào giỏ hàng."
        else:
            final_quantity = cart_item.quantity + quantity
            validate_cart_quantity(product, final_quantity)
            cart_item.quantity = final_quantity
            update_fields = ["quantity", "updated_date"]

            if cart_item.affiliate_link_id is None and affiliate_link is not None:
                cart_item.affiliate_link = affiliate_link
                update_fields.append("affiliate_link")

            cart_item.save(update_fields=update_fields)
            response_status = status.HTTP_200_OK
            message = "Sản phẩm đã có trong giỏ, hệ thống đã tăng số lượng."

        cart = self.get_cart()
        cart_data = self.get_serializer(cart, context={"request": request}).data

        return Response(
            {"message": message, "cart": cart_data},
            status=response_status
        )

    @action(methods=["patch", "delete"],detail=False, url_path=r"items/(?P<item_id>[^/.]+)")
    @transaction.atomic
    def item_detail(self, request, item_id=None):
        cart_item = CartItem.objects.select_for_update().select_related("product").filter(
            id=item_id, cart__user=request.user
        ).first()

        if cart_item is None:
            return Response(
                {"detail": "Sản phẩm không tồn tại trong giỏ hàng."},
                status=status.HTTP_404_NOT_FOUND
            )

        if request.method == "DELETE":
            cart_item.delete()
            cart = self.get_cart()
            cart_data = self.get_serializer(cart, context={"request": request}).data

            return Response(
                {"message": "Đã xóa sản phẩm khỏi giỏ hàng.", "cart": cart_data},
                status=status.HTTP_200_OK
            )

        input_serializer = order_serializers.CartItemSerializer(
            cart_item, data=request.data, partial=True, context={"request": request}
        )
        input_serializer.is_valid(raise_exception=True)

        if "quantity" not in input_serializer.validated_data:
            raise serializers.ValidationError({"quantity": "Bạn phải nhập số lượng."})

        quantity = input_serializer.validated_data["quantity"]
        product = Product.objects.select_for_update().get(pk=cart_item.product_id)

        validate_cart_quantity(product, quantity)

        cart_item.quantity = quantity
        cart_item.save(update_fields=["quantity", "updated_date"])

        cart = self.get_cart()
        cart_data = self.get_serializer(cart, context={"request": request}).data

        return Response({"message": "Đã cập nhật số lượng sản phẩm.", "cart": cart_data},status=status.HTTP_200_OK)