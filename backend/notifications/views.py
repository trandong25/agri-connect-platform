from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(
    viewsets.ViewSet,
    generics.ListAPIView,
    generics.RetrieveAPIView
):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["is_read"]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Notification.objects.none()

        return Notification.objects.filter(user=self.request.user)

    @action(methods=["post"], detail=True, url_path="read")
    def read(self, request, pk=None):
        notification = self.get_object()

        if not notification.is_read:
            notification.is_read = True
            notification.save(update_fields=["is_read", "updated_date"])

        return Response(
            NotificationSerializer(notification).data,
            status=status.HTTP_200_OK
        )

    @action(methods=["post"], detail=False, url_path="read-all")
    def read_all(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response(
            {"detail": "Đã đánh dấu tất cả thông báo là đã đọc."},
            status=status.HTTP_200_OK
        )