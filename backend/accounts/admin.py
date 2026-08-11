from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin as DefaultUserAdmin
from django.utils import timezone

from .models import KOC, Address, ApprovalStatus, Farmer, User


class CustomUserAdmin(DefaultUserAdmin):
    list_display = ["username","email","phone_number","role","is_phone_verified","is_staff","is_active"]
    list_filter = ["role","is_phone_verified","is_staff","is_active"]
    search_fields = ["username","email","phone_number","first_name","last_name"]

    fieldsets = DefaultUserAdmin.fieldsets + (
        ("Thông tin AgriConnect",
            {
                "fields": ("role","phone_number","avatar","is_phone_verified")},
        ),
    )

    add_fieldsets = DefaultUserAdmin.add_fieldsets + (
        ("Thông tin AgriConnect",
            {
                "fields": ("email","phone_number","role","avatar","is_phone_verified")},
        ),
    )
    actions = ["deactivate_users", "activate_users"]

    def deactivate_users(self, request, queryset):
        users = queryset.exclude(pk=request.user.pk).exclude(is_superuser=True)
        count = users.update(is_active=False)

        self.message_user(request,f"Đã đình chỉ {count} tài khoản.",level=messages.SUCCESS)
    deactivate_users.short_description = "Đình chỉ tài khoản"

    def activate_users(self, request, queryset):
        count = queryset.update(is_active=True)

        self.message_user(request,f"Đã khôi phục {count} tài khoản.",level=messages.SUCCESS,)

    activate_users.short_description = "Khôi phục tài khoản"

class FarmerAdmin(admin.ModelAdmin):
    list_display = ["id","farm_name","user","approval_status","approved_by","approved_at","created_date"]
    list_filter = ["approval_status","created_date"]
    search_fields = ["farm_name","user__username","user__email","user__phone_number","address"]
    readonly_fields = ["approval_status","approved_by","approved_at","created_date","updated_date"]
    actions = ["approve_farmers","reject_farmers"]

    def formfield_for_foreignkey(self,db_field,request,**kwargs):
        if db_field.name == "user":
            kwargs["queryset"] = User.objects.filter(role=User.Role.FARMER)

        return super().formfield_for_foreignkey(db_field,request,**kwargs)

    def approve_farmers(self, request, queryset):
        now = timezone.now()
        farmers = queryset.filter(approval_status=ApprovalStatus.PENDING)
        count = farmers.update(approval_status=ApprovalStatus.APPROVED,approved_by=request.user,approved_at=now,updated_date=now)

        self.message_user(request,f"Đã duyệt {count} hồ sơ nông dân.",level=messages.SUCCESS)

    approve_farmers.short_description = "Duyệt hồ sơ nông dân"

    def reject_farmers(self, request, queryset):
        now = timezone.now()
        count = queryset.exclude(approval_status=ApprovalStatus.REJECTED).update(
            approval_status=ApprovalStatus.REJECTED,approved_by=None,approved_at=None,updated_date=now)

        self.message_user(request,f"Đã từ chối {count} hồ sơ nông dân.",level=messages.WARNING)

    reject_farmers.short_description = "Từ chối hồ sơ nông dân"


class KOCAdmin(admin.ModelAdmin):
    list_display = ["id","koc_name","user","social_platform","follower","approval_status","approved_by","approved_at"]
    list_filter = ["approval_status","social_platform",]
    search_fields = ["koc_name","user__username","user__email","social_platform",]
    readonly_fields = ["approval_status","approved_by","approved_at","created_date","updated_date"]
    actions = ["approve_kocs","reject_kocs",]

    def formfield_for_foreignkey(self,db_field,request,**kwargs):
        if db_field.name == "user":
            kwargs["queryset"] = User.objects.filter(
                role=User.Role.KOC
            )

        return super().formfield_for_foreignkey(db_field,request,**kwargs)

    def approve_kocs(self, request, queryset):
        now = timezone.now()
        kocs = queryset.filter(approval_status=ApprovalStatus.PENDING)
        count = kocs.update(approval_status=ApprovalStatus.APPROVED,approved_by=request.user,approved_at=now,updated_date=now)

        self.message_user(request,f"Đã duyệt {count} hồ sơ KOC/KOL.",level=messages.SUCCESS,)

    approve_kocs.short_description = "Duyệt hồ sơ KOC/KOL"

    def reject_kocs(self, request, queryset):
        now = timezone.now()

        count = queryset.exclude(
            approval_status=ApprovalStatus.REJECTED
        ).update(approval_status=ApprovalStatus.REJECTED,approved_by=None,approved_at=None,updated_date=now)

        self.message_user(request,f"Đã từ chối {count} hồ sơ KOC/KOL.",level=messages.WARNING)

    reject_kocs.short_description = "Từ chối hồ sơ KOC/KOL"

class AddressAdmin(admin.ModelAdmin):
    list_display = ["id","recipient_name","user","phone_number","province","ward","is_default"]
    list_filter = ["is_default","province"]
    search_fields = ["recipient_name","phone_number","province","ward","address_detail","user__username"]
    readonly_fields = ["created_date","updated_date"]

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)

        if obj.is_default:
            (Address.objects.filter(user=obj.user,is_default=True)
            .exclude(pk=obj.pk)
            .update(is_default=False,updated_date=timezone.now()
            ))

admin.site.register(User, CustomUserAdmin)
admin.site.register(Farmer, FarmerAdmin)
admin.site.register(KOC, KOCAdmin)
admin.site.register(Address, AddressAdmin)

admin.site.site_header = "Quản trị AgriConnect"
admin.site.site_title = "AgriConnect Admin"
admin.site.index_title = "Quản lý hệ thống"