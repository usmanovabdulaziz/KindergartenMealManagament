import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import Meal, MealIngredient
from inventory.models import Product

class MealConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Tokenni olish
        query_string = self.scope['query_string'].decode()
        token = dict(q.split("=") for q in query_string.split("&")).get("token", None)

        if token:
            try:
                # Tokenni autentifikatsiya qilish
                user = await self.get_user_from_token(token)
                if user is not None:
                    self.user = user
                    await self.channel_layer.group_add("meals", self.channel_name)
                    await self.accept()
                    print(f"WebSocket connected for user: {user.username}")
                else:
                    print("Invalid token, closing WebSocket")
                    await self.close()
            except Exception as e:
                print(f"WebSocket connection error: {e}")
                await self.close()
        else:
            print("No token provided, closing WebSocket")
            await self.close()

    @database_sync_to_async
    def get_user_from_token(self, token):
        try:
            jwt_auth = JWTAuthentication()
            validated_token = jwt_auth.get_validated_token(token)
            user = jwt_auth.get_user(validated_token)
            return user
        except Exception as e:
            print(f"Token validation error: {e}")
            return None

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("meals", self.channel_name)
        print(f"WebSocket disconnected: {close_code}")

    async def receive(self, text_data):
        data = json.loads(text_data)
        meal_id = data.get('meal_id')
        if meal_id:
            portion_data = await self.estimate_portions(meal_id)
            await self.channel_layer.group_send(
                "meals",
                {
                    'type': 'meal_update',
                    'data': portion_data
                }
            )

    async def meal_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'meal_update',
            'data': event['data']
        }))

    @database_sync_to_async
    def estimate_portions(self, meal_id):
        try:
            meal = Meal.objects.get(pk=meal_id)
            ingredients = MealIngredient.objects.filter(meal=meal)

            if not ingredients.exists():
                return {'meal_id': meal_id, 'max_portions': 0}

            portion_estimates = []
            for ingredient in ingredients:
                if ingredient.quantity <= 0:
                    return {'meal_id': meal_id, 'max_portions': 0}
                possible_portions = int(ingredient.product.total_weight // ingredient.quantity)
                portion_estimates.append(possible_portions)

            max_portions = min(portion_estimates) if portion_estimates else 0
            return {'meal_id': meal_id, 'max_portions': max_portions}
        except Meal.DoesNotExist:
            return {'meal_id': meal_id, 'max_portions': 0}