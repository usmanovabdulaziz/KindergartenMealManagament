from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MonthlyReportViewSet

router = DefaultRouter()
router.register(r'monthly-reports', MonthlyReportViewSet, basename='monthlyreport')

urlpatterns = [
    path('', include(router.urls)),
]