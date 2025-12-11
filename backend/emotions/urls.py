"""
URL Configuration for emotions app
"""
from django.urls import path
from . import views

app_name = 'emotions'

urlpatterns = [
    path('quick-moods/', views.quick_mood_logs, name='quick_mood_logs'),
    path('mood-stats/', views.mood_statistics, name='mood_statistics'),
]
