from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Farmer, User
from orders.models import Order, OrderItem, SellerOrder
from products.models import Category, Product, Unit

from .models import Review


class ReviewApiTests(APITestCase):
    def setUp(self):
        self.consumer = User.objects.create_user(
            username="review_consumer",
            email="review_consumer@example.com",
            password="StrongPass123!",
            role=User.Role.CONSUMER
        )
        self.other_consumer = User.objects.create_user(
            username="other_review_consumer",
            email="other_review_consumer@example.com",
            password="StrongPass123!",
            role=User.Role.CONSUMER
        )
        farmer_user = User.objects.create_user(
            username="review_farmer",
            email="review_farmer@example.com",
            password="StrongPass123!",
            role=User.Role.FARMER
        )

        self.farmer = Farmer.objects.create(
            user=farmer_user,
            farm_name="Nông trại Review"
        )
        self.category = Category.objects.create(name="Trái cây Review")
        self.unit = Unit.objects.create(
            name="Kilogram Review",
            symbol="kg-review"
        )

        self.product = self.create_product("Xoài Review")
        self.other_product = self.create_product("Ổi Review")
        self.order = self.create_order(self.consumer)
        self.seller_order = self.create_seller_order(
            self.order,
            "COMPLETED"
        )
        self.order_item = self.create_order_item(
            self.seller_order,
            self.product
        )

        self.client.force_authenticate(user=self.consumer)

    def create_product(self, name):
        return Product.objects.create(
            farmer=self.farmer,
            category=self.category,
            unit=self.unit,
            name=name,
            price=Decimal("50000.00"),
            stock_quantity=Decimal("20.00"),
            minimum_order_quantity=Decimal("1.00"),
            status="AVAILABLE"
        )

    def create_order(self, consumer):
        return Order.objects.create(
            consumer=consumer,
            recipient_name="Người nhận",
            phone_number="0901234567",
            province="Thành phố Hồ Chí Minh",
            ward="Phường 1",
            address_detail="123 Đường ABC",
            subtotal=Decimal("50000.00"),
            shipping_fee=Decimal("0.00"),
            discount_amount=Decimal("0.00"),
            total_amount=Decimal("50000.00")
        )

    def create_seller_order(self, order, seller_order_status):
        return SellerOrder.objects.create(
            order=order,
            farmer=self.farmer,
            subtotal=Decimal("50000.00"),
            shipping_fee=Decimal("0.00"),
            discount_amount=Decimal("0.00"),
            total_amount=Decimal("50000.00"),
            status=seller_order_status
        )

    def create_order_item(self, seller_order, product):
        return OrderItem.objects.create(
            seller_order=seller_order,
            product=product,
            product_name=product.name,
            unit_name=self.unit.name,
            unit_price=Decimal("50000.00"),
            quantity=Decimal("1.00"),
            subtotal=Decimal("50000.00")
        )

    def test_consumer_can_review_completed_order_item(self):
        response = self.client.post(
            reverse("product-reviews", args=[self.product.id]),
            {
                "order_item": self.order_item.id,
                "rating": 5,
                "comment": "Sản phẩm rất tốt"
            },
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        review = Review.objects.get(order_item=self.order_item)
        self.assertEqual(review.rating, 5)
        self.assertEqual(review.comment, "Sản phẩm rất tốt")

    def test_cannot_review_before_seller_order_completed(self):
        self.seller_order.status = "SHIPPING"
        self.seller_order.save(
            update_fields=["status", "updated_date"]
        )

        response = self.client.post(
            reverse("product-reviews", args=[self.product.id]),
            {
                "order_item": self.order_item.id,
                "rating": 5,
                "comment": "Đánh giá quá sớm"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )
        self.assertFalse(Review.objects.exists())

    def test_cannot_review_another_consumers_order_item(self):
        other_order = self.create_order(self.other_consumer)
        other_seller_order = self.create_seller_order(
            other_order,
            "COMPLETED"
        )
        other_order_item = self.create_order_item(
            other_seller_order,
            self.product
        )

        response = self.client.post(
            reverse("product-reviews", args=[self.product.id]),
            {
                "order_item": other_order_item.id,
                "rating": 4,
                "comment": "Không phải sản phẩm của tôi"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )
        self.assertFalse(
            Review.objects.filter(
                order_item=other_order_item
            ).exists()
        )

    def test_cannot_review_same_order_item_twice(self):
        Review.objects.create(
            order_item=self.order_item,
            rating=5,
            comment="Đánh giá lần đầu"
        )

        response = self.client.post(
            reverse("product-reviews", args=[self.product.id]),
            {
                "order_item": self.order_item.id,
                "rating": 4,
                "comment": "Đánh giá lần hai"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )
        self.assertEqual(
            Review.objects.filter(
                order_item=self.order_item
            ).count(),
            1
        )

    def test_order_item_must_match_product_in_url(self):
        other_order_item = self.create_order_item(
            self.seller_order,
            self.other_product
        )

        response = self.client.post(
            reverse("product-reviews", args=[self.product.id]),
            {
                "order_item": other_order_item.id,
                "rating": 5,
                "comment": "Sai sản phẩm"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )
        self.assertFalse(
            Review.objects.filter(
                order_item=other_order_item
            ).exists()
        )