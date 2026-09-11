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
            username="koc_demo",
            email="koc@example.com",
            password="StrongPass123!",
            role=User.Role.KOC
        )
        self.koc = KOC.objects.create(
            user=self.koc_user,
            koc_name="KOC Demo",
            approval_status="APPROVED"
        )

        self.farmer_user = User.objects.create_user(
            username="farmer_demo",
            email="farmer@example.com",
            password="StrongPass123!",
            role=User.Role.FARMER
        )
        self.farmer = Farmer.objects.create(
            user=self.farmer_user,
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

        self.client.force_authenticate(user=self.koc_user)

    def create_affiliate_link(self):
        return AffiliateLink.objects.create(
            koc=self.koc,
            product=self.product
        )

    def create_promotion_post(self, status_value="DRAFT"):
        return PromotionPost.objects.create(
            affiliate_link=self.create_affiliate_link(),
            content="Xoài ngon vừa thu hoạch",
            status=status_value
        )

    def test_koc_can_create_affiliate_link(self):
        response = self.client.post(
            reverse("affiliate-link-list"),
            {"product": self.product.id},
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            AffiliateLink.objects.filter(
                koc=self.koc,
                product=self.product
            ).exists()
        )

    def test_duplicate_affiliate_link_returns_same_link(self):
        first_response = self.client.post(
            reverse("affiliate-link-list"),
            {"product": self.product.id},
            format="json"
        )
        second_response = self.client.post(
            reverse("affiliate-link-list"),
            {"product": self.product.id},
            format="json"
        )

        self.assertEqual(first_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(first_response.data["id"], second_response.data["id"])
        self.assertEqual(
            AffiliateLink.objects.filter(
                koc=self.koc,
                product=self.product
            ).count(),
            1
        )

    def test_hidden_product_cannot_create_affiliate_link(self):
        self.product.status = "HIDDEN"
        self.product.save(update_fields=["status", "updated_date"])

        response = self.client.post(
            reverse("affiliate-link-list"),
            {"product": self.product.id},
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AffiliateLink.objects.exists())

    def test_koc_can_create_promotion_post(self):
        affiliate_link = self.create_affiliate_link()

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
        affiliate_link = self.create_affiliate_link()

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

        response = self.client.get(
            reverse("promotion-post-list")
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        post_ids = [item["id"] for item in response.data]

        self.assertIn(published_post.id, post_ids)
        self.assertEqual(len(post_ids), 1)

    def test_public_cannot_see_post_when_product_hidden(self):
        promotion_post = self.create_promotion_post("PUBLISHED")

        self.product.status = "HIDDEN"
        self.product.save(update_fields=["status", "updated_date"])

        self.client.force_authenticate(user=None)

        response = self.client.get(
            reverse("promotion-post-list")
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        post_ids = [item["id"] for item in response.data]

        self.assertNotIn(promotion_post.id, post_ids)

    def test_koc_can_retrieve_own_draft_post(self):
        promotion_post = self.create_promotion_post("DRAFT")

        response = self.client.get(
            reverse(
                "promotion-post-detail",
                args=[promotion_post.id]
            )
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], promotion_post.id)
        self.assertEqual(response.data["status"], "DRAFT")

    def test_koc_cannot_publish_post_when_product_hidden(self):
        promotion_post = self.create_promotion_post("DRAFT")

        self.product.status = "HIDDEN"
        self.product.save(update_fields=["status", "updated_date"])

        response = self.client.patch(
            reverse(
                "promotion-post-detail",
                args=[promotion_post.id]
            ),
            {"status": "PUBLISHED"},
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        promotion_post.refresh_from_db()

        self.assertEqual(promotion_post.status, "DRAFT")
        self.assertIsNone(promotion_post.published_at)

    def test_other_koc_cannot_update_promotion_post(self):
        promotion_post = self.create_promotion_post("DRAFT")

        other_user = User.objects.create_user(
            username="other_koc",
            email="other_koc@example.com",
            password="StrongPass123!",
            role=User.Role.KOC
        )
        KOC.objects.create(
            user=other_user,
            koc_name="Other KOC",
            approval_status="APPROVED"
        )

        self.client.force_authenticate(user=other_user)

        response = self.client.patch(
            reverse(
                "promotion-post-detail",
                args=[promotion_post.id]
            ),
            {"content": "Nội dung đã sửa"},
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        promotion_post.refresh_from_db()

        self.assertEqual(
            promotion_post.content,
            "Xoài ngon vừa thu hoạch"
        )

    def test_pending_koc_cannot_create_affiliate_link(self):
        self.koc.approval_status = "PENDING"
        self.koc.save(
            update_fields=[
                "approval_status",
                "updated_date"
            ]
        )

        response = self.client.post(
            reverse("affiliate-link-list"),
            {"product": self.product.id},
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(AffiliateLink.objects.exists())