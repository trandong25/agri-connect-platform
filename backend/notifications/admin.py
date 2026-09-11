from django.contrib import admin

from .models import Notification


class NotificationAdmin(admin.ModelAdmin):
    list_display = [
        "id", "user", "notification_type",
        "title", "is_read", "created_date",
    ]
    list_filter = ["notification_type", "is_read", "created_date"]
    search_fields = [
        "title", "message",
        "user__username", "user__email",
    ]
    readonly_fields = [
        "user", "notification_type", "title", "message",
        "data", "is_read", "created_date", "updated_date",
    ]
    list_select_related = ["user"]
    date_hierarchy = "created_date"
    ordering = ["-created_date"]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


admin.site.register(Notification, NotificationAdmin)