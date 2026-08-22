import uuid

from cloudinary.models import CloudinaryField
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from accounts.models import KOC, BaseModel
from orders.models import OrderItem
from products.models import Product


class AffiliateLink(BaseModel):
    koc = models.ForeignKey(KOC, on_delete=models.PROTECT, related_name="affiliate_links", verbose_name="KOC")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="affiliate_links", verbose_name="Sản phẩm")
    code = models.UUIDField("Mã liên kết", default=uuid.uuid4, editable=False, unique=True)

    class Meta:
        ordering = ["-created_date"]
        constraints = [
            models.UniqueConstraint(fields=["koc", "product"], name="unique_koc_product_affiliate_link")
        ]

    def __str__(self):
        return f"{self.koc} - {self.product.name}"


class PromotionPost(BaseModel):
    POST_STATUS = [
        ("DRAFT", "Bản nháp"),
        ("PUBLISHED", "Đã đăng"),
        ("HIDDEN", "Đã ẩn")
    ]

    affiliate_link = models.ForeignKey(
        AffiliateLink, on_delete=models.PROTECT,
        related_name="promotion_posts", verbose_name="Liên kết quảng bá"
    )
    content = models.TextField("Nội dung", blank=True)
    status = models.CharField("Trạng thái", max_length=20, choices=POST_STATUS, default="DRAFT")
    published_at = models.DateTimeField("Thời gian đăng", null=True, blank=True)

    class Meta:
        ordering = ["-created_date"]

    def __str__(self):
        return f"Bài quảng bá {self.id}"


class PromotionPostMedia(BaseModel):
    MEDIA_TYPES = [
        ("IMAGE", "Hình ảnh"),
        ("VIDEO", "Video")
    ]

    promotion_post = models.ForeignKey(
        PromotionPost, on_delete=models.CASCADE,
        related_name="media", verbose_name="Bài quảng bá"
    )
    file = CloudinaryField(
        "Nội dung media", folder="agri_connect/promotion_posts",
        resource_type="auto"
    )
    media_type = models.CharField("Loại media", max_length=10, choices=MEDIA_TYPES)
    display_order = models.PositiveIntegerField("Thứ tự hiển thị", default=0)

    class Meta:
        ordering = ["display_order", "created_date"]

    def __str__(self):
        return f"Bài quảng bá {self.promotion_post_id} - {self.media_type}"


class Commission(BaseModel):
    COMMISSION_STATUS = [
        ("PENDING", "Chờ ghi nhận"),
        ("APPROVED", "Đã ghi nhận"),
        ("PAID", "Đã thanh toán")
    ]

    affiliate_link = models.ForeignKey(
        AffiliateLink, on_delete=models.PROTECT,
        related_name="commissions", verbose_name="Liên kết quảng bá"
    )
    order_item = models.OneToOneField(
        OrderItem, on_delete=models.PROTECT,
        related_name="commission", verbose_name="Sản phẩm trong đơn hàng"
    )
    rate = models.DecimalField(
        "Tỷ lệ hoa hồng", max_digits=5, decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    amount = models.DecimalField(
        "Tiền hoa hồng", max_digits=14, decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    status = models.CharField(
        "Trạng thái hoa hồng", max_length=20,
        choices=COMMISSION_STATUS, default="PENDING"
    )
    paid_at = models.DateTimeField("Thời gian thanh toán", null=True, blank=True)

    class Meta:
        ordering = ["-created_date"]

    def __str__(self):
        return f"{self.affiliate_link.koc} - {self.amount}"