from django.contrib import admin
from .models import MealServing, IngredientUsage

@admin.register(MealServing)
class MealServingAdmin(admin.ModelAdmin):
    list_display = ('id', 'meal', 'user', 'portion_count', 'notes', 'served_at', 'created_by')
    list_filter = ('meal', 'user', 'served_at', 'created_by')
    search_fields = ('meal__name', 'user__username', 'notes')
    readonly_fields = ('served_at',)

@admin.register(IngredientUsage)
class IngredientUsageAdmin(admin.ModelAdmin):
    list_display = ('id', 'meal_serving', 'product', 'quantity_used', 'used_at', 'recorded_by')
    list_filter = ('product', 'recorded_by', 'used_at')
    search_fields = ('product__name', 'meal_serving__meal__name')
    readonly_fields = ('used_at',)