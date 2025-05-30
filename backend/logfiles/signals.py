from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in, user_logged_out
from .models import Log
from meals.models import Meal
from inventory.models import Product
from users.models import User

def get_user_from_instance(instance):
    # Customize this if your models have a different way to get user
    if hasattr(instance, "user"):
        u = getattr(instance, "user")
        if isinstance(u, User):
            return u
    if hasattr(instance, "created_by"):
        u = getattr(instance, "created_by")
        if isinstance(u, User):
            return u
    if hasattr(instance, "updated_by"):
        u = getattr(instance, "updated_by")
        if isinstance(u, User):
            return u
    return None

def get_details(instance, action):
    model = instance.__class__.__name__
    if action == "create":
        return f"Created {model}: {instance}"
    elif action == "update":
        return f"Updated {model}: {instance}"
    elif action == "delete":
        return f"Deleted {model}: {instance}"
    else:
        return f"{action.capitalize()} {model}: {instance}"

def auto_log_action(user, action, instance):
    if user is not None and not getattr(user, 'is_anonymous', False):
        Log.objects.create(
            user=user,
            action=action,
            details=get_details(instance, action)
        )

# Log create/update for Meal
@receiver(post_save, sender=Meal)
def log_meal_save(sender, instance, created, **kwargs):
    user = get_user_from_instance(instance)
    action = "create" if created else "update"
    auto_log_action(user, action, instance)

@receiver(post_delete, sender=Meal)
def log_meal_delete(sender, instance, **kwargs):
    user = get_user_from_instance(instance)
    auto_log_action(user, "delete", instance)

# Log create/update for Product
@receiver(post_save, sender=Product)
def log_product_save(sender, instance, created, **kwargs):
    user = get_user_from_instance(instance)
    action = "create" if created else "update"
    auto_log_action(user, action, instance)

@receiver(post_delete, sender=Product)
def log_product_delete(sender, instance, **kwargs):
    user = get_user_from_instance(instance)
    auto_log_action(user, "delete", instance)

# Optionally: Log login/logout events
@receiver(user_logged_in)
def log_user_login(sender, user, request, **kwargs):
    Log.objects.create(
        user=user,
        action="login",
        details="User logged in"
    )

@receiver(user_logged_out)
def log_user_logout(sender, user, request, **kwargs):
    Log.objects.create(
        user=user,
        action="logout",
        details="User logged out"
    )