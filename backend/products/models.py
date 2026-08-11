from cloudinary.models import CloudinaryField
from django.core.validators import MinValueValidator
from accounts.models import BaseModel, Farmer
from django.db import models


class Category(BaseModel):
    name = models.CharField("Tên danh mục", max_length=100, unique=True)
    description = models.CharField(max_length=150, blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Unit(BaseModel):
    name = models.CharField("Tên đơn vị", max_length=50, unique=True)
    symbol = models.CharField(max_length=20, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Product(BaseModel):
    PRODUCT_STATUS = [('DRAFT', 'Bản nháp'),
                      ('PENDING', 'Chờ kiểm tra'),
                      ('AVAILABLE', 'Đang bán'),
                      ('HIDDEN', 'Đã ẩn'),
                      ('REJECTED', 'Không đạt yêu cầu')
                      ]

    farmer = models.ForeignKey(Farmer, on_delete=models.PROTECT, related_name="products")
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    unit = models.ForeignKey(Unit, on_delete=models.PROTECT, related_name="products")
    name = models.CharField("Tên sản phẩm", max_length=200)
    description = models.CharField(max_length=150, blank=True)
    origin = models.CharField(max_length=255, blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    stock_quantity = models.DecimalField("Số lượng tồn kho", max_digits=12, decimal_places=2,
                                         validators=[MinValueValidator(0)])
    minimum_order_quantity = models.DecimalField(
        "Số lượng đặt tối thiểu",
        max_digits=12,
        decimal_places=2,
        default=1,
        validators=[MinValueValidator(0.01)],
    )
    harvest_date = models.DateField("Ngày thu hoạch", null=True, blank=True, )
    expiry_date = models.DateField("Ngày hết hạn", null=True, blank=True)
    status = models.CharField("Trạng thái", max_length=20, choices=PRODUCT_STATUS, default='DRAFT')
    rejection_reason = models.TextField("Lý do không đạt", blank=True, )

    class Meta:
        ordering = ["-created_date"]

    def __str__(self):
        return self.name


class ProductImage(BaseModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = CloudinaryField("Ảnh sản phẩm", folder="agri_connect/products")
    is_primary = models.BooleanField("Ảnh đại diện", default=False)
    display_order = models.PositiveIntegerField("Thứ tự hiển thị", default=0)

    class Meta:
        ordering = ["display_order", "created_date"]

    def __str__(self):
        return self.product.name


class ImageQualityResult(BaseModel):
    image = models.OneToOneField(ProductImage, on_delete=models.CASCADE, related_name="quality_result")
    raw_blur_score = models.FloatField(null=True, blank=True, )
    normalized_blur_score = models.FloatField("Điểm độ mờ chuẩn hóa", null=True, blank=True, )
    brightness_mean = models.FloatField("Độ sáng trung bình", null=True, blank=True, )
    contrast_std = models.FloatField("Độ tương phản", null=True, blank=True, )
    dark_ratio = models.FloatField("Tỷ lệ vùng tối", null=True, blank=True, )
    bright_ratio = models.FloatField("Tỷ lệ vùng sáng", null=True, blank=True, )
    is_blurry = models.BooleanField("Ảnh bị mờ", default=False, )
    is_too_dark = models.BooleanField("Ảnh quá tối", default=False, )
    is_too_bright = models.BooleanField("Ảnh quá sáng", default=False, )
    is_acceptable = models.BooleanField("Ảnh đạt yêu cầu", default=False, )
    feedback = models.TextField("Hướng dẫn chụp lại", blank=True, )

    def __str__(self):
        result = "Đạt" if self.is_acceptable else "Không đạt"
        return f"{self.image.product.name} - {result}"
