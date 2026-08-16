from django.urls import include, path
from rest_framework.routers import DefaultRouter

from orders import views

router = DefaultRouter()
router.register("cart", views.CartViewSet, basename="cart")

urlpatterns = [
    path("", include(router.urls)),
]