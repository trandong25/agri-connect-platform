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
            username="consumer_demo",
            email="consumer@example.com",
            password="StrongPass123!",
            role=User.Role.CONSUMER
        )
        self.other_consumer = User.objects.create_user(
            username="other_consumer",
            email="other@example.com",
            password="StrongPass123!",
            role=User.Role.CONSUMER
        )

        farmer_user = User.objects.create_user(
            username="farmer_demo",
            email="farmer@example.com",
            password="StrongPass123!",
            role=User.Role.FARMER
        )
        self.farmer = Farmer.objects.create(
            user=farmer_user,
            farm_name="Nông trại Demo",
            approval_status="APPROVED"
        )

        self.category = Category.objects.create(name="Trái cây")
        self.unit = Unit.objects.create(name="Kilogram", symbol="kg")
        self.product = Product.objects.create(
            farmer=self.farmer,
            category=self.category,
            unit=self.unit,
            name="Xoài cát",
            price=Decimal("50000.00"),
            stock_quantity=Decimal("20.00"),
            minimum_order_quantity=Decimal("1.00"),
            status="AVAILABLE"
        )

        self.order = self.create_order(self.consumer)
        self.seller_order = SellerOrder.objects.create(
            order=self.order,
            farmer=self.farmer,
            subtotal=Decimal("50000.00"),
            total_amount=Decimal("50000.00"),
            status="COMPLETED"
        )
        self.order_item = OrderItem.objects.create(
            seller_order=self.seller_order,
            product=self.product,
            product_name=self.product.name,
            unit_name=self.unit.name,
            unit_price=Decimal("50000.00"),
            quantity=Decimal("1.00"),
            subtotal=Decimal("50000.00")
        )

        self.client.force_authenticate(user=self.consumer)

    def create_order(self, consumer):
        return Order.objects.create(
            consumer=consumer,
            recipient_name="Nguyễn Văn A",
            phone_number="0900000000",
            province="TP. Hồ Chí Minh",
            ward="Phường 1",
            address_detail="123 Đường Demo",
            subtotal=Decimal("50000.00"),
            total_amount=Decimal("50000.00")
        )

    def create_review(self):
        return Review.objects.create(
            order_item=self.order_item,
            rating=5,
            comment="Sản phẩm rất tốt"
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
        self.seller_order.save(update_fields=["status", "updated_date"])

        response = self.client.post(
            reverse("product-reviews", args=[self.product.id]),
            {
                "order_item": self.order_item.id,
                "rating": 5,
                "comment": "Sản phẩm tốt"
            },
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Review.objects.exists())

    def test_cannot_review_other_consumers_order_item(self):
        self.client.force_authenticate(user=self.other_consumer)

        response = self.client.post(
            reverse("product-reviews", args=[self.product.id]),
            {
                "order_item": self.order_item.id,
                "rating": 5,
                "comment": "Đánh giá không hợp lệ"
            },
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Review.objects.exists())

    def test_cannot_review_same_order_item_twice(self):
        self.create_review()

        response = self.client.post(
            reverse("product-reviews", args=[self.product.id]),
            {
                "order_item": self.order_item.id,
                "rating": 4,
                "comment": "Đánh giá lần hai"
            },
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            Review.objects.filter(order_item=self.order_item).count(),
            1
        )

    def test_rating_must_be_between_one_and_five(self):
        response = self.client.post(
            reverse("product-reviews", args=[self.product.id]),
            {
                "order_item": self.order_item.id,
                "rating": 6,
                "comment": "Sai số sao"
            },
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Review.objects.exists())

    def test_owner_can_update_review(self):
        review = self.create_review()

        response = self.client.patch(
            reverse("review-detail", args=[review.id]),
            {
                "rating": 4,
                "comment": "Đã sửa đánh giá"
            },
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        review.refresh_from_db()

        self.assertEqual(review.rating, 4)
        self.assertEqual(review.comment, "Đã sửa đánh giá")

    def test_other_consumer_cannot_update_review(self):
        review = self.create_review()

        self.client.force_authenticate(user=self.other_consumer)

        response = self.client.patch(
            reverse("review-detail", args=[review.id]),
            {"rating": 1},
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        review.refresh_from_db()

        self.assertEqual(review.rating, 5)

    def test_owner_can_delete_review(self):
        review = self.create_review()

        response = self.client.delete(
            reverse("review-detail", args=[review.id])
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Review.objects.filter(pk=review.id).exists())

    def test_review_detail_is_public(self):
        review = self.create_review()

        self.client.force_authenticate(user=None)

        response = self.client.get(
            reverse("review-detail", args=[review.id])
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], review.id)
        self.assertEqual(response.data["rating"], 5)