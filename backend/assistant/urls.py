"""
URL patterns for assistant and dashboard endpoints
"""
from django.urls import path
from . import dashboard_views
from . import insights_views
from . import calendar_views
from . import views

urlpatterns = [
    # Check-in entry endpoints
    path('assistant/entries/', views.entries_list_or_create, name='assistant-entries-list-create'),
    path('assistant/entries/<int:entry_id>/', views.entry_detail_update_delete, name='assistant-entry-detail-update-delete'),
    path('assistant/emotion/detect/', views.detect_emotion_from_image, name='assistant-emotion-detect'),
    path('assistant/emotion/detect/7class/', views.detect_emotion_from_image_7class, name='assistant-emotion-detect-7class'),
    path('assistant/emotion/detect/text/', views.detect_emotion_from_text, name='assistant-emotion-detect-text'),
    
    # Dashboard endpoints
    path('dashboard/stats/', dashboard_views.dashboard_stats, name='dashboard-stats'),
    path('dashboard/mood-trend/', dashboard_views.mood_trend, name='dashboard-mood-trend'),
    path('dashboard/emotion-distribution/', dashboard_views.emotion_distribution, name='dashboard-emotion-distribution'),
    path('dashboard/recent-entries/', dashboard_views.recent_entries, name='dashboard-recent-entries'),
    
    # Insights endpoints
    path('insights/overview/', insights_views.insights_overview, name='insights-overview'),
    path('insights/mood-timeline/', insights_views.insights_mood_timeline, name='insights-mood-timeline'),
    
    # Calendar endpoints
    path('calendar/month/', calendar_views.calendar_month, name='calendar-month'),
    path('calendar/day/', calendar_views.calendar_day_details, name='calendar-day'),
    path('calendar/month-summary/', calendar_views.calendar_month_summary, name='calendar-month-summary'),
]
