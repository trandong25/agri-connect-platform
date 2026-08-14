from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

router = DefaultRouter()
router.register("users", views.UserViewSet, basename="user")
router.register("farmers", views.FarmerViewSet,basename="farmer")
router.register("kocs", views.KOCViewSet, basename="koc")
router.register("addresses",views.AddressViewSet,basename="address")

account_path_urlpatterns = [
    path("login/", views.LoginView.as_view(),name="login"),
    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token-refresh",
    ),
]


urlpatterns = [
    path("", include(router.urls)),
    *account_path_urlpatterns,
]