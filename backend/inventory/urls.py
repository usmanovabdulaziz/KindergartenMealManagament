from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UnitViewSet, SupplierViewSet, ProductViewSet, DeliveryLogViewSet

router = DefaultRouter()
router.register(r'units', UnitViewSet, basename='unit')
router.register(r'suppliers', SupplierViewSet, basename='supplier')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'delivery-logs', DeliveryLogViewSet, basename='deliverylog')

urlpatterns = [
    path('', include(router.urls)),
]