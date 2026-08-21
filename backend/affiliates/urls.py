from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("affiliate-links", views.AffiliateLinkViewSet, basename="affiliate-link")
router.register("promotion-posts", views.PromotionPostViewSet, basename="promotion-post")
router.register("commissions", views.CommissionViewSet, basename="commission")

urlpatterns = [
    path("", include(router.urls))
]