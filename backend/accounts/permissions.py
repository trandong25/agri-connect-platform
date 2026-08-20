from rest_framework.permissions import BasePermission

from .models import ApprovalStatus, Farmer, User


class IsFarmer(BasePermission):
    message = "Chức năng này chỉ dành cho nông dân."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.Role.FARMER

class IsApprovedFarmer(BasePermission):
    message = "Chức năng này chỉ dành cho nông dân đã được duyệt."

    def has_permission(self, request, view):
        if not request.user.is_authenticated or request.user.role != User.Role.FARMER:
            return False

        return Farmer.objects.filter(
            user=request.user,
            approval_status=ApprovalStatus.APPROVED
        ).exists()

class IsKOC(BasePermission):
    message = "Chức năng này chỉ dành cho KOC/KOL."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.Role.KOC

class IsConsumer(BasePermission):
    message = "Chức năng này chỉ dành cho người tiêu dùng."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.Role.CONSUMER