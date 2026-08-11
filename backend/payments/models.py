from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

from accounts.models import BaseModel
from orders.models import Order


class Payment(BaseModel):
    PAYMENT_METHOD = [
        ("COD", "Thanh toán khi nhận hàng"),
        ("ONLINE", "Thanh toán trực tuyến")
    ]
    PAYMENT_STATUS = [
        ("PENDING", "Chờ thanh toán"),
        ("PAID", "Đã thanh toán"),
        ("FAILED", "Thanh toán thất bại")
    ]

    order = models.ForeignKey(Order, on_delete=models.PROTECT, related_name="payments", verbose_name="Đơn hàng")
    method = models.CharField("Phương thức thanh toán", max_length=20, choices=PAYMENT_METHOD)
    amount = models.DecimalField("Số tiền thanh toán", max_digits=14, decimal_places=2, validators=[MinValueValidator(0)])
    status = models.CharField("Trạng thái thanh toán", max_length=20, choices=PAYMENT_STATUS, default="PENDING")
    transaction_code = models.CharField("Mã giao dịch", max_length=100, blank=True)
    paid_at = models.DateTimeField("Thời gian thanh toán", null=True, blank=True)

    class Meta:
        ordering = ["-created_date"]

    def mark_as_paid(self):
        self.status = "PAID"
        self.paid_at = timezone.now()
        self.save(update_fields=["status", "paid_at", "updated_date"])

    def __str__(self):
        return f"{self.order} - {self.get_method_display()} - {self.get_status_display()}"