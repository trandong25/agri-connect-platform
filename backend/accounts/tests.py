from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User


class AccountApiTests(APITestCase):
    password = "StrongPass@8492"

    def setUp(self):
        self.user = User.objects.create_user(
            username="farmer_demo",
            email="farmer_demo@example.com",
            password=self.password,
            role=User.Role.FARMER,
        )

    def authenticate(self):
        access_token = RefreshToken.for_user(self.user).access_token
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {access_token}"
        )

    def test_register_user(self):
        data = {
            "username": "consumer_demo",
            "email": "CONSUMER_DEMO@example.com",
            "password": "ConsumerPass@8492",
            "role": User.Role.CONSUMER,
        }

        response = self.client.post(
            reverse("user-list"),
            data,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn("password", response.data)

        user = User.objects.get(username="consumer_demo")
        self.assertEqual(user.email, "consumer_demo@example.com")
        self.assertTrue(user.check_password(data["password"]))

    def test_login_by_username(self):
        response = self.client.post(
            reverse("token"),
            {
                "login": self.user.username,
                "password": self.password,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(
            response.data["user"]["username"],
            self.user.username,
        )

    def test_login_by_email(self):
        response = self.client.post(
            reverse("token"),
            {
                "login": self.user.email.upper(),
                "password": self.password,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_refresh_access_token(self):
        refresh_token = RefreshToken.for_user(self.user)

        response = self.client.post(
            reverse("token-refresh"),
            {"refresh": str(refresh_token)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_current_user_requires_authentication(self):
        response = self.client.get(reverse("user-current-user"))

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_get_current_user(self):
        self.authenticate()

        response = self.client.get(reverse("user-current-user"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.user.id)
        self.assertEqual(response.data["role"], User.Role.FARMER)
        self.assertNotIn("password", response.data)

    def test_update_current_user(self):
        self.authenticate()

        response = self.client.patch(
            reverse("user-current-user"),
            {
                "first_name": "Đồng",
                "last_name": "Trần",
                "phone_number": "0901234567",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "Đồng")
        self.assertEqual(self.user.phone_number, "0901234567")