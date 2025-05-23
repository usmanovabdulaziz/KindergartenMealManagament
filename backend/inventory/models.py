from django.db import models
from django.utils import timezone
from users.models import User

class Unit(models.Model):
    name = models.CharField(max_length=20, unique=True)  # gram, liter, piece
    abbreviation = models.CharField(max_length=10, unique=True)  # g, l, pc
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'Unit'

    def __str__(self):
        return self.name

class Supplier(models.Model):
    name = models.CharField(max_length=100)
    contact_email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=50, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'Supplier'

    def __str__(self):
        return self.name

class Product(models.Model):
    name = models.CharField(max_length=100)
    total_weight = models.IntegerField(default=0)  # Quantity in unit_type
    unit = models.ForeignKey(Unit, on_delete=models.RESTRICT)
    threshold = models.IntegerField(null=True, blank=True)  # Low stock threshold
    delivery_date = models.DateTimeField(default=timezone.now, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.RESTRICT, related_name='products_created')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'Product'
        unique_together = ('name', 'unit')

    def __str__(self):
        return f"{self.name} ({self.total_weight} {self.unit.abbreviation})"

class DeliveryLog(models.Model):
    product = models.ForeignKey(Product, on_delete=models.RESTRICT)
    supplier = models.ForeignKey(Supplier, on_delete=models.RESTRICT)
    quantity_received = models.IntegerField()
    delivery_date = models.DateField()
    received_at = models.DateTimeField(default=timezone.now)
    received_by = models.ForeignKey(User, on_delete=models.RESTRICT, related_name='deliveries_received')
    notes = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'DeliveryLog'

    def __str__(self):
        return f"Delivery of {self.quantity_received} {self.product.unit.abbreviation} of {self.product.name} on {self.delivery_date}"