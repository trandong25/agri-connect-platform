import uuid

from django.core.validators import MinValueValidator
from django.db import models

from accounts.models import BaseModel, Farmer, User
from products.models import Product


class Cart(BaseModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="cart", verbose_name="Người dùng")

    def __str__(self):
        return f"Giỏ hàng của {self.user.username}"


class CartItem(BaseModel):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items", verbose_name="Giỏ hàng")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="cart_items", verbose_name="Sản phẩm")
    affiliate_link = models.ForeignKey("affiliates.AffiliateLink", on_delete=models.SET_NULL, null=True, blank=True, related_name="cart_items", verbose_name="Liên kết giới thiệu")
    quantity = models.DecimalField("Số lượng", max_digits=12, decimal_places=2, validators=[MinValueValidator(0.01)])

    class Meta:
        ordering = ["created_date"]
        constraints = [
            models.UniqueConstraint(fields=["cart", "product"], name="unique_product_in_cart"),
            models.CheckConstraint(condition=models.Q(quantity__gt=0), name="cart_item_quantity_greater_than_zero"),
        ]

    def __str__(self):
        return f"{self.product.name} × {self.quantity}"


class Order(BaseModel):
    code = models.UUIDField("Mã đơn hàng", default=uuid.uuid4, editable=False, unique=True)
    consumer = models.ForeignKey(User, on_delete=models.PROTECT, related_name="orders", verbose_name="Người mua")
    recipient_name = models.CharField("Tên người nhận", max_length=150)
    phone_number = models.CharField("Số điện thoại người nhận", max_length=13)
    province = models.CharField("Tỉnh hoặc thành phố", max_length=100)
    ward = models.CharField("Phường hoặc xã", max_length=100)
    address_detail = models.CharField("Địa chỉ chi tiết", max_length=255)
    subtotal = models.DecimalField("Tiền hàng", max_digits=14, decimal_places=2, validators=[MinValueValidator(0)])
    shipping_fee = models.DecimalField("Phí vận chuyển", max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    discount_amount = models.DecimalField("Số tiền giảm", max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    total_amount = models.DecimalField("Tổng tiền", max_digits=14, decimal_places=2, validators=[MinValueValidator(0)])
    note = models.TextField("Ghi chú của người mua", blank=True)

    class Meta:
        ordering = ["-created_date"]

    def __str__(self):
        return f"Đơn hàng {str(self.code)[:8]}"


class SellerOrder(BaseModel):
    ORDER_STATUS = [
        ("PENDING", "Chờ xác nhận"),
        ("CONFIRMED", "Đã xác nhận"),
        ("SHIPPING", "Đang giao hàng"),
        ("COMPLETED", "Đã hoàn thành"),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="seller_orders", verbose_name="Đơn hàng tổng")
    farmer = models.ForeignKey(Farmer, on_delete=models.PROTECT, related_name="seller_orders", verbose_name="Nông dân")
    subtotal = models.DecimalField("Tiền hàng", max_digits=14, decimal_places=2, validators=[MinValueValidator(0)])
    shipping_fee = models.DecimalField("Phí vận chuyển", max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    discount_amount = models.DecimalField("Số tiền giảm", max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    total_amount = models.DecimalField("Tổng tiền", max_digits=14, decimal_places=2, validators=[MinValueValidator(0)])
    status = models.CharField("Trạng thái", max_length=20, choices=ORDER_STATUS, default="PENDING")
    note = models.TextField("Ghi chú của nông dân", blank=True)
    confirmed_at = models.DateTimeField("Thời gian xác nhận", null=True, blank=True)
    shipped_at = models.DateTimeField("Thời gian giao hàng", null=True, blank=True)
    completed_at = models.DateTimeField("Thời gian hoàn thành", null=True, blank=True)

    class Meta:
        ordering = ["-created_date"]
        constraints = [
            models.UniqueConstraint(fields=["order", "farmer"], name="unique_farmer_in_order"),
        ]

    def __str__(self):
        return f"{self.order} - {self.farmer}"


class OrderItem(BaseModel):
    seller_order = models.ForeignKey(SellerOrder, on_delete=models.CASCADE, related_name="items", verbose_name="Đơn hàng của nông dân")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="order_items", verbose_name="Sản phẩm")
    product_name = models.CharField("Tên sản phẩm", max_length=200)
    unit_name = models.CharField("Đơn vị tính", max_length=50)
    unit_price = models.DecimalField("Đơn giá", max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    quantity = models.DecimalField("Số lượng", max_digits=12, decimal_places=2, validators=[MinValueValidator(0.01)])
    subtotal = models.DecimalField("Thành tiền", max_digits=14, decimal_places=2, validators=[MinValueValidator(0)])

    class Meta:
        ordering = ["created_date"]
        constraints = [
            models.UniqueConstraint(fields=["seller_order", "product"], name="unique_product_in_seller_order"),
            models.CheckConstraint(condition=models.Q(quantity__gt=0), name="order_item_quantity_greater_than_zero"),
        ]

    def __str__(self):
        return f"{self.product_name} - {self.quantity}"


class SellerOrderStatusLog(BaseModel):
    seller_order = models.ForeignKey(SellerOrder, on_delete=models.CASCADE, related_name="status_logs", verbose_name="Đơn hàng của nông dân")
    old_status = models.CharField("Trạng thái cũ", max_length=20, choices=SellerOrder.ORDER_STATUS, blank=True)
    new_status = models.CharField("Trạng thái mới", max_length=20, choices=SellerOrder.ORDER_STATUS)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="seller_order_status_changes", verbose_name="Người thay đổi")
    note = models.TextField("Ghi chú", blank=True)

    class Meta:
        ordering = ["created_date"]

    def __str__(self):
        return f"{self.seller_order} - {self.get_new_status_display()}"