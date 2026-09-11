from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Farmer, User

from .models import Category, ImageQualityResult, Product, ProductImage, Unit


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
            farm_name="Nông trại thứ nhất",
            approval_status="APPROVED"
        )
        self.other_farmer = Farmer.objects.create(
            user=self.other_farmer_user,
            farm_name="Nông trại thứ hai",
            approval_status="APPROVED"
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
        response = self.client.get(
            reverse("product-list")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        results = self.get_results(response)
        product_ids = [
            product["id"]
            for product in results
        ]

        self.assertIn(
            self.available_product.id,
            product_ids
        )
        self.assertNotIn(
            self.draft_product.id,
            product_ids
        )
        self.assertNotIn(
            self.hidden_product.id,
            product_ids
        )

    def test_farmer_products_require_authentication(self):
        response = self.client.get(
            reverse("farmer-product-list")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_pending_farmer_cannot_access_farmer_products(self):
        self.farmer.approval_status = "PENDING"
        self.farmer.save(
            update_fields=[
                "approval_status",
                "updated_date"
            ]
        )

        self.client.force_authenticate(
            user=self.farmer_user
        )

        response = self.client.get(
            reverse("farmer-product-list")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    def test_rejected_farmer_cannot_access_farmer_products(self):
        self.farmer.approval_status = "REJECTED"
        self.farmer.save(
            update_fields=[
                "approval_status",
                "updated_date"
            ]
        )

        self.client.force_authenticate(
            user=self.farmer_user
        )

        response = self.client.get(
            reverse("farmer-product-list")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    def test_farmer_can_only_access_own_products(self):
        self.client.force_authenticate(
            user=self.farmer_user
        )

        list_response = self.client.get(
            reverse("farmer-product-list")
        )

        self.assertEqual(
            list_response.status_code,
            status.HTTP_200_OK
        )

        results = self.get_results(list_response)
        product_ids = [
            product["id"]
            for product in results
        ]

        self.assertIn(
            self.draft_product.id,
            product_ids
        )
        self.assertNotIn(
            self.other_product.id,
            product_ids
        )

        detail_response = self.client.get(
            reverse(
                "farmer-product-detail",
                args=[self.other_product.id]
            )
        )

        self.assertEqual(
            detail_response.status_code,
            status.HTTP_404_NOT_FOUND
        )

    def test_farmer_can_create_draft_product(self):
        self.client.force_authenticate(
            user=self.farmer_user
        )

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

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        product = Product.objects.get(
            pk=response.data["id"]
        )

        self.assertEqual(
            product.farmer,
            self.farmer
        )
        self.assertEqual(
            product.status,
            "DRAFT"
        )
        self.assertEqual(
            product.name,
            "Bưởi da xanh"
        )
        self.assertEqual(
            product.price,
            Decimal("60000.00")
        )

    def test_reject_expiry_date_before_harvest_date(self):
        self.client.force_authenticate(
            user=self.farmer_user
        )

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

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )
        self.assertIn(
            "expiry_date",
            response.data
        )
        self.assertFalse(
            Product.objects.filter(
                name="Thanh long"
            ).exists()
        )

    def test_cannot_make_product_available_without_images(self):
        self.client.force_authenticate(
            user=self.farmer_user
        )

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

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.draft_product.refresh_from_db()

        self.assertEqual(
            self.draft_product.status,
            "DRAFT"
        )
    def test_farmer_can_hide_available_product(self):
        self.client.force_authenticate(
            user=self.farmer_user
        )

        response = self.client.patch(
            reverse(
                "farmer-product-detail",
                args=[self.available_product.id]
            ),
            {
                "status": "HIDDEN"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.available_product.refresh_from_db()

        self.assertEqual(
            self.available_product.status,
            "HIDDEN"
        )

    def test_hidden_product_can_return_available_with_acceptable_image(self):
        image = ProductImage.objects.create(
            product=self.hidden_product,
            image="products/test-good.jpg",
            is_primary=True,
            display_order=0
        )

        ImageQualityResult.objects.create(
            image=image,
            is_acceptable=True
        )

        self.client.force_authenticate(
            user=self.farmer_user
        )

        response = self.client.patch(
            reverse(
                "farmer-product-detail",
                args=[self.hidden_product.id]
            ),
            {
                "status": "AVAILABLE"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.hidden_product.refresh_from_db()

        self.assertEqual(
            self.hidden_product.status,
            "AVAILABLE"
        )

    def test_hidden_product_cannot_return_available_with_unchecked_image(self):
        ProductImage.objects.create(
            product=self.hidden_product,
            image="products/test-unchecked.jpg",
            is_primary=True,
            display_order=0
        )

        self.client.force_authenticate(
            user=self.farmer_user
        )

        response = self.client.patch(
            reverse(
                "farmer-product-detail",
                args=[self.hidden_product.id]
            ),
            {
                "status": "AVAILABLE"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.hidden_product.refresh_from_db()

        self.assertEqual(
            self.hidden_product.status,
            "HIDDEN"
        )

    def test_hidden_product_cannot_return_available_with_bad_image(self):
        image = ProductImage.objects.create(
            product=self.hidden_product,
            image="products/test-bad.jpg",
            is_primary=True,
            display_order=0
        )

        ImageQualityResult.objects.create(
            image=image,
            is_acceptable=False
        )

        self.client.force_authenticate(
            user=self.farmer_user
        )

        response = self.client.patch(
            reverse(
                "farmer-product-detail",
                args=[self.hidden_product.id]
            ),
            {
                "status": "AVAILABLE"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.hidden_product.refresh_from_db()

        self.assertEqual(
            self.hidden_product.status,
            "HIDDEN"
        )
    def test_farmer_can_set_acceptable_image_as_primary(self):
        first_image = ProductImage.objects.create(
            product=self.draft_product,
            image="products/first.jpg",
            is_primary=True,
        )
        second_image = ProductImage.objects.create(
            product=self.draft_product,
            image="products/second.jpg",
        )

        ImageQualityResult.objects.create(
            image=first_image,
            is_acceptable=True,
        )
        ImageQualityResult.objects.create(
            image=second_image,
            is_acceptable=True,
        )

        self.client.force_authenticate(
            user=self.farmer_user
        )

        response = self.client.post(
            reverse(
                "farmer-product-image-primary",
                args=[
                    self.draft_product.id,
                    second_image.id,
                ],
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        first_image.refresh_from_db()
        second_image.refresh_from_db()

        self.assertFalse(first_image.is_primary)
        self.assertTrue(second_image.is_primary)

    def test_farmer_cannot_set_unchecked_image_as_primary(self):
        image = ProductImage.objects.create(
            product=self.draft_product,
            image="products/unchecked.jpg",
        )

        self.client.force_authenticate(
            user=self.farmer_user
        )

        response = self.client.post(
            reverse(
                "farmer-product-image-primary",
                args=[
                    self.draft_product.id,
                    image.id,
                ],
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )