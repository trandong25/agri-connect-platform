from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import KOC, Farmer, User
from affiliates.models import AffiliateLink
from orders.models import CartItem
from products.models import Category, Product, Unit


class CartApiTests(APITestCase):
    def setUp(self):
        self.consumer = User.objects.create_user(
            username="consumer_demo", email="consumer@example.com", password="StrongPass123!",
            role=User.Role.CONSUMER
        )
        farmer_user = User.objects.create_user(
            username="farmer_demo", email="farmer@example.com", password="StrongPass123!", role=User.Role.FARMER
        )
        self.farmer = Farmer.objects.create(user=farmer_user, farm_name="Nông trại Demo")
        self.category = Category.objects.create(name="Trái cây")
        self.unit = Unit.objects.create(name="Kilogram", symbol="kg")
        self.product = Product.objects.create(
            farmer=self.farmer, category=self.category, unit=self.unit, name="Xoài cát", price=Decimal("50000.00"),
            stock_quantity=Decimal("20.00"), minimum_order_quantity=Decimal("2.00"), status="AVAILABLE"
        )
        self.client.force_authenticate(user=self.consumer)

    def test_get_empty_cart(self):
        response = self.client.get(reverse("cart-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["items"], [])
        self.assertEqual(response.data["total_amount"], "0.00")
        self.assertTrue(response.data["is_empty"])

    def test_add_product_to_cart(self):
        response = self.client.post(
            reverse("cart-add-item"), {"product": self.product.id, "quantity": "2.00"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        item = CartItem.objects.get(cart__user=self.consumer, product=self.product)
        self.assertEqual(item.quantity, Decimal("2.00"))
        self.assertEqual(response.data["cart"]["total_amount"], "100000.00")

    def test_adding_same_product_increases_quantity(self):
        add_url = reverse("cart-add-item")
        self.client.post(add_url, {"product": self.product.id, "quantity": "2.00"}, format="json")
        response = self.client.post(add_url, {"product": self.product.id, "quantity": "3.00"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        item = CartItem.objects.get(cart__user=self.consumer, product=self.product)
        self.assertEqual(item.quantity, Decimal("5.00"))

    def test_reject_quantity_greater_than_stock(self):
        response = self.client.post(
            reverse("cart-add-item"), {"product": self.product.id, "quantity": "21.00"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("quantity", response.data)

    def test_update_and_delete_cart_item(self):
        self.client.post(reverse("cart-add-item"), {"product": self.product.id, "quantity": "2.00"}, format="json")
        item = CartItem.objects.get(cart__user=self.consumer, product=self.product)
        detail_url = reverse("cart-item-detail", args=[item.id])

        update_response = self.client.patch(detail_url, {"quantity": "4.00"}, format="json")
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        item.refresh_from_db()
        self.assertEqual(item.quantity, Decimal("4.00"))

        delete_response = self.client.delete(detail_url)
        self.assertEqual(delete_response.status_code, status.HTTP_200_OK)
        self.assertFalse(CartItem.objects.filter(pk=item.pk).exists())

    def test_keep_first_koc_source(self):
        first_koc_user = User.objects.create_user(
            username="koc_first", email="koc_first@example.com", password="StrongPass123!", role=User.Role.KOC
        )
        second_koc_user = User.objects.create_user(
            username="koc_second", email="koc_second@example.com", password="StrongPass123!", role=User.Role.KOC
        )
        first_koc = KOC.objects.create(user=first_koc_user, koc_name="KOC thứ nhất")
        second_koc = KOC.objects.create(user=second_koc_user, koc_name="KOC thứ hai")
        first_link = AffiliateLink.objects.create(koc=first_koc, product=self.product)
        second_link = AffiliateLink.objects.create(koc=second_koc, product=self.product)
        add_url = reverse("cart-add-item")

        self.client.post(
            add_url,
            {"product": self.product.id, "quantity": "2.00", "affiliate_code": str(first_link.code)},
            format="json"
        )
        self.client.post(
            add_url,
            {"product": self.product.id, "quantity": "2.00", "affiliate_code": str(second_link.code)},
            format="json"
        )

        item = CartItem.objects.get(cart__user=self.consumer, product=self.product)
        self.assertEqual(item.affiliate_link, first_link)

    def test_farmer_cannot_use_cart(self):
        self.client.force_authenticate(user=self.farmer.user)
        response = self.client.get(reverse("cart-list"))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)