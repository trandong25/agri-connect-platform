from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from accounts.models import Address
from affiliates.constants import COMMISSION_RATE
from affiliates.models import AffiliateLink, Commission
from notifications.services import create_notification
from payments.models import Payment
from products.models import Product
from products.serializers import PublicProductSerializer

from .models import Cart, CartItem, Order, OrderItem, SellerOrder, SellerOrderStatusLog


class CartItemSerializer(serializers.ModelSerializer):
    affiliate_code = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = CartItem
        fields = ["id", "product", "quantity", "affiliate_code", "created_date", "updated_date"]
        read_only_fields = ["id", "created_date", "updated_date"]

    def validate(self, data):
        product = data.get("product")
        affiliate_code = data.pop("affiliate_code", None)

        if self.instance and product and product != self.instance.product:
            raise serializers.ValidationError({
                "product": "Không thể thay đổi sản phẩm. Hãy xóa sản phẩm cũ và thêm lại."
            })

        if self.instance and affiliate_code:
            raise serializers.ValidationError({
                "affiliate_code": "Không thể thay đổi nguồn KOC của sản phẩm trong giỏ."
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
                    "affiliate_code": "Liên kết KOC không hợp lệ với sản phẩm này."
                })

            data["affiliate_link"] = affiliate_link

        return data

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["product"] = PublicProductSerializer(instance.product, context=self.context).data
        data["affiliate_code"] = str(instance.affiliate_link.code) if instance.affiliate_link else None
        subtotal = instance.product.price * instance.quantity
        data["subtotal"] = f"{subtotal:.2f}"
        return data


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = ["id", "items", "created_date", "updated_date"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        total_amount = sum(
            (item.product.price * item.quantity for item in instance.items.all()),
            Decimal("0.00")
        )
        data["total_amount"] = f"{total_amount:.2f}"
        data["is_empty"] = not instance.items.exists()
        return data


class SellerOrderStatusLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerOrderStatusLog
        fields = ["id", "old_status", "new_status", "changed_by", "note", "created_date"]
        read_only_fields = fields


class OrderItemSerializer(serializers.ModelSerializer):
    affiliate_code = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            "id", "product", "affiliate_code", "product_name", "unit_name",
            "unit_price", "quantity", "subtotal", "created_date"
        ]
        read_only_fields = fields

    def get_affiliate_code(self, instance):
        return str(instance.affiliate_link.code) if instance.affiliate_link else None


class SellerOrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_logs = SellerOrderStatusLogSerializer(many=True, read_only=True)

    class Meta:
        model = SellerOrder
        fields = [
            "id", "farmer", "subtotal", "shipping_fee", "discount_amount",
            "total_amount", "status", "note", "confirmed_at", "shipped_at",
            "completed_at", "items", "status_logs", "created_date", "updated_date"
        ]
        read_only_fields = fields


class FarmerSellerOrderSerializer(serializers.ModelSerializer):
    order_code = serializers.UUIDField(source="order.code", read_only=True)
    consumer_note = serializers.CharField(source="order.note", read_only=True)
    recipient_name = serializers.CharField(source="order.recipient_name", read_only=True)
    phone_number = serializers.CharField(source="order.phone_number", read_only=True)
    province = serializers.CharField(source="order.province", read_only=True)
    ward = serializers.CharField(source="order.ward", read_only=True)
    address_detail = serializers.CharField(source="order.address_detail", read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    status_logs = SellerOrderStatusLogSerializer(many=True, read_only=True)

    class Meta:
        model = SellerOrder
        fields = [
            "id", "order", "order_code", "recipient_name", "phone_number",
            "province", "ward", "address_detail", "consumer_note", "subtotal",
            "shipping_fee", "discount_amount", "total_amount", "status", "note",
            "confirmed_at", "shipped_at", "completed_at", "items", "status_logs",
            "created_date", "updated_date"
        ]
        read_only_fields = fields


class SellerOrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["CONFIRMED", "SHIPPING", "COMPLETED"])
    note = serializers.CharField(required=False, allow_blank=True)

    @transaction.atomic
    def update(self, instance, validated_data):
        seller_order = SellerOrder.objects.select_for_update().get(pk=instance.pk)
        new_status = validated_data["status"]

        transitions = {
            "PENDING": "CONFIRMED",
            "CONFIRMED": "SHIPPING",
            "SHIPPING": "COMPLETED"
        }

        next_status = transitions.get(seller_order.status)

        if next_status is None:
            raise serializers.ValidationError({
                "status": "Đơn hàng đã hoàn thành, không thể đổi trạng thái."
            })

        if new_status != next_status:
            raise serializers.ValidationError({
                "status": f"Trạng thái tiếp theo phải là {next_status}."
            })

        old_status = seller_order.status
        timestamp_fields = {
            "CONFIRMED": "confirmed_at",
            "SHIPPING": "shipped_at",
            "COMPLETED": "completed_at"
        }
        timestamp_field = timestamp_fields[new_status]

        seller_order.status = new_status
        setattr(seller_order, timestamp_field, timezone.now())
        seller_order.save(update_fields=["status", timestamp_field, "updated_date"])

        SellerOrderStatusLog.objects.create(
            seller_order=seller_order,
            old_status=old_status,
            new_status=new_status,
            changed_by=self.context["request"].user,
            note=validated_data.get("note", "")
        )

        status_notifications = {
            "CONFIRMED": (
                "Đơn hàng đã được xác nhận",
                "Nông dân đã xác nhận đơn hàng của bạn."
            ),
            "SHIPPING": (
                "Đơn hàng đang được giao",
                "Đơn hàng của bạn đang trên đường giao đến."
            ),
            "COMPLETED": (
                "Đơn hàng đã hoàn thành",
                "Đơn hàng của bạn đã được hoàn thành."
            )
        }

        title, message = status_notifications[new_status]

        create_notification(
            user=seller_order.order.consumer,
            notification_type="ORDER",
            title=title,
            message=message,
            data={
                "order_id": seller_order.order_id,
                "seller_order_id": seller_order.id
            }
        )

        if new_status == "COMPLETED":
            order_items = seller_order.items.select_related("affiliate_link").filter(
                affiliate_link__isnull=False
            )

            for order_item in order_items:
                commission_amount = (
                    order_item.subtotal * COMMISSION_RATE / Decimal("100")
                ).quantize(Decimal("0.01"))

                commission, created = Commission.objects.get_or_create(
                    order_item=order_item,
                    defaults={
                        "affiliate_link": order_item.affiliate_link,
                        "rate": COMMISSION_RATE,
                        "amount": commission_amount,
                        "status": "PENDING"
                    }
                )

                if created:
                    create_notification(
                        user=order_item.affiliate_link.koc.user,
                        notification_type="COMMISSION",
                        title="Phát sinh hoa hồng",
                        message=f"Bạn vừa nhận hoa hồng {commission_amount:.2f}đ.",
                        data={
                            "commission_id": commission.id,
                            "order_item_id": order_item.id
                        }
                    )

        return seller_order


class OrderSerializer(serializers.ModelSerializer):
    address = serializers.PrimaryKeyRelatedField(queryset=Address.objects.all(), write_only=True)
    cart_item_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        write_only=True,
        allow_empty=False
    )
    payment_method = serializers.ChoiceField(choices=Payment.PAYMENT_METHOD, write_only=True)
    seller_orders = SellerOrderSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "code", "address", "cart_item_ids", "payment_method",
            "recipient_name", "phone_number", "province", "ward", "address_detail",
            "subtotal", "shipping_fee", "discount_amount", "total_amount", "note",
            "seller_orders", "created_date", "updated_date"
        ]
        read_only_fields = [
            "id", "code", "recipient_name", "phone_number", "province", "ward",
            "address_detail", "subtotal", "shipping_fee", "discount_amount",
            "total_amount", "seller_orders", "created_date", "updated_date"
        ]

    def validate_address(self, address):
        if address.user_id != self.context["request"].user.id:
            raise serializers.ValidationError("Địa chỉ nhận hàng không thuộc tài khoản của bạn.")

        return address

    def validate_cart_item_ids(self, cart_item_ids):
        if len(cart_item_ids) != len(set(cart_item_ids)):
            raise serializers.ValidationError("Danh sách sản phẩm trong giỏ bị trùng.")

        return cart_item_ids

    def to_representation(self, instance):
        data = super().to_representation(instance)
        payment = next(iter(instance.payments.all()), None)
        data["payment"] = {
            "id": payment.id,
            "method": payment.method,
            "status": payment.status,
            "amount": f"{payment.amount:.2f}",
            "transaction_code": payment.transaction_code,
            "paid_at": payment.paid_at
        } if payment else None
        return data

    @transaction.atomic
    def create(self, validated_data):
        request = self.context["request"]
        address = validated_data.pop("address")
        cart_item_ids = validated_data.pop("cart_item_ids")
        payment_method = validated_data.pop("payment_method")
        note = validated_data.pop("note", "")

        cart_items = list(
            CartItem.objects.select_for_update().select_related("affiliate_link").filter(
                id__in=cart_item_ids, cart__user=request.user
            ).order_by("id")
        )

        if len(cart_items) != len(cart_item_ids):
            raise serializers.ValidationError({
                "cart_item_ids": "Có sản phẩm không tồn tại hoặc không thuộc giỏ hàng của bạn."
            })

        product_ids = [cart_item.product_id for cart_item in cart_items]
        products = Product.objects.select_for_update().select_related(
            "farmer", "unit"
        ).in_bulk(product_ids)
        seller_data = {}
        order_subtotal = Decimal("0.00")

        for cart_item in cart_items:
            product = products[cart_item.product_id]
            quantity = cart_item.quantity

            if product.status != "AVAILABLE":
                raise serializers.ValidationError({
                    "cart_item_ids": f"Sản phẩm {product.name} hiện không còn được bán."
                })

            if quantity < product.minimum_order_quantity:
                raise serializers.ValidationError({
                    "cart_item_ids": (
                        f"Số lượng tối thiểu của {product.name} "
                        f"là {product.minimum_order_quantity}."
                    )
                })

            if quantity > product.stock_quantity:
                raise serializers.ValidationError({
                    "cart_item_ids": (
                        f"Sản phẩm {product.name} hiện chỉ còn "
                        f"{product.stock_quantity}."
                    )
                })

            item_subtotal = product.price * quantity
            order_subtotal += item_subtotal
            farmer_data = seller_data.setdefault(product.farmer_id, {
                "farmer": product.farmer,
                "subtotal": Decimal("0.00"),
                "items": []
            })
            farmer_data["subtotal"] += item_subtotal
            farmer_data["items"].append({
                "cart_item": cart_item,
                "product": product,
                "quantity": quantity,
                "subtotal": item_subtotal
            })

        order = Order.objects.create(
            consumer=request.user,
            recipient_name=address.recipient_name,
            phone_number=address.phone_number,
            province=address.province,
            ward=address.ward,
            address_detail=address.address_detail,
            subtotal=order_subtotal,
            shipping_fee=Decimal("0.00"),
            discount_amount=Decimal("0.00"),
            total_amount=order_subtotal,
            note=note
        )

        for farmer_data in seller_data.values():
            seller_subtotal = farmer_data["subtotal"]
            seller_order = SellerOrder.objects.create(
                order=order,
                farmer=farmer_data["farmer"],
                subtotal=seller_subtotal,
                shipping_fee=Decimal("0.00"),
                discount_amount=Decimal("0.00"),
                total_amount=seller_subtotal
            )

            SellerOrderStatusLog.objects.create(
                seller_order=seller_order,
                old_status="",
                new_status="PENDING",
                changed_by=request.user
            )

            create_notification(
                user=farmer_data["farmer"].user,
                notification_type="ORDER",
                title="Có đơn hàng mới",
                message="Bạn vừa nhận được một đơn hàng mới.",
                data={
                    "order_id": order.id,
                    "seller_order_id": seller_order.id
                }
            )

            for item_data in farmer_data["items"]:
                product = item_data["product"]
                OrderItem.objects.create(
                    seller_order=seller_order,
                    product=product,
                    affiliate_link=item_data["cart_item"].affiliate_link,
                    product_name=product.name,
                    unit_name=product.unit.name,
                    unit_price=product.price,
                    quantity=item_data["quantity"],
                    subtotal=item_data["subtotal"]
                )
                product.stock_quantity -= item_data["quantity"]
                product.save(update_fields=["stock_quantity", "updated_date"])

        Payment.objects.create(
            order=order,
            method=payment_method,
            amount=order.total_amount,
            status="PENDING"
        )
        CartItem.objects.filter(id__in=cart_item_ids, cart__user=request.user).delete()
        return order