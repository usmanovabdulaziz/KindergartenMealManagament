from django.db import models
from django.utils import timezone
from inventory.models import Product
from users.models import User
from django.core.exceptions import ValidationError

class MealCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)  # Soup, Main, Dessert
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)  # Avtomatik yangilanish

    class Meta:
        db_table = 'MealCategory'
        constraints = [
            models.UniqueConstraint(fields=['name'], name='unique_meal_category_name')
        ]

    def __str__(self):
        return self.name

class Meal(models.Model):
    name = models.CharField(max_length=100)
    category = models.ForeignKey(MealCategory, on_delete=models.RESTRICT)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.RESTRICT, related_name='meals_created')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)  # Avtomatik yangilanish

    class Meta:
        db_table = 'Meal'
        constraints = [
            models.UniqueConstraint(fields=['name', 'category'], name='unique_meal_name_category')
        ]

    def __str__(self):
        return self.name

class MealIngredient(models.Model):
    meal = models.ForeignKey(Meal, on_delete=models.CASCADE, related_name='ingredients')
    product = models.ForeignKey(Product, on_delete=models.RESTRICT)
    quantity = models.FloatField()  # Quantity per portion
    created_by = models.ForeignKey(User, on_delete=models.RESTRICT, related_name='meal_ingredients_created')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)  # Avtomatik yangilanish

    class Meta:
        db_table = 'MealIngredient'
        constraints = [
            models.UniqueConstraint(fields=['meal', 'product'], name='unique_meal_ingredient')
        ]

    def __str__(self):
        return f"{self.meal.name}: {self.product.name} ({self.quantity} {self.product.unit.abbreviation})"

    def clean(self):
        if self.quantity <= 0:
            raise ValidationError("Quantity must be greater than zero.")

class MealServing(models.Model):
    meal = models.ForeignKey(Meal, on_delete=models.CASCADE, related_name='servings')
    served_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='meals_served_by_meals')
    served_at = models.DateTimeField(auto_now_add=True)
    portions_served = models.IntegerField()

    class Meta:
        db_table = 'meals_mealserving'

    def __str__(self):
        return f"{self.meal.name} served on {self.served_at}"