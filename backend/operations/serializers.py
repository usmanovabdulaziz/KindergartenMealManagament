from rest_framework import serializers
from .models import MealServing, IngredientUsage

class MealServingSerializer(serializers.ModelSerializer):
    class Meta:
        model = MealServing
        fields = ['id', 'meal', 'user', 'portion_count', 'notes', 'served_at', 'created_by']
        read_only_fields = ['served_at']


class IngredientUsageSerializer(serializers.ModelSerializer):
    class Meta:
        model = IngredientUsage
        fields = ['id', 'meal_serving', 'product', 'quantity_used', 'used_at', 'recorded_by']
        read_only_fields = ['used_at']