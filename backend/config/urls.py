from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from products.urls import router as products_router
from accounts.urls import account_path_urlpatterns, router as accounts_router


router = DefaultRouter()

router.registry.extend(accounts_router.registry)
router.registry.extend(products_router.registry)


urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include(router.urls)),
    *account_path_urlpatterns,
]