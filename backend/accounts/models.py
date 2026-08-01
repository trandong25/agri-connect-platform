from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        FARMER = "FARMER", "Nông dân"
        CONSUMER = "CONSUMER", "Người tiêu dùng"
        KOC = "KOC", "KOC/KOL"

    role = models.CharField("Vai trò",max_length=20,choices=Role.choices,default=Role.CONSUMER,)
    is_phone_verified = models.BooleanField(default=False)

    REQUIRED_FIELDS = []

    def __str__(self):
        return self.username