from drf_spectacular.utils import extend_schema
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsConsumer

from . import serializers
from .models import Payment


class PaymentViewSet(
    viewsets.ViewSet,
    generics.ListAPIView,
    generics.RetrieveAPIView
):
    serializer_class = serializers.PaymentSerializer
    permission_classes = [permissions.IsAuthenticated, IsConsumer]
    http_method_names = ["get", "post", "head", "options"]

    def get_serializer_class(self):
        if self.action == "simulate":
            return serializers.PaymentSimulationSerializer

        return serializers.PaymentSerializer

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Payment.objects.none()

        return Payment.objects.filter(
            order__consumer=self.request.user
        ).select_related("order")

    @extend_schema(
        request=None,
        responses={200: serializers.PaymentSerializer}
    )
    @action(methods=["post"], detail=True, url_path="simulate")
    def simulate(self, request, pk=None):
        payment = self.get_object()

        serializer = self.get_serializer(
            payment,
            data={},
            context=self.get_serializer_context()
        )
        serializer.is_valid(raise_exception=True)
        payment = serializer.save()

        output_serializer = serializers.PaymentSerializer(
            payment,
            context=self.get_serializer_context()
        )

        return Response(
            output_serializer.data,
            status=status.HTTP_200_OK
        )