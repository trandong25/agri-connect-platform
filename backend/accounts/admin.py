from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User, Farmer, KOC


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = (
        "username",
        "email",
        "role",
        "is_phone_verified",
        "is_staff",
        "is_active",
    )

    list_filter = (
        "role",
        "is_phone_verified",
        "is_staff",
        "is_active",
    )

    search_fields = (
        "username",
        "email",
        "first_name",
        "last_name",
    )

    fieldsets = UserAdmin.fieldsets + (
        (
            "Thông tin ứng dụng",
            {
                "fields": (
                    "role",
                    "is_phone_verified",
                )
            },
        ),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "Thông tin ứng dụng",
            {
                "fields": (
                    "role",
                    "is_phone_verified",
                )
            },
        ),
    )

admin.site.register(Farmer)
admin.site.register(KOC)