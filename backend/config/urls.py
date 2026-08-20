from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.routers import DefaultRouter

from accounts.urls import account_path_urlpatterns
from accounts.urls import router as accounts_router
from products.urls import router as products_router

router = DefaultRouter()

router.registry.extend(accounts_router.registry)
router.registry.extend(products_router.registry)


urlpatterns = [
    path("admin/", admin.site.urls),
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("", include(router.urls)),
    *account_path_urlpatterns,
    path("", include("orders.urls")),
]