from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from inventory.models import Product
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from rest_framework.permissions import IsAuthenticated
from .models import MealCategory, Meal, MealIngredient, MealServing
from .serializers import MealCategorySerializer, MealSerializer, MealIngredientSerializer, MealServingSerializer
from users.permissions import IsAdminOrManager, IsCook

class MealCategoryViewSet(viewsets.ModelViewSet):
    queryset = MealCategory.objects.all()
    serializer_class = MealCategorySerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager, IsCook]

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save(updated_at=timezone.now())

class MealViewSet(viewsets.ModelViewSet):
    queryset = Meal.objects.all()
    serializer_class = MealSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager, IsCook]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_at=timezone.now())

    @action(detail=True, methods=['get'], url_path='estimate-portions')
    def estimate_portions(self, request, pk=None):
        try:
            meal = self.get_object()
            ingredients = MealIngredient.objects.filter(meal=meal)

            if not ingredients.exists():
                return Response(
                    {"message": "No ingredients defined for this meal"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            portion_estimates = []
            for ingredient in ingredients:
                if ingredient.quantity <= 0:
                    return Response(
                        {"message": f"Invalid quantity for ingredient {ingredient.product.name}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                possible_portions = int(ingredient.product.total_weight // ingredient.quantity)
                portion_estimates.append(possible_portions)

            max_portions = min(portion_estimates) if portion_estimates else 0

            return Response(
                {"meal": meal.name, "max_portions": max_portions},
                status=status.HTTP_200_OK
            )
        except Meal.DoesNotExist:
            return Response(
                {"error": "Meal not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except ZeroDivisionError:
            return Response(
                {"error": "Division by zero error in portion estimation"},
                status=status.HTTP_400_BAD_REQUEST
            )

class MealIngredientViewSet(viewsets.ModelViewSet):
    queryset = MealIngredient.objects.all()
    serializer_class = MealIngredientSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager, IsCook]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_at=timezone.now())

class MealServingViewSet(viewsets.ModelViewSet):
    queryset = MealServing.objects.all()
    serializer_class = MealServingSerializer
    permission_classes = [IsAuthenticated, IsCook]

    def perform_create(self, serializer):
        meal = serializer.validated_data['meal']
        portions = serializer.validated_data['portions_served']
        ingredients = MealIngredient.objects.filter(meal=meal)
        channel_layer = get_channel_layer()

        # Ingredient yetishmovchiligini tekshirish va WebSocket orqali ogohlantirish
        for ingredient in ingredients:
            required_quantity = ingredient.quantity * portions
            if ingredient.product.total_weight < required_quantity:
                async_to_sync(channel_layer.group_send)(
                    'meals',
                    {
                        'type': 'ingredient_warning',
                        'data': {
                            'message': f"Insufficient {ingredient.product.name}: {ingredient.product.total_weight} available, {required_quantity} needed."
                        }
                    }
                )
                raise serializers.ValidationError(
                    f"Insufficient {ingredient.product.name}: {ingredient.product.total_weight} available, {required_quantity} needed."
                )

        # Ingredientlarni inventardan ayirish
        for ingredient in ingredients:
            required_quantity = ingredient.quantity * portions
            ingredient.product.total_weight -= required_quantity
            ingredient.product.save()

        # Saqlash va WebSocket orqali yangilash
        serializer.save(served_by=self.request.user)
        self.notify_portion_update(meal.id)
        self.generate_monthly_report(meal, portions)

    def notify_portion_update(self, meal_id):
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            'meals',
            {
                'type': 'meal_update',
                'data': {'meal_id': meal_id}
            }
        )