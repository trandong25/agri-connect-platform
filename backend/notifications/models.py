from django.db import models

from accounts.models import BaseModel, User


class Notification(BaseModel):
    NOTIFICATION_TYPES = [
        ("ACCOUNT", "Tài khoản"),
        ("ORDER", "Đơn hàng"),
        ("PAYMENT", "Thanh toán"),
        ("COMMISSION", "Hoa hồng"),
        ("SYSTEM", "Hệ thống")
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications", verbose_name="Người nhận")
    notification_type = models.CharField(
        "Loại thông báo", max_length=20,
        choices=NOTIFICATION_TYPES, default="SYSTEM"
    )
    title = models.CharField("Tiêu đề", max_length=250)
    message = models.TextField("Nội dung")
    data = models.JSONField("Dữ liệu liên quan", default=dict, blank=True)
    is_read = models.BooleanField("Đã đọc", default=False)

    class Meta:
        ordering = ["-created_date"]

    def __str__(self):
        return f"{self.user} - {self.title}"