from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()

router.register("categories",views.CategoryViewSet,basename="category")
router.register("units",views.UnitViewSet,basename="unit")
router.register("products",views.ProductViewSet,basename="product")
router.register("farmer-products",views.FarmerProductViewSet,basename="farmer-product")


urlpatterns = [
    path("", include(router.urls)),
]