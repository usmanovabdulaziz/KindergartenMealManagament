from django.db.models import Sum
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models import MealServing, IngredientUsage
from .serializers import MealServingSerializer, IngredientUsageSerializer
from users.permissions import IsCookOrAdmin, IsAdminOrManager
from meals.models import Meal, MealIngredient
from inventory.models import Product

class MealServingViewSet(viewsets.ModelViewSet):
    queryset = MealServing.objects.all()
    serializer_class = MealServingSerializer
    permission_classes = [IsAuthenticated, IsCookOrAdmin]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, created_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='serve')
    def serve_meal(self, request, pk=None):
        try:
            meal = Meal.objects.get(pk=pk)
            portion_count = int(request.data.get('portion_count', 1))
            if portion_count < 1:
                return Response(
                    {"error": "Portion count must be at least 1"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Ingredientlarni tekshirish va inventardan ayirish
            with transaction.atomic():
                ingredients = MealIngredient.objects.filter(meal=meal)
                for ingredient in ingredients:
                    required_quantity = ingredient.quantity * portion_count
                    product = ingredient.product
                    if product.total_weight < required_quantity:
                        return Response(
                            {
                                "error": f"Insufficient {product.name}. Required: {required_quantity} {product.unit.abbreviation}, Available: {product.total_weight} {product.unit.abbreviation}"
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )

                # Inventardan ayirish
                for ingredient in ingredients:
                    required_quantity = ingredient.quantity * portion_count
                    product = ingredient.product
                    product.total_weight -= required_quantity
                    product.save()

                    # IngredientUsage log
                    IngredientUsage.objects.create(
                        meal_serving=None,  # Hozircha meal_serving yaratilmadi
                        product=product,
                        quantity_used=required_quantity,
                        recorded_by=request.user
                    )

                # MealServing log
                meal_serving = MealServing.objects.create(
                    meal=meal,
                    user=request.user,
                    portion_count=portion_count,
                    created_by=request.user
                )

                # IngredientUsage ga meal_serving ni yangilash
                IngredientUsage.objects.filter(
                    meal_serving__isnull=True,
                    recorded_by=request.user,
                    used_at__gte=meal_serving.served_at
                ).update(meal_serving=meal_serving)

            return Response(
                {"message": f"Successfully served {portion_count} portion(s) of {meal.name}"},
                status=status.HTTP_200_OK
            )

        except Meal.DoesNotExist:
            return Response(
                {"error": "Meal not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class IngredientUsageViewSet(viewsets.ModelViewSet):
    queryset = IngredientUsage.objects.all()
    serializer_class = IngredientUsageSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)

    @action(detail=False, methods=['get'], url_path='usage-report')
    def usage_report(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        usages = IngredientUsage.objects.all()
        if start_date and end_date:
            usages = usages.filter(used_at__range=[start_date, end_date])

        usage_data = usages.values('product__name').annotate(
            total_used=Sum('quantity_used')
        ).order_by('product__name')

        return Response({"usage_data": list(usage_data)}, status=status.HTTP_200_OK)