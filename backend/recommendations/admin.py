from django.contrib import admin

from .models import NotificationScheduleState, PushSubscription


@admin.register(NotificationScheduleState)
class NotificationScheduleStateAdmin(admin.ModelAdmin):
    list_display = ('user', 'last_session_reminder_date', 'last_mood_insight_iso_week', 'last_weekly_report_iso_week')


@admin.register(PushSubscription)
class PushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at')
    search_fields = ('user__email', 'endpoint')
