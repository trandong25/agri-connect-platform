from rest_framework.permissions import BasePermission

from .models import User


class IsFarmer(BasePermission):
    message = "Chức năng này chỉ dành cho nông dân."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == User.Role.FARMER
        )


class IsKOC(BasePermission):
    message = "Chức năng này chỉ dành cho KOC/KOL."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == User.Role.KOC
        )