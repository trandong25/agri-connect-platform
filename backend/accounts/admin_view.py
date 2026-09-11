from decimal import Decimal

from django.contrib import admin
from django.db.models import Sum
from django.shortcuts import render
from django.utils.dateparse import parse_date

from affiliates.models import Commission, PromotionPost
from orders.models import SellerOrder
from products.models import Product

from .models import KOC, Farmer, User


def admin_statistics(request):
    start_date = parse_date(request.GET.get("start_date", ""))
    end_date = parse_date(request.GET.get("end_date", ""))

    def filter_date(queryset, field="created_date"):
        if start_date:
            queryset = queryset.filter(**{f"{field}__date__gte": start_date})

        if end_date:
            queryset = queryset.filter(**{f"{field}__date__lte": end_date})

        return queryset

    users = User.objects.all()

    if start_date:
        users = users.filter(date_joined__date__gte=start_date)

    if end_date:
        users = users.filter(date_joined__date__lte=end_date)

    products = filter_date(Product.objects.all())
    seller_orders = filter_date(SellerOrder.objects.all())
    commissions = filter_date(Commission.objects.all())
    promotion_posts = filter_date(PromotionPost.objects.all())

    completed_orders = SellerOrder.objects.filter(status="COMPLETED")

    if start_date:
        completed_orders = completed_orders.filter(
            completed_at__date__gte=start_date
        )

    if end_date:
        completed_orders = completed_orders.filter(
            completed_at__date__lte=end_date
        )

    revenue = (
        completed_orders.aggregate(total=Sum("total_amount"))["total"]
        or Decimal("0.00")
    )

    paid_commission = (
        commissions.filter(status="PAID")
        .aggregate(total=Sum("amount"))["total"]
        or Decimal("0.00")
    )

    context = {
        **admin.site.each_context(request),
        "title": "Báo cáo thống kê",
        "start_date": start_date,
        "end_date": end_date,
        "user_stats": {
            "total": users.count(),
            "consumer": users.filter(role=User.Role.CONSUMER).count(),
            "farmer": users.filter(role=User.Role.FARMER).count(),
            "koc": users.filter(role=User.Role.KOC).count()
        },
        "pending_stats": {
            "farmer": Farmer.objects.filter(
                approval_status="PENDING"
            ).count(),
            "koc": KOC.objects.filter(
                approval_status="PENDING"
            ).count()
        },
        "product_stats": {
            "total": products.count(),
            "available": products.filter(status="AVAILABLE").count(),
            "pending": products.filter(status="PENDING").count(),
            "hidden": products.filter(status="HIDDEN").count()
        },
        "order_stats": {
            "total": seller_orders.count(),
            "pending": seller_orders.filter(status="PENDING").count(),
            "confirmed": seller_orders.filter(status="CONFIRMED").count(),
            "shipping": seller_orders.filter(status="SHIPPING").count(),
            "completed": seller_orders.filter(status="COMPLETED").count()
        },
        "affiliate_stats": {
            "posts": promotion_posts.count(),
            "published_posts": promotion_posts.filter(
                status="PUBLISHED"
            ).count(),
            "commissions": commissions.count(),
            "paid_commissions": commissions.filter(status="PAID").count()
        },
        "revenue": revenue,
        "paid_commission": paid_commission
    }

    return render(
        request,
        "accounts/admin_statistics.html",
        context
    )