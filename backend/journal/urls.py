"""
URL patterns for journal and dashboard endpoints
"""
from django.urls import path
from . import dashboard_views
from . import insights_views
from . import calendar_views
from . import views

urlpatterns = [
    # Journal entry endpoints
    path('journal/entries/', views.entries_list_or_create, name='journal-entries-list-create'),
    path('journal/entries/<int:entry_id>/', views.entry_detail_update_delete, name='journal-entry-detail-update-delete'),
    path('journal/emotion/detect/', views.detect_emotion_from_image, name='journal-emotion-detect'),
    path('journal/emotion/detect/7class/', views.detect_emotion_from_image_7class, name='journal-emotion-detect-7class'),
    path('journal/emotion/detect/text/', views.detect_emotion_from_text, name='journal-emotion-detect-text'),
    
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

