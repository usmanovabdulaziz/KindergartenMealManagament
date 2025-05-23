from rest_framework import serializers
from .models import MealCategory, Meal, MealIngredient, MealServing
from inventory.serializers import ProductSerializer
from users.serializers import UserSerializer
from django.core.exceptions import ValidationError

class MealCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MealCategory
        fields = ['id', 'name', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class MealIngredientSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = MealIngredient
        fields = ['id', 'meal', 'product', 'quantity', 'created_by', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def validate_quantity(self, value):
        if value <= 0:
            raise ValidationError("Quantity must be greater than zero.")
        return value

class MealSerializer(serializers.ModelSerializer):
    category = MealCategorySerializer(read_only=True)
    created_by = UserSerializer(read_only=True)
    ingredients = MealIngredientSerializer(many=True, read_only=True)

    class Meta:
        model = Meal
        fields = ['id', 'name', 'category', 'is_active', 'created_by', 'created_at', 'updated_at', 'ingredients']
        read_only_fields = ['created_at', 'updated_at']

class MealServingSerializer(serializers.ModelSerializer):
    meal = MealSerializer(read_only=True)
    served_by = UserSerializer(read_only=True)

    class Meta:
        model = MealServing
        fields = ['id', 'meal', 'served_by', 'served_at', 'portions_served']
        read_only_fields = ['served_at', 'served_by']

    def validate_portions_served(self, value):
        if value <= 0:
            raise ValidationError("Portions served must be greater than zero.")
        return value