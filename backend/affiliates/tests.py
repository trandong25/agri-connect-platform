from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import KOC, Farmer, User
from products.models import Category, Product, Unit

from .models import AffiliateLink, PromotionPost


class AffiliateApiTests(APITestCase):
    def setUp(self):
        self.koc_user = User.objects.create_user(
            username="koc_demo", email="koc@example.com",
            password="StrongPass123!", role=User.Role.KOC
        )
        self.koc = KOC.objects.create(
            user=self.koc_user, koc_name="KOC Demo",
            approval_status="APPROVED"
        )

        farmer_user = User.objects.create_user(
            username="farmer_demo", email="farmer@example.com",
            password="StrongPass123!", role=User.Role.FARMER
        )
        self.farmer = Farmer.objects.create(
            user=farmer_user, farm_name="Nông trại Demo",
            approval_status="APPROVED"
        )

        self.category = Category.objects.create(name="Trái cây")
        self.unit = Unit.objects.create(name="Kilogram", symbol="kg")
        self.product = Product.objects.create(
            farmer=self.farmer, category=self.category, unit=self.unit,
            name="Xoài cát", price=Decimal("50000.00"),
            stock_quantity=Decimal("20.00"),
            minimum_order_quantity=Decimal("1.00"),
            status="AVAILABLE"
        )

        self.client.force_authenticate(user=self.koc_user)

    def test_koc_can_create_affiliate_link(self):
        response = self.client.post(
            reverse("affiliate-link-list"),
            {"product": self.product.id},
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            AffiliateLink.objects.filter(
                koc=self.koc, product=self.product
            ).exists()
        )

    def test_koc_can_create_promotion_post(self):
        affiliate_link = AffiliateLink.objects.create(
            koc=self.koc, product=self.product
        )

        response = self.client.post(
            reverse("promotion-post-list"),
            {
                "affiliate_link": affiliate_link.id,
                "content": "Xoài ngon vừa thu hoạch",
                "status": "PUBLISHED"
            },
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        promotion_post = PromotionPost.objects.get()
        self.assertEqual(promotion_post.affiliate_link, affiliate_link)
        self.assertEqual(promotion_post.status, "PUBLISHED")
        self.assertIsNotNone(promotion_post.published_at)
        self.assertEqual(response.data["media"], [])

    def test_public_can_only_see_published_posts(self):
        affiliate_link = AffiliateLink.objects.create(koc=self.koc, product=self.product)

        published_post = PromotionPost.objects.create(
            affiliate_link=affiliate_link,
            content="Bài đã đăng",
            status="PUBLISHED"
        )
        PromotionPost.objects.create(
            affiliate_link=affiliate_link,
            content="Bài nháp",
            status="DRAFT"
        )

        self.client.force_authenticate(user=None)
        response = self.client.get(reverse("promotion-post-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        post_ids = [item["id"] for item in response.data]

        self.assertIn(published_post.id, post_ids)
        self.assertEqual(len(post_ids), 1)

    def test_pending_koc_cannot_create_affiliate_link(self):
        self.koc.approval_status = "PENDING"
        self.koc.save(update_fields=["approval_status", "updated_date"])

        response = self.client.post(
            reverse("affiliate-link-list"),
            {"product": self.product.id},
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(AffiliateLink.objects.exists())