from django.contrib import admin

from .models import AffiliateLink, Commission, PromotionPost, PromotionPostMedia


class PromotionPostInline(admin.TabularInline):
    model = PromotionPost
    extra = 0
    fields = ["content", "status", "published_at", "created_date"]
    readonly_fields = fields
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


class CommissionInline(admin.TabularInline):
    model = Commission
    extra = 0
    fields = ["order_item", "rate", "amount", "status", "paid_at", "created_date"]
    readonly_fields = fields
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


class PromotionPostMediaInline(admin.TabularInline):
    model = PromotionPostMedia
    extra = 0
    fields = ["file", "media_type", "display_order", "created_date"]
    readonly_fields = fields
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


class AffiliateLinkAdmin(admin.ModelAdmin):
    list_display = ["id", "koc", "product", "code", "created_date"]
    list_filter = ["created_date"]
    search_fields = ["=code", "product__name", "koc__user__username", "koc__user__email"]
    readonly_fields = ["koc", "product", "code", "created_date", "updated_date"]
    list_select_related = ["koc", "koc__user", "product"]
    date_hierarchy = "created_date"
    ordering = ["-created_date"]
    inlines = [PromotionPostInline, CommissionInline]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class PromotionPostAdmin(admin.ModelAdmin):
    list_display = ["id", "affiliate_link", "status", "published_at", "created_date"]
    list_filter = ["status", "published_at", "created_date"]
    search_fields = [
        "content", "affiliate_link__product__name",
        "affiliate_link__koc__user__username"
    ]
    readonly_fields = [
        "affiliate_link", "content", "status",
        "published_at", "created_date", "updated_date"
    ]
    list_select_related = ["affiliate_link", "affiliate_link__product", "affiliate_link__koc"]
    date_hierarchy = "created_date"
    ordering = ["-created_date"]
    inlines = [PromotionPostMediaInline]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class PromotionPostMediaAdmin(admin.ModelAdmin):
    list_display = ["id", "promotion_post", "media_type", "display_order", "created_date"]
    list_filter = ["media_type", "created_date"]
    search_fields = [
        "promotion_post__content",
        "promotion_post__affiliate_link__product__name",
        "promotion_post__affiliate_link__koc__user__username"
    ]
    readonly_fields = [
        "promotion_post", "file", "media_type",
        "display_order", "created_date", "updated_date"
    ]
    list_select_related = [
        "promotion_post",
        "promotion_post__affiliate_link",
        "promotion_post__affiliate_link__koc"
    ]
    date_hierarchy = "created_date"
    ordering = ["-created_date"]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class CommissionAdmin(admin.ModelAdmin):
    list_display = [
        "id", "affiliate_link", "order_item",
        "rate", "amount", "status", "paid_at", "created_date"
    ]
    list_filter = ["status", "paid_at", "created_date"]
    search_fields = [
        "=order_item__seller_order__order__code",
        "affiliate_link__product__name",
        "affiliate_link__koc__user__username"
    ]
    readonly_fields = [
        "affiliate_link", "order_item", "rate", "amount",
        "status", "paid_at", "created_date", "updated_date"
    ]
    list_select_related = ["affiliate_link", "affiliate_link__product", "affiliate_link__koc", "order_item"]
    date_hierarchy = "created_date"
    ordering = ["-created_date"]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


admin.site.register(AffiliateLink, AffiliateLinkAdmin)
admin.site.register(PromotionPost, PromotionPostAdmin)
admin.site.register(PromotionPostMedia, PromotionPostMediaAdmin)
admin.site.register(Commission, CommissionAdmin)