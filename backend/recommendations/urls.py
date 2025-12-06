"""
URL patterns for recommendations and chat endpoints
"""
from django.urls import path
from . import views

urlpatterns = [
    # Chat endpoints
    path('chat/send/', views.send_message, name='chat-send'),
    path('chat/history/', views.get_chat_history, name='chat-history'),
    path('chat/clear/', views.clear_chat_history, name='chat-clear'),
]




