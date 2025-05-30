import json
from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework_simplejwt.authentication import JWTAuthentication
from channels.db import database_sync_to_async

class InventoryConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Tokenni olish
        query_string = self.scope['query_string'].decode()
        params = dict(q.split("=", 1) for q in query_string.split("&") if "=" in q)
        token = params.get("token", None)

        if token:
            try:
                # Tokenni autentifikatsiya qilish
                user = await self.get_user_from_token(token)
                if user is not None:
                    self.user = user
                    await self.channel_layer.group_add("inventory", self.channel_name)
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
        await self.channel_layer.group_discard("inventory", self.channel_name)
        print(f"WebSocket disconnected: {close_code}")

    async def inventory_update(self, event):
        from inventory.models import Product
        products = Product.objects.all()
        low_stock = [
            {"name": p.name, "total_weight": p.total_weight, "unit": p.unit.abbreviation}
            for p in products if p.threshold and p.total_weight < p.threshold
        ]
        await self.send(text_data=json.dumps({
            "type": "inventory_update",
            "low_stock": low_stock
        }))