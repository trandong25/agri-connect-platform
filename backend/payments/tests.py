from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from orders.models import Order

from .models import Payment


class PaymentApiTests(APITestCase):
    def setUp(self):
        self.consumer = User.objects.create_user(
            username="payment_consumer",
            email="payment_consumer@example.com",
            password="StrongPass123!",
            role=User.Role.CONSUMER
        )
        self.other_consumer = User.objects.create_user(
            username="other_payment_consumer",
            email="other_payment_consumer@example.com",
            password="StrongPass123!",
            role=User.Role.CONSUMER
        )
        self.farmer = User.objects.create_user(
            username="payment_farmer",
            email="payment_farmer@example.com",
            password="StrongPass123!",
            role=User.Role.FARMER
        )

        self.order = self.create_order(self.consumer)
        self.other_order = self.create_order(self.other_consumer)

        self.payment = Payment.objects.create(
            order=self.order,
            method="ONLINE",
            amount=Decimal("100000.00"),
            status="PENDING"
        )
        self.other_payment = Payment.objects.create(
            order=self.other_order,
            method="ONLINE",
            amount=Decimal("50000.00"),
            status="PENDING"
        )

        self.client.force_authenticate(user=self.consumer)

    def create_order(self, consumer):
        return Order.objects.create(
            consumer=consumer,
            recipient_name="Người nhận",
            phone_number="0901234567",
            province="Thành phố Hồ Chí Minh",
            ward="Phường 1",
            address_detail="123 Đường ABC",
            subtotal=Decimal("100000.00"),
            shipping_fee=Decimal("0.00"),
            discount_amount=Decimal("0.00"),
            total_amount=Decimal("100000.00")
        )

    def test_consumer_can_only_view_own_payments(self):
        response = self.client.get(reverse("payment-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        payment_ids = [payment["id"] for payment in response.data]

        self.assertIn(self.payment.id, payment_ids)
        self.assertNotIn(self.other_payment.id, payment_ids)

    def test_consumer_can_simulate_online_payment(self):
        response = self.client.post(
            reverse("payment-simulate", args=[self.payment.id]),
            {},
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, "PAID")
        self.assertTrue(self.payment.transaction_code.startswith("SIM-"))
        self.assertIsNotNone(self.payment.paid_at)

    def test_cannot_simulate_cod_payment(self):
        self.payment.method = "COD"
        self.payment.save(update_fields=["method", "updated_date"])

        response = self.client.post(
            reverse("payment-simulate", args=[self.payment.id]),
            {},
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, "PENDING")

    def test_cannot_simulate_paid_payment_again(self):
        self.client.post(
            reverse("payment-simulate", args=[self.payment.id]),
            {},
            format="json"
        )

        response = self.client.post(
            reverse("payment-simulate", args=[self.payment.id]),
            {},
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, "PAID")

    def test_consumer_cannot_access_another_consumers_payment(self):
        response = self.client.get(
            reverse("payment-detail", args=[self.other_payment.id])
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_farmer_cannot_use_payment_api(self):
        self.client.force_authenticate(user=self.farmer)

        response = self.client.get(reverse("payment-list"))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)