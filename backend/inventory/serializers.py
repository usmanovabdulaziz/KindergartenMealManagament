from rest_framework import serializers
from .models import Unit, Supplier, Product, DeliveryLog

class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = ['id', 'name', 'abbreviation', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'contact_email', 'phone', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'total_weight', 'unit', 'threshold', 'is_active', 'created_by', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class DeliveryLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryLog
        fields = ['id', 'product', 'supplier', 'quantity_received', 'delivery_date', 'received_at', 'received_by', 'notes']
        read_only_fields = ['received_at']