from rest_framework import viewsets
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from .models import Allergen, ProductAllergen
from .serializers import AllergenSerializer, ProductAllergenSerializer
from users.permissions import IsAdminOrManager

class AllergenViewSet(viewsets.ModelViewSet):
    queryset = Allergen.objects.all()
    serializer_class = AllergenSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save(updated_at=timezone.now())


class ProductAllergenViewSet(viewsets.ModelViewSet):
    queryset = ProductAllergen.objects.all()
    serializer_class = ProductAllergenSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)