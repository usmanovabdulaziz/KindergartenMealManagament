from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MealServingViewSet, IngredientUsageViewSet

router = DefaultRouter()
router.register(r'meal-servings', MealServingViewSet, basename='mealserving')
router.register(r'ingredient-usages', IngredientUsageViewSet, basename='ingredientusage')

urlpatterns = [
    path('', include(router.urls)),
]