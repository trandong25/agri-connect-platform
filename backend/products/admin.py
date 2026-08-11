from django.contrib import admin, messages
from django.utils import timezone

from accounts.models import ApprovalStatus, Farmer
from .models import Category, ImageQualityResult, Product, ProductImage, Unit


class CategoryAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "description", "created_date", "updated_date"]
    search_fields = ["name", "description"]
    readonly_fields = ["created_date", "updated_date"]
    ordering = ["name"]

class UnitAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "symbol", "created_date", "updated_date"]
    search_fields = ["name", "symbol"]
    readonly_fields = ["created_date", "updated_date"]
    ordering = ["name"]


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 0
    fields = [
        "image", "is_primary", "display_order",
        "created_date", "updated_date",
    ]
    readonly_fields = ["created_date", "updated_date"]
    show_change_link = True


class ProductAdmin(admin.ModelAdmin):
    list_display = [
        "id", "name", "farmer", "category", "unit",
        "price", "stock_quantity", "status", "created_date",
    ]
    list_filter = [
        "status", "category", "unit", "harvest_date",
        "expiry_date", "created_date",
    ]
    search_fields = [
        "name", "origin", "farmer__farm_name",
        "farmer__user__username", "farmer__user__email",
    ]
    readonly_fields = ["created_date", "updated_date"]
    autocomplete_fields = ["category", "unit"]
    list_select_related = ["farmer", "category", "unit"]
    inlines = [ProductImageInline]
    actions = ["approve_products", "hide_products"]

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "farmer":
            kwargs["queryset"] = Farmer.objects.filter(
                approval_status=ApprovalStatus.APPROVED
            )

        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def approve_products(self, request, queryset):
        now = timezone.now()
        products = queryset.filter(status="PENDING")

        count = products.update(
            status="AVAILABLE",
            rejection_reason="",
            updated_date=now,
        )

        self.message_user(
            request,
            f"Đã duyệt {count} sản phẩm.",
            level=messages.SUCCESS,
        )

    approve_products.short_description = "Duyệt sản phẩm đang chờ"

    def hide_products(self, request, queryset):
        now = timezone.now()
        products = queryset.exclude(status="HIDDEN")

        count = products.update(
            status="HIDDEN",
            updated_date=now,
        )

        self.message_user(
            request,
            f"Đã ẩn {count} sản phẩm.",
            level=messages.WARNING,
        )

    hide_products.short_description = "Ẩn sản phẩm"


class ProductImageAdmin(admin.ModelAdmin):
    list_display = [
        "id", "product", "is_primary",
        "display_order", "created_date",
    ]
    list_filter = ["is_primary", "created_date"]
    search_fields = [
        "product__name",
        "product__farmer__farm_name",
    ]
    readonly_fields = ["created_date", "updated_date"]
    list_select_related = ["product"]


class ImageQualityResultAdmin(admin.ModelAdmin):
    list_display = [
        "id", "image", "is_acceptable", "is_blurry",
        "is_too_dark", "is_too_bright", "created_date",
    ]
    list_filter = [
        "is_acceptable", "is_blurry", "is_too_dark",
        "is_too_bright", "created_date",
    ]
    search_fields = [
        "image__product__name",
        "image__product__farmer__farm_name",
        "feedback",
    ]
    readonly_fields = [
        "image", "raw_blur_score", "normalized_blur_score",
        "brightness_mean", "contrast_std", "dark_ratio",
        "bright_ratio", "is_blurry", "is_too_dark",
        "is_too_bright", "is_acceptable", "feedback",
        "created_date", "updated_date",
    ]
    list_select_related = ["image", "image__product"]

    def has_add_permission(self, request):
        return False


admin.site.register(Category, CategoryAdmin)
admin.site.register(Unit, UnitAdmin)
admin.site.register(Product, ProductAdmin)
admin.site.register(ProductImage, ProductImageAdmin)
admin.site.register(ImageQualityResult, ImageQualityResultAdmin)