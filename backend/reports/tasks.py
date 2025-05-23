from celery import shared_task
from django.utils import timezone
from meals.models import Meal
from reports.views import MonthlyReportViewSet

@shared_task
def generate_monthly_reports():
    year = timezone.now().year
    month = timezone.now().month
    request = type('Request', (), {'data': {'year': year, 'month': month}})
    MonthlyReportViewSet().generate_report(request)