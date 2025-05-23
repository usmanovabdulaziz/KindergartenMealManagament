from django.contrib import admin
from .models import Allergen, ProductAllergen

@admin.register(Allergen)
class AllergenAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'created_at', 'updated_at')
    list_filter = ('name',)
    search_fields = ('name',)
    readonly_fields = ('created_at', 'updated_at')

@admin.register(ProductAllergen)
class ProductAllergenAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'allergen', 'created_by', 'created_at')
    list_filter = ('product', 'allergen', 'created_by')
    search_fields = ('product__name', 'allergen__name')
    readonly_fields = ('created_at',)