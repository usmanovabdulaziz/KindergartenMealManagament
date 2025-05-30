from django.contrib import admin
from .models import MealCategory, Meal, MealIngredient

# @admin.register(MealCategory)
# class MealCategoryAdmin(admin.ModelAdmin):
#     list_display = ('id', 'name', 'created_at', 'updated_at')
#     list_filter = ('name',)
#     search_fields = ('name',)
#     readonly_fields = ('created_at', 'updated_at')

@admin.register(Meal)
class MealAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category', 'is_active', 'created_by', 'created_at', 'updated_at')
    list_filter = ('category', 'is_active', 'created_by')
    search_fields = ('name',)
    readonly_fields = ('created_at', 'updated_at')

@admin.register(MealIngredient)
class MealIngredientAdmin(admin.ModelAdmin):
    list_display = ('id', 'meal', 'product', 'quantity', 'created_by', 'created_at', 'updated_at')
    list_filter = ('meal', 'product', 'created_by')
    search_fields = ('meal__name', 'product__name')
    readonly_fields = ('created_at', 'updated_at')