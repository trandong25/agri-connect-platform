from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User

from .models import Notification


class NotificationApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="consumer_demo",
            email="consumer@example.com",
            password="StrongPass123!",
            role=User.Role.CONSUMER
        )
        self.other_user = User.objects.create_user(
            username="other_consumer",
            email="other@example.com",
            password="StrongPass123!",
            role=User.Role.CONSUMER
        )

        self.notification = Notification.objects.create(
            user=self.user,
            notification_type="ORDER",
            title="Đơn hàng mới",
            message="Đơn hàng của bạn đã được cập nhật.",
            data={"order_id": 1}
        )
        self.other_notification = Notification.objects.create(
            user=self.other_user,
            notification_type="SYSTEM",
            title="Thông báo khác",
            message="Thông báo của người dùng khác."
        )

        self.client.force_authenticate(user=self.user)

    def test_notifications_require_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.get(
            reverse("notification-list")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_user_can_only_see_own_notifications(self):
        response = self.client.get(
            reverse("notification-list")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        notification_ids = [
            item["id"]
            for item in response.data
        ]

        self.assertIn(
            self.notification.id,
            notification_ids
        )
        self.assertNotIn(
            self.other_notification.id,
            notification_ids
        )

    def test_user_cannot_retrieve_other_notification(self):
        response = self.client.get(
            reverse(
                "notification-detail",
                args=[self.other_notification.id]
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

    def test_user_can_mark_notification_as_read(self):
        response = self.client.post(
            reverse(
                "notification-read",
                args=[self.notification.id]
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.notification.refresh_from_db()

        self.assertTrue(
            self.notification.is_read
        )

    def test_user_cannot_mark_other_notification_as_read(self):
        response = self.client.post(
            reverse(
                "notification-read",
                args=[self.other_notification.id]
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

        self.other_notification.refresh_from_db()

        self.assertFalse(
            self.other_notification.is_read
        )

    def test_read_all_only_updates_own_notifications(self):
        second_notification = Notification.objects.create(
            user=self.user,
            notification_type="PAYMENT",
            title="Thanh toán",
            message="Thanh toán đang được xử lý."
        )

        response = self.client.post(
            reverse("notification-read-all")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.notification.refresh_from_db()
        second_notification.refresh_from_db()
        self.other_notification.refresh_from_db()

        self.assertTrue(
            self.notification.is_read
        )
        self.assertTrue(
            second_notification.is_read
        )
        self.assertFalse(
            self.other_notification.is_read
        )

    def test_filter_unread_notifications(self):
        Notification.objects.create(
            user=self.user,
            notification_type="SYSTEM",
            title="Đã đọc",
            message="Thông báo đã đọc.",
            is_read=True
        )

        response = self.client.get(
            reverse("notification-list"),
            {"is_read": "false"}
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        for item in response.data:
            self.assertFalse(
                item["is_read"]
            )