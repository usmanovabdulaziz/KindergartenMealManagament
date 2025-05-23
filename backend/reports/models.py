from django.db import models
from django.utils import timezone
from meals.models import Meal
from users.models import User

class MonthlyReport(models.Model):
    meal = models.ForeignKey(Meal, on_delete=models.RESTRICT)
    month_year = models.CharField(max_length=7)  # Format: YYYY-MM
    portions_served = models.IntegerField()
    portions_possible = models.IntegerField()
    discrepancy_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    ingredients_used = models.JSONField(default=dict)  # Stage 4 talabi
    generated_at = models.DateTimeField(default=timezone.now)
    generated_by = models.ForeignKey(User, on_delete=models.RESTRICT, related_name='monthly_reports_generated')

    class Meta:
        db_table = 'MonthlyReport'
        unique_together = ('meal', 'month_year')

    def __str__(self):
        return f"Report for {self.meal.name} ({self.month_year})"