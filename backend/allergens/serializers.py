from rest_framework import serializers
from .models import Allergen, ProductAllergen

class AllergenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Allergen
        fields = ['id', 'name', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class ProductAllergenSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductAllergen
        fields = ['id', 'product', 'allergen', 'created_by', 'created_at']
        read_only_fields = ['created_at']