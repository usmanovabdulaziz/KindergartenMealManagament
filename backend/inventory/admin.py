from django.contrib import admin
from .models import Unit, Supplier, Product, DeliveryLog

@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'abbreviation', 'created_at', 'updated_at')
    list_filter = ('name',)
    search_fields = ('name', 'abbreviation')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'contact_email', 'phone', 'is_active', 'created_at', 'updated_at')
    list_filter = ('is_active', 'name')
    search_fields = ('name', 'contact_email', 'phone')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'total_weight', 'unit', 'threshold', 'is_active', 'created_by', 'created_at', 'updated_at')
    list_filter = ('is_active', 'unit', 'created_by')
    search_fields = ('name',)
    readonly_fields = ('created_at', 'updated_at')

@admin.register(DeliveryLog)
class DeliveryLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'supplier', 'quantity_received', 'delivery_date', 'received_at', 'received_by', 'notes')
    list_filter = ('delivery_date', 'received_by', 'supplier')
    search_fields = ('product__name', 'supplier__name', 'notes')
    readonly_fields = ('received_at',)