from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User

from .models import Notification


class NotificationApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="notification_user",
            email="notification@example.com",
            password="StrongPass123!",
            role=User.Role.CONSUMER
        )
        self.other_user = User.objects.create_user(
            username="other_notification_user",
            email="other_notification@example.com",
            password="StrongPass123!",
            role=User.Role.CONSUMER
        )

        self.notification = Notification.objects.create(
            user=self.user,
            notification_type="ORDER",
            title="Đơn hàng đã xác nhận",
            message="Đơn hàng của bạn đã được xác nhận."
        )
        self.other_notification = Notification.objects.create(
            user=self.other_user,
            notification_type="ORDER",
            title="Thông báo người khác",
            message="Thông báo này thuộc người dùng khác."
        )

        self.client.force_authenticate(user=self.user)

    def test_user_can_only_see_own_notifications(self):
        response = self.client.get(reverse("notification-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        notification_ids = [item["id"] for item in response.data]

        self.assertIn(self.notification.id, notification_ids)
        self.assertNotIn(self.other_notification.id, notification_ids)

    def test_user_can_mark_notification_as_read(self):
        response = self.client.post(
            reverse("notification-read", args=[self.notification.id])
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.notification.refresh_from_db()
        self.assertTrue(self.notification.is_read)

    def test_user_can_mark_all_notifications_as_read(self):
        second_notification = Notification.objects.create(
            user=self.user,
            notification_type="PAYMENT",
            title="Thanh toán thành công",
            message="Thanh toán của bạn đã thành công."
        )

        response = self.client.post(reverse("notification-read-all"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.notification.refresh_from_db()
        second_notification.refresh_from_db()
        self.other_notification.refresh_from_db()

        self.assertTrue(self.notification.is_read)
        self.assertTrue(second_notification.is_read)
        self.assertFalse(self.other_notification.is_read)