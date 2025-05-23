from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

@receiver(post_save, sender=None)
def product_updated(sender, instance, **kwargs):
    from inventory.models import Product  # 👈 kechiktirilgan import

    if isinstance(instance, Product):
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "inventory",
            {"type": "inventory_update"}
        )
