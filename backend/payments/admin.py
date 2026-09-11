from django.contrib import admin

from .models import Payment


class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        "id", "order", "method", "amount",
        "status", "transaction_code", "paid_at", "created_date",
    ]
    list_filter = ["method", "status", "paid_at", "created_date"]
    search_fields = [
        "=order__code", "transaction_code",
        "order__consumer__username", "order__consumer__email",
    ]
    readonly_fields = [
        "order", "method", "amount", "status",
        "transaction_code", "paid_at",
        "created_date", "updated_date",
    ]
    list_select_related = ["order", "order__consumer"]
    date_hierarchy = "created_date"
    ordering = ["-created_date"]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


admin.site.register(Payment, PaymentAdmin)