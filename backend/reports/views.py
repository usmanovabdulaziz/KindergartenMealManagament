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
from inventory.models import Product
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
        year = int(request.data.get('year', timezone.now().year))
        month = int(request.data.get('month', timezone.now().month))
        month_year = f"{year}-{month:02d}"

        meals = Meal.objects.all()
        report_data = []

        for meal in meals:
            servings = MealServing.objects.filter(
                meal=meal,
                served_at__year=year,
                served_at__month=month
            ).aggregate(total_portions=Sum('portion_count'))
            portions_served = servings['total_portions'] or 0

            ingredients = MealIngredient.objects.filter(meal=meal)
            portion_estimates = []
            ingredients_used = {}
            for ingredient in ingredients:
                product = ingredient.product
                usage = IngredientUsage.objects.filter(
                    product=product,
                    used_at__year=year,
                    used_at__month=month
                ).aggregate(total_used=Sum('quantity_used'))['total_used'] or 0
                initial_stock = product.total_weight + usage
                if ingredient.quantity > 0:
                    possible_portions = int(initial_stock // ingredient.quantity)
                else:
                    possible_portions = 0
                portion_estimates.append(possible_portions)
                used_quantity = ingredient.quantity * portions_served
                ingredients_used[product.name] = ingredients_used.get(product.name, 0) + used_quantity

            portions_possible = min(portion_estimates) if portion_estimates else 0

            if portions_possible > 0:
                discrepancy_rate = ((portions_possible - portions_served) / portions_possible) * 100
            else:
                discrepancy_rate = 0.0

            report, created = MonthlyReport.objects.update_or_create(
                meal=meal,
                month_year=month_year,
                defaults={
                    'portions_served': portions_served,
                    'portions_possible': portions_possible,
                    'discrepancy_rate': discrepancy_rate,
                    'ingredients_used': ingredients_used,
                    'generated_by': request.user
                }
            )

            report_data.append({
                "meal": meal.name,
                "month_year": month_year,
                "portions_served": portions_served,
                "portions_possible": portions_possible,
                "discrepancy_rate": discrepancy_rate,
                "ingredients_used": ingredients_used,
                "potential_misuse": discrepancy_rate > 15
            })

        return Response({"reports": report_data}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='summary')
    def monthly_summary(self, request):
        year = int(request.query_params.get('year', timezone.now().year))
        month = int(request.query_params.get('month', timezone.now().month))
        month_year = f"{year}-{month:02d}"

        reports = MonthlyReport.objects.filter(month_year=month_year)
        summary = {
            'total_servings': reports.aggregate(total=Sum('portions_served'))['total'] or 0,
            'total_possible': reports.aggregate(total=Sum('portions_possible'))['total'] or 0,
            'ingredients_used': {},
        }
        for report in reports:
            for product, quantity in report.ingredients_used.items():
                summary['ingredients_used'][product] = summary['ingredients_used'].get(product, 0) + quantity

        return Response(summary, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='dashboard')
    def dashboard(self, request):
        logger.info(f"Dashboard request by user: {request.user.username}, role: {request.user.role.name}")
        year = int(request.query_params.get('year', timezone.now().year))
        month = int(request.query_params.get('month', timezone.now().month))
        month_year = f"{year}-{month:02d}"

        meals = Meal.objects.all()
        meal_count = meals.count()
        active_meals = meals.filter(is_active=True).count()

        reports = MonthlyReport.objects.filter(month_year=month_year)
        summary = {
            'total_servings': reports.aggregate(total=Sum('portions_served'))['total'] or 0,
            'total_possible': reports.aggregate(total=Sum('portions_possible'))['total'] or 0,
            'ingredients_used': {},
        }
        for report in reports:
            for product, quantity in report.ingredients_used.items():
                summary['ingredients_used'][product] = summary['ingredients_used'].get(product, 0) + quantity

        low_stock_products = Product.objects.filter(
            total_weight__lt=F('threshold'),
            threshold__isnull=False,
            is_active=True
        )
        alerts = [
            {
                "product": product.name,
                "total_weight": product.total_weight,
                "threshold": product.threshold,
                "unit": product.unit.abbreviation if product.unit else "N/A",
            }
            for product in low_stock_products
        ]

        recent_servings = MealServing.objects.all().order_by('-served_at')[:5]
        recent_servings_data = [
            {
                "meal": serving.meal.name if serving.meal else "Unknown",
                "portion_count": serving.portion_count,
                "served_by": serving.user.username if serving.user else "Unknown",
                "served_at": serving.served_at.isoformat() if serving.served_at else timezone.now().isoformat(),
            }
            for serving in recent_servings
        ]

        return Response({
            "meal_count": meal_count,
            "active_meals": active_meals,
            "total_servings": summary['total_servings'],
            "total_possible": summary['total_possible'],
            "ingredients_used": summary['ingredients_used'],
            "low_stock_products": alerts,
            "recent_servings": recent_servings_data,
        }, status=status.HTTP_200_OK)