from rest_framework import serializers
from .models import MealCategory, Meal, MealIngredient, MealServing
from inventory.models import ProductCategory, Product
from inventory.serializers import ProductSerializer, ProductCategorySerializer
from users.serializers import UserSerializer
from django.core.exceptions import ValidationError

class MealCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MealCategory
        fields = ['id', 'name', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class MealIngredientSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True,
        required=True
    )

    class Meta:
        model = MealIngredient
        fields = [
            'id', 'meal', 'product', 'product_id', 'quantity', 'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'product']

    def validate_quantity(self, value):
        if value <= 0:
            raise ValidationError("Quantity must be greater than zero.")
        return value


class MealSerializer(serializers.ModelSerializer):
    category = ProductCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductCategory.objects.all(), source='category', write_only=True, required=True
    )
    created_by = UserSerializer(read_only=True)
    ingredients = MealIngredientSerializer(many=True, read_only=True)

    class Meta:
        model = Meal
        fields = [
            'id', 'name', 'category', 'category_id', 'is_active', 'created_by', 'created_at', 'updated_at', 'ingredients'
        ]
        read_only_fields = ['created_at', 'updated_at']

class MealServingSerializer(serializers.ModelSerializer):
    meal = serializers.PrimaryKeyRelatedField(
        queryset=Meal.objects.all(),
        write_only=True
    )
    meal_detail = MealSerializer(source='meal', read_only=True)
    served_by = UserSerializer(read_only=True)

    class Meta:
        model = MealServing
        fields = ['id', 'meal', 'meal_detail', 'served_by', 'served_at', 'portions_served']
        read_only_fields = ['served_at', 'served_by', 'meal_detail']

    def validate_portions_served(self, value):
        if value <= 0:
            raise ValidationError("Portions served must be greater than zero.")
        return value