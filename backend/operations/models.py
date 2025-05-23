from django.db import models
from django.utils import timezone
from meals.models import Meal
from inventory.models import Product
from users.models import User

class MealServing(models.Model):
    meal = models.ForeignKey(Meal, on_delete=models.RESTRICT)
    user = models.ForeignKey(User, on_delete=models.RESTRICT, related_name='meals_served')
    portion_count = models.IntegerField(default=1)
    notes = models.TextField(null=True, blank=True)
    served_at = models.DateTimeField(default=timezone.now)
    created_by = models.ForeignKey(User, on_delete=models.RESTRICT, related_name='meal_servings_created')

    class Meta:
        db_table = 'MealServing'

    def __str__(self):
        return f"{self.meal.name} served by {self.user.username} at {self.served_at}"

class IngredientUsage(models.Model):
    meal_serving = models.ForeignKey(MealServing, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.RESTRICT)
    quantity_used = models.IntegerField()
    used_at = models.DateTimeField(default=timezone.now)
    recorded_by = models.ForeignKey(User, on_delete=models.RESTRICT, related_name='ingredient_usages_recorded')

    class Meta:
        db_table = 'IngredientUsage'

    def __str__(self):
        return f"Used {self.quantity_used} {self.product.unit.abbreviation} of {self.product.name} for {self.meal_serving}"