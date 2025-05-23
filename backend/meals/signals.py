from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Meal, MealIngredient

@receiver(post_save, sender=Meal)
def meal_updated(sender, instance, **kwargs):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "meals",
        {"type": "meal_update", "data": {"meal_id": instance.id}}
    )

@receiver(post_save, sender=MealIngredient)
@receiver(post_delete, sender=MealIngredient)
def meal_ingredient_changed(sender, instance, **kwargs):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "meals",
        {"type": "meal_update", "data": {"meal_id": instance.meal.id}}
    )