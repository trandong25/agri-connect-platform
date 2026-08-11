from django.contrib import admin

from .models import (
    Cart, CartItem, Order, OrderItem,
    SellerOrder, SellerOrderStatusLog,
)


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    fields = [
        "product", "affiliate_link",
        "quantity", "created_date","updated_date"
    ]
    readonly_fields = fields
    can_delete = False
    show_change_link = True

    def has_add_permission(self, request, obj=None):
        return False


class SellerOrderInline(admin.TabularInline):
    model = SellerOrder
    extra = 0
    fields = [
        "farmer", "status", "subtotal", "shipping_fee",
        "discount_amount", "total_amount", "created_date",
    ]
    readonly_fields = fields
    can_delete = False
    show_change_link = True

    def has_add_permission(self, request, obj=None):
        return False


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    fields = [
        "product", "product_name", "unit_name",
        "unit_price", "quantity", "subtotal",
    ]
    readonly_fields = fields
    can_delete = False
    show_change_link = True

    def has_add_permission(self, request, obj=None):
        return False


class SellerOrderStatusLogInline(admin.TabularInline):
    model = SellerOrderStatusLog
    extra = 0
    fields = [
        "old_status", "new_status", "changed_by",
        "note", "created_date",
    ]
    readonly_fields = fields
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


class CartAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "created_date", "updated_date"]
    search_fields = ["user__username", "user__email"]
    readonly_fields = ["user", "created_date", "updated_date"]
    list_select_related = ["user"]
    inlines = [CartItemInline]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class CartItemAdmin(admin.ModelAdmin):
    list_display = [
        "id", "cart", "product", "quantity",
        "affiliate_link", "created_date",
    ]
    list_filter = ["created_date"]
    search_fields = [
        "cart__user__username", "cart__user__email",
        "product__name",
    ]
    readonly_fields = [
        "cart", "product", "affiliate_link",
        "quantity", "created_date", "updated_date",
    ]
    list_select_related = ["cart", "product", "affiliate_link"]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class OrderAdmin(admin.ModelAdmin):
    list_display = [
        "id", "code", "consumer", "recipient_name",
        "total_amount", "created_date",
    ]
    list_filter = ["province", "created_date"]
    search_fields = [
        "=code", "consumer__username", "consumer__email",
        "recipient_name", "phone_number",
    ]
    readonly_fields = [
        "code", "consumer", "recipient_name", "phone_number",
        "province", "ward", "address_detail", "subtotal",
        "shipping_fee", "discount_amount", "total_amount",
        "note", "created_date", "updated_date",
    ]
    list_select_related = ["consumer"]
    date_hierarchy = "created_date"
    inlines = [SellerOrderInline]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class SellerOrderAdmin(admin.ModelAdmin):
    list_display = [
        "id", "order", "farmer", "status",
        "total_amount", "created_date",
    ]
    list_filter = ["status", "created_date"]
    search_fields = [
        "=order__code", "farmer__farm_name",
        "farmer__user__username", "farmer__user__email",
    ]
    readonly_fields = [
        "order", "farmer", "subtotal", "shipping_fee",
        "discount_amount", "total_amount", "status", "note",
        "confirmed_at", "shipped_at", "completed_at",
        "created_date", "updated_date",
    ]
    list_select_related = ["order", "farmer", "farmer__user"]
    date_hierarchy = "created_date"
    inlines = [OrderItemInline, SellerOrderStatusLogInline]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class OrderItemAdmin(admin.ModelAdmin):
    list_display = [
        "id", "seller_order", "product_name",
        "unit_price", "quantity", "subtotal",
    ]
    search_fields = [
        "=seller_order__order__code",
        "product_name", "product__name",
    ]
    readonly_fields = [
        "seller_order", "product", "product_name", "unit_name",
        "unit_price", "quantity", "subtotal",
        "created_date", "updated_date",
    ]
    list_select_related = ["seller_order", "product"]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class SellerOrderStatusLogAdmin(admin.ModelAdmin):
    list_display = [
        "id", "seller_order", "old_status",
        "new_status", "changed_by", "created_date",
    ]
    list_filter = ["old_status", "new_status", "created_date"]
    search_fields = [
        "=seller_order__order__code",
        "changed_by__username", "note",
    ]
    readonly_fields = [
        "seller_order", "old_status", "new_status",
        "changed_by", "note", "created_date", "updated_date",
    ]
    list_select_related = ["seller_order", "changed_by"]
    date_hierarchy = "created_date"

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


admin.site.register(Cart, CartAdmin)
admin.site.register(CartItem, CartItemAdmin)
admin.site.register(Order, OrderAdmin)
admin.site.register(SellerOrder, SellerOrderAdmin)
admin.site.register(OrderItem, OrderItemAdmin)
admin.site.register(SellerOrderStatusLog, SellerOrderStatusLogAdmin)