from django.urls import include, path
from rest_framework.routers import DefaultRouter

from orders import views

router = DefaultRouter()
router.register("cart", views.CartViewSet, basename="cart")
router.register("orders", views.OrderViewSet, basename="order")
router.register("seller-orders", views.SellerOrderViewSet, basename="seller-order")

urlpatterns = [
    path("", include(router.urls)),
]