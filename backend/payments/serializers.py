import uuid

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id", "order", "method", "amount", "status",
            "transaction_code", "paid_at", "created_date", "updated_date"
        ]
        read_only_fields = fields


class PaymentSimulationSerializer(serializers.Serializer):
    @transaction.atomic
    def update(self, instance, validated_data):
        payment = Payment.objects.select_for_update().get(pk=instance.pk)

        if payment.method != "ONLINE":
            raise serializers.ValidationError({
                "detail": "Chỉ hỗ trợ mô phỏng thanh toán ONLINE."
            })

        if payment.status != "PENDING":
            raise serializers.ValidationError({
                "detail": "Payment không còn ở trạng thái PENDING."
            })

        payment.status = "PAID"
        payment.transaction_code = f"SIM-{uuid.uuid4().hex[:16].upper()}"
        payment.paid_at = timezone.now()
        payment.save(
            update_fields=[
                "status",
                "transaction_code",
                "paid_at",
                "updated_date"
            ]
        )

        return payment