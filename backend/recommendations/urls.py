"""
URL patterns for recommendations and chat endpoints
"""
from django.urls import path
from . import views
from . import notification_views
from . import recommendation_views

urlpatterns = [
    # Chat endpoints
    path('chat/send/', views.send_message, name='chat-send'),
    path('chat/history/', views.get_chat_history, name='chat-history'),
    path('chat/clear/', views.clear_chat_history, name='chat-clear'),
    
    # Personalized recommendation endpoints
    path('recommendations/get/', recommendation_views.get_recommendations, name='recommendations-get'),
    path('recommendations/feedback/', recommendation_views.send_feedback, name='recommendations-feedback'),
    path('recommendations/history/', recommendation_views.get_recommendation_history, name='recommendations-history'),
    path('recommendations/patterns/', recommendation_views.get_recommendation_patterns, name='recommendations-patterns'),
    
    # Notification endpoints
    path('notifications/', notification_views.get_notifications, name='notifications-list'),
    path('notifications/unread-count/', notification_views.get_unread_count, name='notifications-unread-count'),
    path('notifications/mark-read/', notification_views.mark_as_read, name='notifications-mark-read'),
    path('notifications/clear/', notification_views.clear_all_notifications, name='notifications-clear'),
    path('notifications/<int:notification_id>/', notification_views.delete_notification, name='notifications-delete'),
    path('notifications/test/', notification_views.test_notification, name='notifications-test'),
    path('notifications/push/vapid-key/', notification_views.push_vapid_public_key, name='notifications-push-vapid'),
    path('notifications/push/subscribe/', notification_views.push_subscribe, name='notifications-push-subscribe'),
    path('notifications/push/unsubscribe/', notification_views.push_unsubscribe, name='notifications-push-unsubscribe'),
]




