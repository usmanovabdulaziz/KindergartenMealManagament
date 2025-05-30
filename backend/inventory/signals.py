from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Product


@receiver(post_save, sender=None)
def product_updated(sender, instance, **kwargs):
    from inventory.models import Product  # 👈 delayed import

    if isinstance(instance, Product):
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "inventory",
            {"type": "inventory_update"}
        )

@receiver([post_save, post_delete], sender=Product)
def dashboard_product_change(sender, instance, **kwargs):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "dashboard",
        {"type": "dashboard_update"}
    )