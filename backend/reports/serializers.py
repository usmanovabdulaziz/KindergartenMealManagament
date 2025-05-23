from rest_framework import serializers
from .models import MonthlyReport
from meals.serializers import MealSerializer
from users.serializers import UserSerializer

class MonthlyReportSerializer(serializers.ModelSerializer):
    meal = MealSerializer(read_only=True)
    generated_by = UserSerializer(read_only=True)

    class Meta:
        model = MonthlyReport
        fields = ['id', 'meal', 'month_year', 'portions_served', 'portions_possible', 'discrepancy_rate', 'ingredients_used', 'generated_at', 'generated_by']
        read_only_fields = ['generated_at']