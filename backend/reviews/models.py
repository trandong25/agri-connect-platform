from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from accounts.models import BaseModel
from orders.models import OrderItem


class Review(BaseModel):
    order_item = models.OneToOneField(OrderItem, on_delete=models.PROTECT, related_name="review", verbose_name="Sản phẩm đã mua")
    rating = models.PositiveSmallIntegerField("Số sao đánh giá", validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField("Nội dung đánh giá", blank=True)

    class Meta:
        ordering = ["-created_date"]
        constraints = [models.CheckConstraint(condition=models.Q(rating__gte=1, rating__lte=5), name="review_rating_between_1_and_5")]

    def __str__(self):
        return f"{self.order_item.product_name} - {self.rating} sao"