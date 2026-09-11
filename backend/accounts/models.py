from cloudinary.models import CloudinaryField
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.db import models

phone_validator = RegexValidator(
    regex=r"^(0|\+84)\d{9}$",
    message="Số điện thoại chưa đúng định dạng")



class BaseModel(models.Model):
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)

    class Meta:
        abstract =True

class User(AbstractUser):
    class Role(models.TextChoices):
        FARMER = "FARMER", "Nông dân"
        CONSUMER = "CONSUMER", "Người tiêu dùng"
        KOC = "KOC", "KOC/KOL"

    email = models.EmailField("Email", unique=True)
    role = models.CharField("Vai trò",max_length=20,
                            choices=Role.choices,default=Role.CONSUMER)
    is_phone_verified = models.BooleanField("Đã xác thực số điện thoại",default=False)
    phone_number = models.CharField("Số điện thoại", max_length=12,
                                    unique=True,null=True,blank=True,validators=[phone_validator])
    avatar = CloudinaryField("Ảnh đại diện",folder="agri_connect/avatars",blank=True,null=True)
    REQUIRED_FIELDS = ["email"]

    def __str__(self):
        return self.get_full_name() or self.username

class ApprovalStatus(models.TextChoices):
    PENDING = "PENDING", "Chờ duyệt"
    APPROVED = "APPROVED", "Đã duyệt"
    REJECTED = "REJECTED", "Từ chối"

class Farmer(BaseModel):
    user = models.OneToOneField(User,on_delete=models.CASCADE,related_name="farmer_profile")
    farm_name = models.CharField("Tên nông trại", max_length=250, blank=True)
    address = models.CharField("Địa chỉ", max_length=255, blank=True)
    description = models.TextField(blank=True)
    verification_document = CloudinaryField("Giấy tờ xác minh", folder= "agri_connect/verifi/farmers", null = True,blank = True)
    approval_status = models.CharField(max_length=15,choices=ApprovalStatus.choices,default=ApprovalStatus.PENDING)
    approved_by = models.ForeignKey(User,on_delete=models.SET_NULL,null=True,blank=True,related_name="approved_farmer")
    approved_at = models.DateTimeField(null=True,blank=True)

    def __str__(self):
        return self.farm_name

class KOC(BaseModel):
    user = models.OneToOneField(User,on_delete=models.CASCADE,related_name="koc_profile")
    koc_name = models.CharField("Tên KOC", max_length=150,blank=True)
    social_platform = models.CharField(max_length=100,blank=True)
    social_url = models.URLField(max_length=500,blank=True)
    follower = models.BigIntegerField(default=0)
    approval_status = models.CharField(max_length=15, choices=ApprovalStatus.choices, default=ApprovalStatus.PENDING)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name="approved_koc")
    approved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.koc_name

class Address(BaseModel):
    user = models.ForeignKey(User,on_delete=models.CASCADE,related_name="addresses")
    recipient_name = models.CharField("Tên người nhận",max_length=250)
    phone_number = models.CharField("Số điện thoại", max_length=13,validators=[phone_validator])
    province = models.CharField("Thành Phố/Tỉnh", max_length=150)
    ward = models.CharField("Xã",max_length=150)
    address_detail = models.CharField("Địa chỉ chi tiết", max_length=250)
    is_default = models.BooleanField("Địa chỉ mặc định", default=False)

    class Meta:
        ordering = ["-is_default"]

    def __str__(self):
        return f"{self.recipient_name} - {self.address_detail}"