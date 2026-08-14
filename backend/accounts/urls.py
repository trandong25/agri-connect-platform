from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

router = DefaultRouter()
router.register("users", views.UserViewSet, basename="user")
router.register("farmers", views.FarmerViewSet,basename="farmer")
router.register("kocs", views.KOCViewSet, basename="koc")
router.register("addresses",views.AddressViewSet,basename="address")

urlpatterns = [
    path("token/", views.LoginView.as_view(), name="token"),
    path("token/refresh/",TokenRefreshView.as_view(),name="token-refresh"),
    path("", include(router.urls)),
]