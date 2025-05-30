from rest_framework.views import APIView
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Sum, F
from .models import MonthlyReport
from .serializers import MonthlyReportSerializer
from users.permissions import IsAdminOrManager, IsAdminOnly, IsManagerOnly
from meals.models import Meal, MealIngredient
from operations.models import MealServing, IngredientUsage
from inventory.models import Product, DeliveryLog
import logging

logger = logging.getLogger(__name__)

class MonthlyReportViewSet(viewsets.ModelViewSet):
    queryset = MonthlyReport.objects.all()
    serializer_class = MonthlyReportSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def perform_create(self, serializer):
        serializer.save(generated_by=self.request.user)

    @action(detail=False, methods=['post'], url_path='generate')
    def generate_report(self, request):
        # This is a basic example — you should adjust as needed!
        month = request.data.get('month', timezone.now().month)
        year = request.data.get('year', timezone.now().year)
        for meal in Meal.objects.filter(is_active=True):
            servings = MealServing.objects.filter(
                meal=meal,
                served_at__year=year,
                served_at__month=month
            )
            # FIX: Use the correct field name 'portion_count' (not 'portions_served')
            portions_served = servings.aggregate(total=Sum('portion_count'))['total'] or 0
            # Calculate possible portions for the month (simplified)
            meal_ingredients = MealIngredient.objects.filter(meal=meal)
            possible_portions = min([
                int(ingredient.product.total_weight // ingredient.quantity)
                for ingredient in meal_ingredients if ingredient.quantity > 0
            ]) if meal_ingredients.exists() else 0
            discrepancy = (
                ((possible_portions - portions_served) / possible_portions * 100)
                if possible_portions > 0 else 0
            )
            MonthlyReport.objects.create(
                meal=meal,
                month_year=f"{year}-{month:02d}",
                portions_served=portions_served,
                portions_possible=possible_portions,
                discrepancy_rate=discrepancy,
                generated_by=request.user
            )
        return Response({"status": "Report generated"}, status=200)

    @action(detail=False, methods=['get'], url_path='summary')
    def monthly_summary(self, request):
        # ... (unchanged)
        pass

    @action(detail=False, methods=['get'], url_path='dashboard')
    def dashboard(self, request):
        logger.info(f"Dashboard request by user: {request.user.username}, role: {request.user.role.name}")
        year = int(request.query_params.get('year', timezone.now().year))
        month = int(request.query_params.get('month', timezone.now().month))
        month_year = f"{year}-{month:02d}"

        # --- 1. Available Portions ---
        available_portions = []
        meals = Meal.objects.filter(is_active=True)
        for meal in meals:
            ingredients = MealIngredient.objects.filter(meal=meal)
            portion_estimates = []
            for ingredient in ingredients:
                # Avoid division by zero
                if ingredient.quantity > 0:
                    possible_portions = int(ingredient.product.total_weight // ingredient.quantity)
                    portion_estimates.append(possible_portions)
            max_portions = min(portion_estimates) if portion_estimates else 0
            available_portions.append({
                "meal": meal.name,
                "portions": max_portions
            })

        # --- 2. Low Stock Ingredients ---
        low_stock_products = Product.objects.filter(
            total_weight__lt=F('threshold'),
            threshold__isnull=False,
            is_active=True
        )
        low_stock_ingredients = [
            {
                "id": product.id,
                "name": product.name,
                "total_weight": product.total_weight,
                "threshold": product.threshold,
                "unit": product.unit.abbreviation if product.unit else "N/A",
            }
            for product in low_stock_products
        ]

        # --- 3. Recent Activity ---
        recent_servings = MealServing.objects.all().order_by('-served_at')[:5]
        recent_activities = [
            {
                "meal": serving.meal.name if serving.meal else "Unknown",
                "portion_count": serving.portion_count,
                "served_by": serving.user.username if serving.user else "Unknown",
                "served_at": serving.served_at,
            }
            for serving in recent_servings
        ]

        # --- Other summary cards ---
        meal_count = meals.count()
        active_meals = meals.filter(is_active=True).count()
        products_count = Product.objects.count()

        # Meals served today
        today = timezone.now().date()
        meals_served_today = MealServing.objects.filter(served_at__date=today).count()

        return Response({
            # Main dashboard stats
            "ingredient_count": products_count,
            "active_meals": active_meals,
            "low_stock_count": len(low_stock_ingredients),
            "meals_served_today": meals_served_today,
            # Dashboard widgets
            "available_portions": available_portions,
            "low_stock_ingredients": low_stock_ingredients,
            "recent_activities": recent_activities,
        }, status=status.HTTP_200_OK)


class IngredientUsageReportView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def get(self, request):
        products = Product.objects.filter(is_active=True)
        data = []
        for product in products:
            used = MealIngredient.objects.filter(product=product).aggregate(
                total=Sum('quantity')
            )['total'] or 0
            delivered = DeliveryLog.objects.filter(product=product).aggregate(
                total=Sum('quantity_received')
            )['total'] or 0
            data.append({
                "name": product.name,
                "used": round(used, 2),
                "delivered": round(delivered, 2),
                "unit": product.unit.abbreviation if product.unit else ""
            })
        return Response(data)