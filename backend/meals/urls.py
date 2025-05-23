from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MealCategoryViewSet, MealViewSet, MealIngredientViewSet, MealServingViewSet

router = DefaultRouter()
router.register(r'meal-categories', MealCategoryViewSet, basename='mealcategory')
router.register(r'meals', MealViewSet, basename='meal')
router.register(r'meal-ingredients', MealIngredientViewSet, basename='mealingredient')
router.register(r'meal-servings', MealServingViewSet, basename='mealserving')

urlpatterns = [
    path('', include(router.urls)),
]