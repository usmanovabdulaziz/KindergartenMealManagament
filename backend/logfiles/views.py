from rest_framework import viewsets, permissions
from .models import Log
from .serializers import LogSerializer
from users.permissions import IsAdminOnly


class LogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Log.objects.select_related("user")
    serializer_class = LogSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOnly]