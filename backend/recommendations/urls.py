"""
URL patterns for recommendations and chat endpoints
"""
from django.urls import path
from . import views
from . import notification_views

urlpatterns = [
    # Chat endpoints
    path('chat/send/', views.send_message, name='chat-send'),
    path('chat/history/', views.get_chat_history, name='chat-history'),
    path('chat/clear/', views.clear_chat_history, name='chat-clear'),
    
    # Notification endpoints
    path('notifications/', notification_views.get_notifications, name='notifications-list'),
    path('notifications/unread-count/', notification_views.get_unread_count, name='notifications-unread-count'),
    path('notifications/mark-read/', notification_views.mark_as_read, name='notifications-mark-read'),
    path('notifications/clear/', notification_views.clear_all_notifications, name='notifications-clear'),
    path('notifications/<int:notification_id>/', notification_views.delete_notification, name='notifications-delete'),
    path('notifications/test/', notification_views.test_notification, name='notifications-test'),
]




