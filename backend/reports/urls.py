from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MonthlyReportViewSet, IngredientUsageReportView

router = DefaultRouter()
router.register(r'monthly-reports', MonthlyReportViewSet, basename='monthlyreport')

urlpatterns = [
    path('', include(router.urls)),
    path('ingredients-usage/', IngredientUsageReportView.as_view(), name='ingredient-usage-report'),
]