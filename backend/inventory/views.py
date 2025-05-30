from django.db import models
from rest_framework import viewsets, status
from rest_framework.decorators import action
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Unit, Supplier, Product, DeliveryLog, ProductCategory
from .serializers import UnitSerializer, SupplierSerializer, ProductSerializer, DeliveryLogSerializer, ProductCategorySerializer
from users.permissions import IsAdminOrManager, IsAdminOrManagerOrCook


class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManagerOrCook]

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save(updated_at=timezone.now())


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save(updated_at=timezone.now())


class ProductCategoryViewSet(viewsets.ModelViewSet):
    queryset = ProductCategory.objects.all()
    serializer_class = ProductCategorySerializer
    permission_classes = [IsAuthenticated, IsAdminOrManagerOrCook]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManagerOrCook]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_at=timezone.now())

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        warnings = []
        for product in data:
            if product['threshold'] and product['total_weight'] < product['threshold']:
                warnings.append(f"Warning: {product['name']} is below threshold ({product['total_weight']}/{product['threshold']})")
        return Response({'products': data, 'warnings': warnings})

    @action(detail=False, methods=['get'], url_path='low-stock-alerts')
    def low_stock_alerts(self, request):
        low_stock_products = Product.objects.filter(
            total_weight__lt=models.F('threshold'),
            threshold__isnull=False,
            is_active=True
        )
        alerts = [
            {
                "id": product.id,
                "product": product.name,
                "total_weight": product.total_weight,
                "threshold": product.threshold,
                "unit": product.unit.abbreviation,
                "delivery_date": product.delivery_date
            }
            for product in low_stock_products
        ]
        return Response({"low_stock_alerts": alerts}, status=status.HTTP_200_OK)


class DeliveryLogViewSet(viewsets.ModelViewSet):
    queryset = DeliveryLog.objects.all()
    serializer_class = DeliveryLogSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def perform_create(self, serializer):
        serializer.save(received_by=self.request.user)