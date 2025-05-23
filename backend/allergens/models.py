from django.db import models
from django.utils import timezone
from inventory.models import Product
from users.models import User

class Allergen(models.Model):
    name = models.CharField(max_length=100, unique=True)  # Milk, Nuts
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'Allergen'

    def __str__(self):
        return self.name

class ProductAllergen(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    allergen = models.ForeignKey(Allergen, on_delete=models.CASCADE)
    created_by = models.ForeignKey(User, on_delete=models.RESTRICT, related_name='product_allergens_created')
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'ProductAllergen'
        unique_together = ('product', 'allergen')

    def __str__(self):
        return f"{self.product.name} - {self.allergen.name}"