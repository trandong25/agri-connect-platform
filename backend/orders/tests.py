from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import KOC, Address, Farmer, User
from affiliates.models import AffiliateLink, Commission
from orders.models import (
    Cart,
    CartItem,
    Order,
    OrderItem,
    SellerOrder,
    SellerOrderStatusLog,
)
from payments.models import Payment
from products.models import Category, Product, Unit


class CartApiTests(APITestCase):
    def setUp(self):
        self.consumer = User.objects.create_user(
            username="consumer_demo", email="consumer@example.com",
            password="StrongPass123!", role=User.Role.CONSUMER
        )
        farmer_user = User.objects.create_user(
            username="farmer_demo", email="farmer@example.com",
            password="StrongPass123!", role=User.Role.FARMER
        )
        self.farmer = Farmer.objects.create(user=farmer_user, farm_name="Nông trại Demo")
        self.category = Category.objects.create(name="Trái cây")
        self.unit = Unit.objects.create(name="Kilogram", symbol="kg")
        self.product = Product.objects.create(
            farmer=self.farmer, category=self.category, unit=self.unit,
            name="Xoài cát", price=Decimal("50000.00"),
            stock_quantity=Decimal("20.00"),
            minimum_order_quantity=Decimal("2.00"), status="AVAILABLE"
        )
        self.client.force_authenticate(user=self.consumer)

    def test_get_empty_cart(self):
        response = self.client.get(reverse("cart-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["items"], [])
        self.assertEqual(response.data["total_amount"], "0.00")
        self.assertTrue(response.data["is_empty"])

    def test_add_product_to_cart(self):
        response = self.client.post(
            reverse("cart-add-item"),
            {"product": self.product.id, "quantity": "2.00"},
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        item = CartItem.objects.get(cart__user=self.consumer, product=self.product)
        self.assertEqual(item.quantity, Decimal("2.00"))
        self.assertEqual(response.data["cart"]["total_amount"], "100000.00")

    def test_adding_same_product_increases_quantity(self):
        add_url = reverse("cart-add-item")
        self.client.post(
            add_url,
            {"product": self.product.id, "quantity": "2.00"},
            format="json"
        )
        response = self.client.post(
            add_url,
            {"product": self.product.id, "quantity": "3.00"},
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        item = CartItem.objects.get(cart__user=self.consumer, product=self.product)
        self.assertEqual(item.quantity, Decimal("5.00"))

    def test_reject_quantity_greater_than_stock(self):
        response = self.client.post(
            reverse("cart-add-item"),
            {"product": self.product.id, "quantity": "21.00"},
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("quantity", response.data)

    def test_update_and_delete_cart_item(self):
        self.client.post(
            reverse("cart-add-item"),
            {"product": self.product.id, "quantity": "2.00"},
            format="json"
        )
        item = CartItem.objects.get(cart__user=self.consumer, product=self.product)
        detail_url = reverse("cart-item-detail", args=[item.id])

        update_response = self.client.patch(
            detail_url,
            {"quantity": "4.00"},
            format="json"
        )

        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        item.refresh_from_db()
        self.assertEqual(item.quantity, Decimal("4.00"))

        delete_response = self.client.delete(detail_url)

        self.assertEqual(delete_response.status_code, status.HTTP_200_OK)
        self.assertFalse(CartItem.objects.filter(pk=item.pk).exists())

    def test_keep_first_koc_source(self):
        first_koc_user = User.objects.create_user(
            username="koc_first", email="koc_first@example.com",
            password="StrongPass123!", role=User.Role.KOC
        )
        second_koc_user = User.objects.create_user(
            username="koc_second", email="koc_second@example.com",
            password="StrongPass123!", role=User.Role.KOC
        )
        first_koc = KOC.objects.create(user=first_koc_user, koc_name="KOC thứ nhất")
        second_koc = KOC.objects.create(user=second_koc_user, koc_name="KOC thứ hai")
        first_link = AffiliateLink.objects.create(koc=first_koc, product=self.product)
        second_link = AffiliateLink.objects.create(koc=second_koc, product=self.product)
        add_url = reverse("cart-add-item")

        self.client.post(
            add_url,
            {
                "product": self.product.id,
                "quantity": "2.00",
                "affiliate_code": str(first_link.code)
            },
            format="json"
        )
        self.client.post(
            add_url,
            {
                "product": self.product.id,
                "quantity": "2.00",
                "affiliate_code": str(second_link.code)
            },
            format="json"
        )

        item = CartItem.objects.get(cart__user=self.consumer, product=self.product)
        self.assertEqual(item.affiliate_link, first_link)

    def test_farmer_cannot_use_cart(self):
        self.client.force_authenticate(user=self.farmer.user)
        response = self.client.get(reverse("cart-list"))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class OrderApiTests(APITestCase):
    def setUp(self):
        self.consumer = User.objects.create_user(
            username="order_consumer", email="order_consumer@example.com",
            password="StrongPass123!", role=User.Role.CONSUMER
        )
        self.address = Address.objects.create(
            user=self.consumer, recipient_name="Trần Quốc Đồng",
            phone_number="0901234567", province="Thành phố Hồ Chí Minh",
            ward="Phường 1", address_detail="123 Đường Nguyễn Văn A"
        )

        first_farmer_user = User.objects.create_user(
            username="first_farmer", email="first_farmer@example.com",
            password="StrongPass123!", role=User.Role.FARMER
        )
        second_farmer_user = User.objects.create_user(
            username="second_farmer", email="second_farmer@example.com",
            password="StrongPass123!", role=User.Role.FARMER
        )

        self.first_farmer = Farmer.objects.create(
            user=first_farmer_user,
            farm_name="Nông trại thứ nhất"
        )
        self.second_farmer = Farmer.objects.create(
            user=second_farmer_user,
            farm_name="Nông trại thứ hai"
        )

        self.category = Category.objects.create(name="Rau củ")
        self.unit = Unit.objects.create(name="Kilogram", symbol="kg")

        self.first_product = Product.objects.create(
            farmer=self.first_farmer, category=self.category,
            unit=self.unit, name="Cà chua",
            price=Decimal("30000.00"),
            stock_quantity=Decimal("10.00"),
            minimum_order_quantity=Decimal("1.00"),
            status="AVAILABLE"
        )
        self.second_product = Product.objects.create(
            farmer=self.second_farmer, category=self.category,
            unit=self.unit, name="Khoai lang",
            price=Decimal("20000.00"),
            stock_quantity=Decimal("8.00"),
            minimum_order_quantity=Decimal("1.00"),
            status="AVAILABLE"
        )
        self.unselected_product = Product.objects.create(
            farmer=self.first_farmer, category=self.category,
            unit=self.unit, name="Dưa leo",
            price=Decimal("15000.00"),
            stock_quantity=Decimal("6.00"),
            minimum_order_quantity=Decimal("1.00"),
            status="AVAILABLE"
        )

        self.cart = Cart.objects.create(user=self.consumer)
        self.first_cart_item = CartItem.objects.create(
            cart=self.cart,
            product=self.first_product,
            quantity=Decimal("2.00")
        )
        self.second_cart_item = CartItem.objects.create(
            cart=self.cart,
            product=self.second_product,
            quantity=Decimal("3.00")
        )
        self.unselected_cart_item = CartItem.objects.create(
            cart=self.cart,
            product=self.unselected_product,
            quantity=Decimal("1.00")
        )

        self.client.force_authenticate(user=self.consumer)

    def get_order_data(self):
        return {
            "address": self.address.id,
            "cart_item_ids": [
                self.first_cart_item.id,
                self.second_cart_item.id
            ],
            "payment_method": "COD",
            "note": "Giao hàng trong giờ hành chính"
        }

    def test_create_order_splits_by_farmer_and_updates_related_data(self):
        response = self.client.post(
            reverse("order-list"),
            self.get_order_data(),
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        order = Order.objects.get(pk=response.data["id"])
        self.assertEqual(order.total_amount, Decimal("120000.00"))
        self.assertEqual(SellerOrder.objects.filter(order=order).count(), 2)
        self.assertEqual(OrderItem.objects.filter(seller_order__order=order).count(), 2)

        payment = Payment.objects.get(order=order)
        self.assertEqual(payment.method, "COD")
        self.assertEqual(payment.status, "PENDING")
        self.assertEqual(payment.amount, Decimal("120000.00"))

        self.first_product.refresh_from_db()
        self.second_product.refresh_from_db()
        self.assertEqual(self.first_product.stock_quantity, Decimal("8.00"))
        self.assertEqual(self.second_product.stock_quantity, Decimal("5.00"))

        self.assertFalse(CartItem.objects.filter(pk=self.first_cart_item.id).exists())
        self.assertFalse(CartItem.objects.filter(pk=self.second_cart_item.id).exists())
        self.assertTrue(CartItem.objects.filter(pk=self.unselected_cart_item.id).exists())

        detail_response = self.client.get(
            reverse("order-detail", args=[order.id])
        )

        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(detail_response.data["seller_orders"]), 2)
        self.assertEqual(detail_response.data["payment"]["status"], "PENDING")

    def test_order_rolls_back_when_stock_is_not_enough(self):
        self.second_product.stock_quantity = Decimal("2.00")
        self.second_product.save(
            update_fields=["stock_quantity", "updated_date"]
        )

        response = self.client.post(
            reverse("order-list"),
            self.get_order_data(),
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Order.objects.exists())
        self.assertFalse(SellerOrder.objects.exists())
        self.assertFalse(OrderItem.objects.exists())
        self.assertFalse(Payment.objects.exists())

        self.first_product.refresh_from_db()
        self.second_product.refresh_from_db()
        self.assertEqual(self.first_product.stock_quantity, Decimal("10.00"))
        self.assertEqual(self.second_product.stock_quantity, Decimal("2.00"))
        self.assertTrue(CartItem.objects.filter(pk=self.first_cart_item.id).exists())
        self.assertTrue(CartItem.objects.filter(pk=self.second_cart_item.id).exists())

    def test_cannot_create_order_with_another_consumers_cart_item(self):
        other_consumer = User.objects.create_user(
            username="other_consumer", email="other_consumer@example.com",
            password="StrongPass123!", role=User.Role.CONSUMER
        )
        other_cart = Cart.objects.create(user=other_consumer)
        other_item = CartItem.objects.create(
            cart=other_cart,
            product=self.first_product,
            quantity=Decimal("1.00")
        )

        data = self.get_order_data()
        data["cart_item_ids"] = [other_item.id]

        response = self.client.post(
            reverse("order-list"),
            data,
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Order.objects.exists())
        self.assertTrue(CartItem.objects.filter(pk=other_item.id).exists())

    def test_consumer_cannot_retrieve_another_consumers_order(self):
        response = self.client.post(
            reverse("order-list"),
            self.get_order_data(),
            format="json"
        )

        order_id = response.data["id"]

        other_consumer = User.objects.create_user(
            username="order_viewer", email="order_viewer@example.com",
            password="StrongPass123!", role=User.Role.CONSUMER
        )
        self.client.force_authenticate(user=other_consumer)

        response = self.client.get(
            reverse("order-detail", args=[order_id])
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_farmer_cannot_use_order_api(self):
        self.client.force_authenticate(user=self.first_farmer.user)

        list_response = self.client.get(reverse("order-list"))
        create_response = self.client.post(
            reverse("order-list"),
            self.get_order_data(),
            format="json"
        )

        self.assertEqual(list_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(create_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(Order.objects.exists())


class SellerOrderApiTests(APITestCase):
    def setUp(self):
        self.consumer = User.objects.create_user(
            username="seller_consumer",
            email="seller_consumer@example.com",
            password="StrongPass123!",
            role=User.Role.CONSUMER
        )

        farmer_user = User.objects.create_user(
            username="seller_farmer",
            email="seller_farmer@example.com",
            password="StrongPass123!",
            role=User.Role.FARMER
        )
        other_farmer_user = User.objects.create_user(
            username="other_seller_farmer",
            email="other_seller_farmer@example.com",
            password="StrongPass123!",
            role=User.Role.FARMER
        )
        pending_farmer_user = User.objects.create_user(
            username="pending_seller_farmer",
            email="pending_seller_farmer@example.com",
            password="StrongPass123!",
            role=User.Role.FARMER
        )

        self.farmer = Farmer.objects.create(
            user=farmer_user,
            farm_name="Nông trại chính",
            approval_status="APPROVED"
        )
        self.other_farmer = Farmer.objects.create(
            user=other_farmer_user,
            farm_name="Nông trại khác",
            approval_status="APPROVED"
        )
        self.pending_farmer = Farmer.objects.create(
            user=pending_farmer_user,
            farm_name="Nông trại chờ duyệt"
        )

        self.order = Order.objects.create(
            consumer=self.consumer,
            recipient_name="Trần Quốc Đồng",
            phone_number="0901234567",
            province="Thành phố Hồ Chí Minh",
            ward="Phường 1",
            address_detail="123 Đường Nguyễn Văn A",
            subtotal=Decimal("100000.00"),
            shipping_fee=Decimal("0.00"),
            discount_amount=Decimal("0.00"),
            total_amount=Decimal("100000.00")
        )

        self.seller_order = SellerOrder.objects.create(
            order=self.order,
            farmer=self.farmer,
            subtotal=Decimal("60000.00"),
            shipping_fee=Decimal("0.00"),
            discount_amount=Decimal("0.00"),
            total_amount=Decimal("60000.00")
        )
        self.other_seller_order = SellerOrder.objects.create(
            order=self.order,
            farmer=self.other_farmer,
            subtotal=Decimal("40000.00"),
            shipping_fee=Decimal("0.00"),
            discount_amount=Decimal("0.00"),
            total_amount=Decimal("40000.00")
        )

        SellerOrderStatusLog.objects.create(
            seller_order=self.seller_order,
            old_status="",
            new_status="PENDING",
            changed_by=self.consumer
        )
        SellerOrderStatusLog.objects.create(
            seller_order=self.other_seller_order,
            old_status="",
            new_status="PENDING",
            changed_by=self.consumer
        )

        self.payment = Payment.objects.create(
            order=self.order,
            method="COD",
            amount=Decimal("100000.00"),
            status="PENDING"
        )

        self.client.force_authenticate(user=self.farmer.user)

    def get_results(self, response):
        if isinstance(response.data, dict) and "results" in response.data:
            return response.data["results"]

        return response.data

    def test_approved_farmer_can_only_access_own_seller_orders(self):
        list_response = self.client.get(reverse("seller-order-list"))

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)

        results = self.get_results(list_response)
        result_ids = [item["id"] for item in results]

        self.assertIn(self.seller_order.id, result_ids)
        self.assertNotIn(self.other_seller_order.id, result_ids)

        detail_response = self.client.get(
            reverse(
                "seller-order-detail",
                args=[self.other_seller_order.id]
            )
        )

        self.assertEqual(
            detail_response.status_code,
            status.HTTP_404_NOT_FOUND
        )

    def test_pending_farmer_cannot_use_seller_order_api(self):
        self.client.force_authenticate(user=self.pending_farmer.user)

        response = self.client.get(reverse("seller-order-list"))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_pending_to_confirmed_updates_timestamp_and_log(self):
        response = self.client.patch(
            reverse(
                "seller-order-update-status",
                args=[self.seller_order.id]
            ),
            {
                "status": "CONFIRMED",
                "note": "Đã xác nhận đơn"
            },
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.seller_order.refresh_from_db()
        self.assertEqual(self.seller_order.status, "CONFIRMED")
        self.assertIsNotNone(self.seller_order.confirmed_at)

        log = SellerOrderStatusLog.objects.filter(
            seller_order=self.seller_order
        ).order_by("-id").first()

        self.assertEqual(log.old_status, "PENDING")
        self.assertEqual(log.new_status, "CONFIRMED")
        self.assertEqual(log.changed_by, self.farmer.user)
        self.assertEqual(log.note, "Đã xác nhận đơn")

        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, "PENDING")

    def test_farmer_cannot_skip_seller_order_status(self):
        log_count = SellerOrderStatusLog.objects.filter(
            seller_order=self.seller_order
        ).count()

        response = self.client.patch(
            reverse(
                "seller-order-update-status",
                args=[self.seller_order.id]
            ),
            {"status": "SHIPPING"},
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        self.seller_order.refresh_from_db()
        self.assertEqual(self.seller_order.status, "PENDING")
        self.assertIsNone(self.seller_order.confirmed_at)
        self.assertIsNone(self.seller_order.shipped_at)

        self.assertEqual(
            SellerOrderStatusLog.objects.filter(
                seller_order=self.seller_order
            ).count(),
            log_count
        )

    def test_completed_seller_order_creates_commission(self):
        koc_user = User.objects.create_user(
            username="commission_koc", email="commission_koc@example.com",
            password="StrongPass123!", role=User.Role.KOC
        )
        koc = KOC.objects.create(
            user=koc_user, koc_name="KOC hoa hồng",
            approval_status="APPROVED"
        )

        category = Category.objects.create(name="Trái cây hoa hồng")
        unit = Unit.objects.create(name="Kilogram hoa hồng", symbol="kgc")
        product = Product.objects.create(
            farmer=self.farmer, category=category, unit=unit,
            name="Xoài hoa hồng", price=Decimal("30000.00"),
            stock_quantity=Decimal("10.00"),
            minimum_order_quantity=Decimal("1.00"),
            status="AVAILABLE"
        )

        affiliate_link = AffiliateLink.objects.create(koc=koc, product=product)

        order_item = OrderItem.objects.create(
            seller_order=self.seller_order, product=product,
            affiliate_link=affiliate_link, product_name=product.name,
            unit_name=unit.name, unit_price=Decimal("30000.00"),
            quantity=Decimal("2.00"), subtotal=Decimal("60000.00")
        )

        self.seller_order.status = "SHIPPING"
        self.seller_order.save(update_fields=["status", "updated_date"])

        response = self.client.patch(
            reverse("seller-order-update-status", args=[self.seller_order.id]),
            {"status": "COMPLETED"},
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        commission = Commission.objects.get(order_item=order_item)
        self.assertEqual(commission.affiliate_link, affiliate_link)
        self.assertEqual(commission.rate, Decimal("5.00"))
        self.assertEqual(commission.amount, Decimal("3000.00"))
        self.assertEqual(commission.status, "PENDING")