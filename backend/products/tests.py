from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Farmer, User

from .models import Category, Product, Unit


class ProductApiTests(APITestCase):
    def setUp(self):
        self.farmer_user = User.objects.create_user(
            username="product_farmer",
            email="product_farmer@example.com",
            password="StrongPass123!",
            role=User.Role.FARMER
        )
        self.other_farmer_user = User.objects.create_user(
            username="other_product_farmer",
            email="other_product_farmer@example.com",
            password="StrongPass123!",
            role=User.Role.FARMER
        )

        self.farmer = Farmer.objects.create(
            user=self.farmer_user,
            farm_name="Nông trại thứ nhất"
        )
        self.other_farmer = Farmer.objects.create(
            user=self.other_farmer_user,
            farm_name="Nông trại thứ hai"
        )

        self.category = Category.objects.create(
            name="Trái cây"
        )
        self.unit = Unit.objects.create(
            name="Kilogram",
            symbol="kg"
        )

        self.available_product = Product.objects.create(
            farmer=self.farmer,
            category=self.category,
            unit=self.unit,
            name="Xoài cát",
            price=Decimal("50000.00"),
            stock_quantity=Decimal("20.00"),
            minimum_order_quantity=Decimal("1.00"),
            status="AVAILABLE"
        )
        self.draft_product = Product.objects.create(
            farmer=self.farmer,
            category=self.category,
            unit=self.unit,
            name="Chuối bản nháp",
            price=Decimal("15000.00"),
            stock_quantity=Decimal("30.00"),
            minimum_order_quantity=Decimal("1.00"),
            status="DRAFT"
        )
        self.hidden_product = Product.objects.create(
            farmer=self.farmer,
            category=self.category,
            unit=self.unit,
            name="Cam đã ẩn",
            price=Decimal("30000.00"),
            stock_quantity=Decimal("10.00"),
            minimum_order_quantity=Decimal("1.00"),
            status="HIDDEN"
        )
        self.other_product = Product.objects.create(
            farmer=self.other_farmer,
            category=self.category,
            unit=self.unit,
            name="Ổi Farmer khác",
            price=Decimal("25000.00"),
            stock_quantity=Decimal("15.00"),
            minimum_order_quantity=Decimal("1.00"),
            status="DRAFT"
        )

    def get_results(self, response):
        if isinstance(response.data, dict) and "results" in response.data:
            return response.data["results"]

        return response.data

    def test_public_only_sees_available_products(self):
        response = self.client.get(reverse("product-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        results = self.get_results(response)
        product_ids = [product["id"] for product in results]

        self.assertIn(self.available_product.id, product_ids)
        self.assertNotIn(self.draft_product.id, product_ids)
        self.assertNotIn(self.hidden_product.id, product_ids)

    def test_farmer_can_only_access_own_products(self):
        self.client.force_authenticate(user=self.farmer_user)

        list_response = self.client.get(reverse("farmer-product-list"))

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)

        results = self.get_results(list_response)
        product_ids = [product["id"] for product in results]

        self.assertIn(self.draft_product.id, product_ids)
        self.assertNotIn(self.other_product.id, product_ids)

        detail_response = self.client.get(
            reverse("farmer-product-detail", args=[self.other_product.id])
        )

        self.assertEqual(
            detail_response.status_code,
            status.HTTP_404_NOT_FOUND
        )

    def test_farmer_can_create_draft_product(self):
        self.client.force_authenticate(user=self.farmer_user)

        response = self.client.post(
            reverse("farmer-product-list"),
            {
                "category": self.category.id,
                "unit": self.unit.id,
                "name": "Bưởi da xanh",
                "description": "Bưởi mới thu hoạch",
                "origin": "Bến Tre",
                "price": "60000.00",
                "stock_quantity": "25.00",
                "minimum_order_quantity": "1.00",
                "harvest_date": "2026-08-20",
                "expiry_date": "2026-08-30",
                "status": "DRAFT"
            },
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        product = Product.objects.get(pk=response.data["id"])

        self.assertEqual(product.farmer, self.farmer)
        self.assertEqual(product.status, "DRAFT")
        self.assertEqual(product.name, "Bưởi da xanh")
        self.assertEqual(product.price, Decimal("60000.00"))

    def test_reject_expiry_date_before_harvest_date(self):
        self.client.force_authenticate(user=self.farmer_user)

        response = self.client.post(
            reverse("farmer-product-list"),
            {
                "category": self.category.id,
                "unit": self.unit.id,
                "name": "Thanh long",
                "price": "40000.00",
                "stock_quantity": "20.00",
                "minimum_order_quantity": "1.00",
                "harvest_date": "2026-08-20",
                "expiry_date": "2026-08-19",
                "status": "DRAFT"
            },
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("expiry_date", response.data)
        self.assertFalse(
            Product.objects.filter(name="Thanh long").exists()
        )

    def test_cannot_make_product_available_without_images(self):
        self.client.force_authenticate(user=self.farmer_user)

        response = self.client.patch(
            reverse(
                "farmer-product-detail",
                args=[self.draft_product.id]
            ),
            {
                "status": "AVAILABLE"
            },
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        self.draft_product.refresh_from_db()
        self.assertEqual(self.draft_product.status, "DRAFT")