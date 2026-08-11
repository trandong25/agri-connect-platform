from django.contrib import admin

from .models import Review


class ReviewAdmin(admin.ModelAdmin):
    list_display = [
        "id", "order_item", "rating",
        "created_date", "updated_date",
    ]
    list_filter = ["rating", "created_date"]
    search_fields = [
        "=order_item__seller_order__order__code",
        "order_item__product_name", "comment",
        "order_item__seller_order__order__consumer__username",
        "order_item__seller_order__order__consumer__email",
    ]
    readonly_fields = [
        "order_item", "rating", "comment",
        "created_date", "updated_date",
    ]
    list_select_related = [
        "order_item",
        "order_item__seller_order",
        "order_item__seller_order__order",
    ]
    date_hierarchy = "created_date"
    ordering = ["-created_date"]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


admin.site.register(Review, ReviewAdmin)