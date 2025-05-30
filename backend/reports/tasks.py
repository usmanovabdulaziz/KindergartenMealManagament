from celery import shared_task
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.utils import timezone
from reports.views import MonthlyReportViewSet

@shared_task
def generate_monthly_reports():
    year = timezone.now().year
    month = timezone.now().month
    # Mimic a request object for the report generator, or adjust if your viewset expects different data
    request = type('Request', (), {'data': {'year': year, 'month': month}})
    MonthlyReportViewSet().generate_report(request)
    # Notify dashboard group via WebSocket
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "dashboard",
        {"type": "dashboard_update"}
    )