from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AllergenViewSet, ProductAllergenViewSet

router = DefaultRouter()
router.register(r'allergens', AllergenViewSet, basename='allergen')
router.register(r'product-allergens', ProductAllergenViewSet, basename='productallergen')

urlpatterns = [
    path('', include(router.urls)),
]