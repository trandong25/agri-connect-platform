import os
import struct
import time
import zlib
from collections import defaultdict
from datetime import timedelta
from decimal import Decimal
from io import BytesIO
from urllib.request import Request, urlopen

import cloudinary.uploader
import django
from cloudinary.utils import cloudinary_url
from django.conf import settings
from django.db import transaction
from django.utils import timezone

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from accounts.models import KOC, Address, ApprovalStatus, Farmer, User
from affiliates.models import (
    AffiliateLink,
    Commission,
    PromotionPost,
    PromotionPostMedia,
)
from notifications.models import Notification
from orders.models import (
    Cart,
    CartItem,
    Order,
    OrderItem,
    SellerOrder,
    SellerOrderStatusLog,
)
from payments.models import Payment
from products.models import Category, ImageQualityResult, Product, ProductImage, Unit
from reviews.models import Review

PASSWORD = "Demo@12345"
COMMISSION_RATE = Decimal("5.00")

IMAGE_SOURCES = {
    "Xoài cát Hòa Lộc": (
        "https://images.unsplash.com/photo-1742166300032-ce9026a1efd0?auto=format&fit=crop&w=1200&q=80",
        "xoai-cat-hoa-loc",
        (237, 178, 62),
    ),
    "Ổi nữ hoàng": (
        "https://images.unsplash.com/photo-1719281063826-428f9131c43e?auto=format&fit=crop&w=1200&q=80",
        "oi-nu-hoang",
        (125, 177, 84),
    ),
    "Cam sành": (
        "https://images.unsplash.com/photo-1591436907060-6e1e1501cfad?auto=format&fit=crop&w=1200&q=80",
        "cam-sanh",
        (237, 128, 34),
    ),
    "Mít Thái": (
        "https://images.unsplash.com/photo-1693838310776-eaca5013b8ec?auto=format&fit=crop&w=1200&q=80",
        "mit-thai",
        (145, 158, 62),
    ),
    "Chuối già Nam Mỹ": (
        "https://images.unsplash.com/photo-1674322421927-e85eae755e98?auto=format&fit=crop&w=1200&q=80",
        "chuoi-gia-nam-my",
        (238, 201, 65),
    ),
    "Dưa hấu ruột đỏ": (
        "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=1200&q=80",
        "dua-hau-ruot-do",
        (57, 139, 70),
    ),
    "Bưởi da xanh": (
        "https://images.unsplash.com/photo-1517355236730-cdedf90a2da3?auto=format&fit=crop&w=1200&q=80",
        "buoi-da-xanh",
        (151, 185, 84),
    ),
    "Chanh không hạt": (
        "https://images.unsplash.com/photo-1622249554107-eeb0c828124d?auto=format&fit=crop&w=1200&q=80",
        "chanh-khong-hat",
        (69, 146, 71),
    ),
}


def reset_demo_data():
    demo_orders = Order.objects.filter(consumer__username__startswith="demo_")
    Commission.objects.filter(order_item__seller_order__order__consumer__username__startswith="demo_").delete()
    Review.objects.filter(order_item__seller_order__order__consumer__username__startswith="demo_").delete()
    Payment.objects.filter(order__consumer__username__startswith="demo_").delete()
    demo_orders.delete()
    Cart.objects.filter(user__username__startswith="demo_").delete()
    PromotionPost.objects.filter(affiliate_link__koc__user__username__startswith="demo_").delete()
    AffiliateLink.objects.filter(koc__user__username__startswith="demo_").delete()
    Product.objects.filter(farmer__user__username__startswith="demo_").delete()
    User.objects.filter(username__startswith="demo_").delete()


def create_user(username, email, phone, role, first_name, last_name):
    return User.objects.create_user(
        username=username,
        email=email,
        password=PASSWORD,
        phone_number=phone,
        role=role,
        first_name=first_name,
        last_name=last_name,
        is_phone_verified=True,
    )


def get_category(name, description):
    category, _ = Category.objects.get_or_create(name=name, defaults={"description": description})
    return category


def get_unit(name, symbol):
    unit = Unit.objects.filter(symbol=symbol).first() or Unit.objects.filter(name=name).first()
    return unit or Unit.objects.create(name=name, symbol=symbol)


def create_product(farmer, category, unit, name, description, origin, price, stock, status):
    today = timezone.localdate()
    return Product.objects.create(
        farmer=farmer,
        category=category,
        unit=unit,
        name=name,
        description=description,
        origin=origin,
        price=Decimal(price),
        stock_quantity=Decimal(stock),
        minimum_order_quantity=Decimal("1.00"),
        harvest_date=today - timedelta(days=1),
        expiry_date=today + timedelta(days=10),
        status=status,
    )


def download_image(url, retries=3):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    }
    last_error = None

    for attempt in range(1, retries + 1):
        try:
            request = Request(url, headers=headers)
            with urlopen(request, timeout=25) as response:
                data = response.read()
            if not data:
                raise RuntimeError("Nguồn ảnh trả về dữ liệu rỗng.")
            return data
        except Exception as exc:
            last_error = exc
            if attempt < retries:
                time.sleep(attempt * 2)

    raise RuntimeError(f"Không tải được ảnh sau {retries} lần: {last_error}")


def png_chunk(chunk_type, data):
    checksum = zlib.crc32(chunk_type)
    checksum = zlib.crc32(data, checksum) & 0xFFFFFFFF
    return struct.pack(">I", len(data)) + chunk_type + data + struct.pack(">I", checksum)


def create_fallback_png(color, width=900, height=650):
    background = (246, 246, 242)
    leaf = (70, 132, 70)
    accent = tuple(max(0, value - 35) for value in color)
    pixels = bytearray(width * height * 3)

    def set_pixel(x, y, rgb):
        if 0 <= x < width and 0 <= y < height:
            index = (y * width + x) * 3
            pixels[index:index + 3] = bytes(rgb)

    def fill_rect(x1, y1, x2, y2, rgb):
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(width, x2), min(height, y2)
        for y in range(y1, y2):
            start = (y * width + x1) * 3
            end = (y * width + x2) * 3
            pixels[start:end] = bytes(rgb) * (x2 - x1)

    def fill_ellipse(cx, cy, rx, ry, rgb):
        rx_sq, ry_sq = rx * rx, ry * ry
        for y in range(max(0, cy - ry), min(height, cy + ry + 1)):
            dy_sq = (y - cy) * (y - cy)
            for x in range(max(0, cx - rx), min(width, cx + rx + 1)):
                dx_sq = (x - cx) * (x - cx)
                if dx_sq * ry_sq + dy_sq * rx_sq <= rx_sq * ry_sq:
                    set_pixel(x, y, rgb)

    fill_rect(0, 0, width, height, background)
    fill_ellipse(width // 2, height // 2 + 25, 230, 190, color)
    fill_ellipse(width // 2 - 70, height // 2 - 65, 125, 85, accent)
    fill_ellipse(width // 2 + 155, height // 2 - 135, 95, 42, leaf)
    fill_rect(width // 2 + 30, height // 2 - 195, width // 2 + 55, height // 2 - 100, leaf)

    raw = bytearray()
    row_size = width * 3
    for y in range(height):
        raw.append(0)
        start = y * row_size
        raw.extend(pixels[start:start + row_size])

    signature = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    compressed = zlib.compress(bytes(raw), level=9)
    return signature + png_chunk(b"IHDR", ihdr) + png_chunk(b"IDAT", compressed) + png_chunk(b"IEND", b"")


def create_demo_quality_result(product_image):
    ImageQualityResult.objects.create(
        image=product_image,
        is_blurry=False,
        is_too_dark=False,
        is_too_bright=False,
        is_acceptable=True,
        feedback="Ảnh demo được đánh dấu đạt để phục vụ hiển thị dữ liệu.",
    )


def upload_product_images(products):
    uploaded_public_ids = {}
    print("Đang tạo ảnh sản phẩm trên Cloudinary...")

    for product in products:
        source = IMAGE_SOURCES.get(product.name)
        if not source:
            print(f"  BỎ QUA {product.name}: chưa cấu hình ảnh demo")
            continue

        image_url, slug, fallback_color = source
        public_id = f"agri_connect/products/demo_seed/{slug}"
        used_fallback = False

        try:
            image_bytes = download_image(image_url)
        except Exception as exc:
            used_fallback = True
            image_bytes = create_fallback_png(fallback_color)
            print(f"  CẢNH BÁO {product.name}: {exc}")
            print("           Dùng ảnh demo tạo cục bộ thay thế.")

        try:
            result = cloudinary.uploader.upload(
                BytesIO(image_bytes),
                public_id=public_id,
                resource_type="image",
                overwrite=True,
                invalidate=True,
            )
            product_image = ProductImage.objects.create(
                product=product,
                image=result["public_id"],
                is_primary=True,
                display_order=0,
            )
            create_demo_quality_result(product_image)
            uploaded_public_ids[product.name] = result["public_id"]
            suffix = " (ảnh dự phòng)" if used_fallback else ""
            print(f"  OK  {product.name}{suffix}")
        except Exception as exc:
            print(f"  LỖI CLOUDINARY {product.name}: {exc}")

    print(f"Đã tạo ảnh chính cho {len(uploaded_public_ids)}/{len(products)} sản phẩm.")
    return uploaded_public_ids


def upload_promotion_image(product, promotion_post, slug):
    product_image = ProductImage.objects.filter(product=product, is_primary=True).first()

    if not product_image or not product_image.image:
        print(f"  LỖI media bài quảng bá {product.name}: không có ảnh chính")
        return None

    try:
        product_public_id = getattr(product_image.image, "public_id", None) or str(product_image.image)
        source_url, _ = cloudinary_url(product_public_id, resource_type="image", secure=True)
        image_bytes = download_image(source_url)
        public_id = f"agri_connect/promotion_posts/demo_seed/{slug}"
        result = cloudinary.uploader.upload(
            BytesIO(image_bytes),
            public_id=public_id,
            resource_type="image",
            overwrite=True,
            invalidate=True,
        )
        resource_type = result.get("resource_type", "image")
        upload_type = result.get("type", "upload")
        version = result.get("version")
        public_id = result["public_id"]
        file_format = result.get("format")

        stored_file = f"{resource_type}/{upload_type}/v{version}/{public_id}"
        if file_format:
            stored_file = f"{stored_file}.{file_format}"

        media = PromotionPostMedia.objects.create(
            promotion_post=promotion_post,
            file=stored_file,
            media_type="IMAGE",
            display_order=0,
        )
        print(f"  OK  media bài quảng bá: {product.name}")
        return media
    except Exception as exc:
        print(f"  LỖI media bài quảng bá {product.name}: {exc}")
        return None


def status_timestamps(status, now, days_ago):
    base = now - timedelta(days=days_ago)
    timestamps = {"confirmed_at": None, "shipped_at": None, "completed_at": None}
    if status in ["CONFIRMED", "SHIPPING", "COMPLETED"]:
        timestamps["confirmed_at"] = base + timedelta(hours=4)
    if status in ["SHIPPING", "COMPLETED"]:
        timestamps["shipped_at"] = base + timedelta(hours=12)
    if status == "COMPLETED":
        timestamps["completed_at"] = base + timedelta(hours=20)
    return timestamps


def create_status_logs(seller_order, status, changed_by, now, days_ago):
    transitions = [("PENDING", "CONFIRMED"), ("CONFIRMED", "SHIPPING"), ("SHIPPING", "COMPLETED")]
    required = {"PENDING": 0, "CONFIRMED": 1, "SHIPPING": 2, "COMPLETED": 3}[status]
    base = now - timedelta(days=days_ago)

    for index, (old_status, new_status) in enumerate(transitions[:required], start=1):
        log = SellerOrderStatusLog.objects.create(
            seller_order=seller_order,
            old_status=old_status,
            new_status=new_status,
            changed_by=changed_by,
            note="Cập nhật trạng thái dữ liệu demo",
        )
        SellerOrderStatusLog.objects.filter(pk=log.pk).update(created_date=base + timedelta(hours=index * 4))


def create_order(consumer, address, entries, status, payment_method, days_ago):
    now = timezone.now()
    subtotal = sum((product.price * Decimal(quantity) for product, quantity, _ in entries), Decimal("0.00"))
    shipping_fee = Decimal("20000.00")
    total_amount = subtotal + shipping_fee
    order = Order.objects.create(
        consumer=consumer,
        recipient_name=address.recipient_name,
        phone_number=address.phone_number,
        province=address.province,
        ward=address.ward,
        address_detail=address.address_detail,
        subtotal=subtotal,
        shipping_fee=shipping_fee,
        discount_amount=Decimal("0.00"),
        total_amount=total_amount,
        note="Dữ liệu trình diễn để chụp giao diện",
    )
    Order.objects.filter(pk=order.pk).update(created_date=now - timedelta(days=days_ago))

    grouped = defaultdict(list)
    for product, quantity, affiliate_link in entries:
        grouped[product.farmer].append((product, Decimal(quantity), affiliate_link))

    created_items = []
    for farmer, farmer_entries in grouped.items():
        seller_subtotal = sum((product.price * quantity for product, quantity, _ in farmer_entries), Decimal("0.00"))
        seller_shipping = Decimal("20000.00") if len(grouped) == 1 else Decimal("10000.00")
        timestamps = status_timestamps(status, now, days_ago)
        seller_order = SellerOrder.objects.create(
            order=order,
            farmer=farmer,
            subtotal=seller_subtotal,
            shipping_fee=seller_shipping,
            discount_amount=Decimal("0.00"),
            total_amount=seller_subtotal + seller_shipping,
            status=status,
            confirmed_at=timestamps["confirmed_at"],
            shipped_at=timestamps["shipped_at"],
            completed_at=timestamps["completed_at"],
        )

        for product, quantity, affiliate_link in farmer_entries:
            item = OrderItem.objects.create(
                seller_order=seller_order,
                product=product,
                affiliate_link=affiliate_link,
                product_name=product.name,
                unit_name=product.unit.name,
                unit_price=product.price,
                quantity=quantity,
                subtotal=product.price * quantity,
            )
            created_items.append(item)

        create_status_logs(seller_order, status, farmer.user, now, days_ago)

    payment_status = "PAID" if payment_method == "ONLINE" else "PENDING"
    paid_at = now - timedelta(days=max(days_ago - 1, 0)) if payment_status == "PAID" else None
    Payment.objects.create(
        order=order,
        method=payment_method,
        amount=total_amount,
        status=payment_status,
        transaction_code=f"DEMO-{str(order.code)[:8].upper()}" if payment_status == "PAID" else "",
        paid_at=paid_at,
    )
    return order, created_items


def create_notifications(consumer, farmer_1, farmer_2, koc, pending_order, confirmed_order, shipping_order, completed_order, commission_amount):
    notifications = [
        (consumer, "ORDER", "Đơn hàng đã được xác nhận", "Nông dân đã xác nhận một đơn hàng của bạn.", {"order_id": confirmed_order.id}, False),
        (consumer, "ORDER", "Đơn hàng đang được giao", "Đơn hàng của bạn đang trên đường giao đến.", {"order_id": shipping_order.id}, False),
        (consumer, "ORDER", "Đơn hàng đã hoàn thành", "Đơn hàng đã hoàn thành. Bạn có thể đánh giá sản phẩm.", {"order_id": completed_order.id}, True),
        (consumer, "PAYMENT", "Thanh toán thành công", "Thanh toán trực tuyến mô phỏng đã được ghi nhận thành công.", {"order_id": completed_order.id}, True),
        (farmer_1, "ORDER", "Có đơn hàng mới", "Bạn vừa nhận được đơn hàng mới cần xử lý.", {"order_id": pending_order.id}, False),
        (farmer_2, "ORDER", "Có đơn hàng mới", "Bạn vừa nhận được đơn hàng mới cần xử lý.", {"order_id": pending_order.id}, False),
        (koc, "COMMISSION", "Hoa hồng đã được ghi nhận", f"Bạn nhận được {commission_amount:.0f}đ hoa hồng từ đơn hàng hoàn thành.", {"order_id": completed_order.id}, False),
        (koc, "SYSTEM", "Bài quảng bá đang hoạt động", "Bài quảng bá của bạn đang được hiển thị trên hệ thống.", {}, True),
    ]

    for user, notification_type, title, message, data, is_read in notifications:
        Notification.objects.create(
            user=user,
            notification_type=notification_type,
            title=title,
            message=message,
            data=data,
            is_read=is_read,
        )


def main():
    if not settings.DEBUG:
        raise RuntimeError("Chỉ chạy seed_demo.py khi DEBUG=True.")

    print("Đang tạo lại dữ liệu demo AgriConnect...")

    with transaction.atomic():
        reset_demo_data()

        admin = User.objects.create_superuser(username="demo_admin", email="demo_admin@example.com", password=PASSWORD)
        admin.first_name = "Quản trị"
        admin.last_name = "Demo"
        admin.save(update_fields=["first_name", "last_name"])

        consumer = create_user("demo_consumer", "demo_consumer@example.com", "0900000001", User.Role.CONSUMER, "Nguyễn", "Minh")
        farmer_user_1 = create_user("demo_farmer1", "demo_farmer1@example.com", "0900000002", User.Role.FARMER, "Trần", "Văn An")
        farmer_user_2 = create_user("demo_farmer2", "demo_farmer2@example.com", "0900000003", User.Role.FARMER, "Lê", "Thanh Bình")
        pending_farmer_user = create_user("demo_farmer_pending", "demo_farmer_pending@example.com", "0900000004", User.Role.FARMER, "Phạm", "Minh Khoa")
        koc_user = create_user("demo_koc", "demo_koc@example.com", "0900000005", User.Role.KOC, "Ngọc", "Anh")
        pending_koc_user = create_user("demo_koc_pending", "demo_koc_pending@example.com", "0900000006", User.Role.KOC, "Hoàng", "Gia Hân")
        now = timezone.now()

        farmer_1 = Farmer.objects.create(
            user=farmer_user_1,
            farm_name="Nông trại An Phú",
            address="Cai Lậy, Tiền Giang",
            description="Nông sản theo mùa, thu hoạch và đóng gói trong ngày.",
            approval_status=ApprovalStatus.APPROVED,
            approved_by=admin,
            approved_at=now,
        )
        farmer_2 = Farmer.objects.create(
            user=farmer_user_2,
            farm_name="Vườn nhà Thanh Bình",
            address="Châu Thành, Bến Tre",
            description="Chuyên trái cây và nông sản địa phương.",
            approval_status=ApprovalStatus.APPROVED,
            approved_by=admin,
            approved_at=now,
        )
        Farmer.objects.create(
            user=pending_farmer_user,
            farm_name="Vườn xanh Minh Khoa",
            address="Long Khánh, Đồng Nai",
            description="Hồ sơ demo đang chờ xét duyệt.",
            approval_status=ApprovalStatus.PENDING,
        )

        koc = KOC.objects.create(
            user=koc_user,
            koc_name="Ngọc Anh Review",
            social_platform="TikTok",
            social_url="https://example.com/demo-koc",
            follower=28600,
            approval_status=ApprovalStatus.APPROVED,
            approved_by=admin,
            approved_at=now,
        )
        KOC.objects.create(
            user=pending_koc_user,
            koc_name="Gia Hân Food Review",
            social_platform="Facebook",
            social_url="https://example.com/demo-pending-koc",
            follower=12400,
            approval_status=ApprovalStatus.PENDING,
        )

        address = Address.objects.create(
            user=consumer,
            recipient_name="Nguyễn Minh",
            phone_number="0900000001",
            province="TP. Hồ Chí Minh",
            ward="Phường Tân Thuận",
            address_detail="123 Đường Demo",
            is_default=True,
        )

        fruit = get_category("Trái cây", "Các loại trái cây tươi theo mùa")
        vegetable = get_category("Rau củ", "Rau củ tươi dùng trong gia đình")
        kg = get_unit("Kilogram", "kg")
        fruit_unit = get_unit("Quả", "quả")

        mango = create_product(farmer_1, fruit, kg, "Xoài cát Hòa Lộc", "Xoài chín tự nhiên, vị ngọt thơm.", "Tiền Giang", "85000.00", "45.00", "AVAILABLE")
        guava = create_product(farmer_1, fruit, kg, "Ổi nữ hoàng", "Ổi giòn, ruột ít hạt, thu hoạch trong ngày.", "Tiền Giang", "35000.00", "60.00", "AVAILABLE")
        orange = create_product(farmer_1, fruit, kg, "Cam sành", "Cam mọng nước, vị chua ngọt tự nhiên.", "Vĩnh Long", "42000.00", "80.00", "AVAILABLE")
        draft_product = create_product(farmer_1, fruit, fruit_unit, "Mít Thái", "Sản phẩm đang hoàn thiện thông tin trước khi đăng bán.", "Tiền Giang", "65000.00", "12.00", "DRAFT")
        banana = create_product(farmer_2, fruit, kg, "Chuối già Nam Mỹ", "Chuối chín vừa, phù hợp ăn trực tiếp và làm sinh tố.", "Bến Tre", "30000.00", "70.00", "AVAILABLE")
        watermelon = create_product(farmer_2, fruit, kg, "Dưa hấu ruột đỏ", "Dưa hấu ngọt, trái đều, thu hoạch theo ngày.", "Long An", "25000.00", "100.00", "AVAILABLE")
        pomelo = create_product(farmer_2, fruit, fruit_unit, "Bưởi da xanh", "Bưởi tép hồng, vị ngọt thanh.", "Bến Tre", "78000.00", "35.00", "AVAILABLE")
        hidden_product = create_product(farmer_2, vegetable, kg, "Chanh không hạt", "Sản phẩm tạm ẩn để điều chỉnh tồn kho.", "Bến Tre", "38000.00", "18.00", "HIDDEN")
        products = [mango, guava, orange, draft_product, banana, watermelon, pomelo, hidden_product]

    upload_product_images(products)

    with transaction.atomic():
        mango_link = AffiliateLink.objects.create(koc=koc, product=mango)
        pomelo_link = AffiliateLink.objects.create(koc=koc, product=pomelo)

        mango_post = PromotionPost.objects.create(
            affiliate_link=mango_link,
            content="Xoài cát Hòa Lộc thơm, ngọt và dễ ăn. Phù hợp dùng trực tiếp hoặc làm sinh tố.",
            status="PUBLISHED",
            published_at=now - timedelta(days=3),
        )
        pomelo_post = PromotionPost.objects.create(
            affiliate_link=pomelo_link,
            content="Bưởi da xanh Bến Tre tép hồng, vị ngọt thanh. Một lựa chọn phù hợp cho gia đình.",
            status="PUBLISHED",
            published_at=now - timedelta(days=2),
        )

        upload_promotion_image(mango, mango_post, "review-xoai-cat-hoa-loc")
        upload_promotion_image(pomelo, pomelo_post, "review-buoi-da-xanh")

        cart = Cart.objects.create(user=consumer)
        CartItem.objects.create(cart=cart, product=mango, affiliate_link=mango_link, quantity=Decimal("2.00"))
        CartItem.objects.create(cart=cart, product=guava, quantity=Decimal("1.00"))

        pending_order, _ = create_order(consumer, address, [(mango, "2.00", None), (banana, "2.00", None)], "PENDING", "COD", 6)
        confirmed_order, _ = create_order(consumer, address, [(guava, "3.00", None)], "CONFIRMED", "COD", 4)
        shipping_order, _ = create_order(consumer, address, [(orange, "3.00", None), (watermelon, "4.00", None)], "SHIPPING", "ONLINE", 2)
        completed_order, completed_items = create_order(consumer, address, [(pomelo, "2.00", pomelo_link)], "COMPLETED", "ONLINE", 1)

        reviewed_item = completed_items[0]
        Review.objects.create(
            order_item=reviewed_item,
            rating=5,
            comment="Sản phẩm tươi, đóng gói cẩn thận và đúng mô tả.",
        )

        commission_amount = (reviewed_item.subtotal * COMMISSION_RATE / Decimal("100")).quantize(Decimal("0.01"))
        Commission.objects.create(
            affiliate_link=pomelo_link,
            order_item=reviewed_item,
            rate=COMMISSION_RATE,
            amount=commission_amount,
            status="PAID",
            paid_at=now,
        )

        create_notifications(
            consumer,
            farmer_user_1,
            farmer_user_2,
            koc_user,
            pending_order,
            confirmed_order,
            shipping_order,
            completed_order,
            commission_amount,
        )

    print("")
    print("Đã tạo dữ liệu demo AgriConnect.")
    print(f"Mật khẩu chung: {PASSWORD}")
    print("demo_consumer | Người tiêu dùng")
    print("demo_farmer1 | Nông dân An Phú")
    print("demo_farmer2 | Nông dân Thanh Bình")
    print("demo_koc | KOC đã duyệt")
    print("demo_admin | Django Admin")
    print("demo_farmer_pending | Hồ sơ nông dân chờ duyệt")
    print("demo_koc_pending | Hồ sơ KOC chờ duyệt")
    print("")
    print("Có 8 sản phẩm, giỏ hàng, 4 đơn hàng, review, affiliate, bài quảng bá, hoa hồng và thông báo.")
    print("Ảnh sản phẩm được tải lên Cloudinary và đặt làm ảnh chính.")
    print("Mỗi ảnh seed có ImageQualityResult(is_acceptable=True) để API public cho phép hiển thị.")
    print("Các kết quả này chỉ phục vụ dữ liệu demo. Khi chụp màn Computer Vision hãy chạy CV thật trên ảnh thật.")


if __name__ == "__main__":
    main()