from django.contrib import admin
from .models import MonthlyReport

@admin.register(MonthlyReport)
class MonthlyReportAdmin(admin.ModelAdmin):
    list_display = ('id', 'meal', 'month_year', 'portions_served', 'portions_possible', 'discrepancy_rate', 'generated_at', 'generated_by')
    list_filter = ('meal', 'month_year', 'generated_by')
    search_fields = ('meal__name', 'month_year')
    readonly_fields = ('generated_at',)