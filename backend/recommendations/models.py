"""
Models for recommendations and notifications
"""
from django.db import models
from django.conf import settings


class Recommendation(models.Model):
    """
    AI-generated recommendations for users
    """
    CATEGORY_CHOICES = [
        ('exercise', 'Exercise'),
        ('meditation', 'Meditation'),
        ('social', 'Social Activity'),
        ('creative', 'Creative Activity'),
        ('rest', 'Rest & Relaxation'),
        ('therapy', 'Professional Support'),
        ('journaling', 'Journaling'),
        ('other', 'Other'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='other')
    icon = models.CharField(max_length=50, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'recommendations'
        verbose_name = 'Recommendation'
        verbose_name_plural = 'Recommendations'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title


class UserRecommendation(models.Model):
    """
    Recommendations assigned to specific users based on their emotional state
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='user_recommendations')
    recommendation = models.ForeignKey(Recommendation, on_delete=models.CASCADE)
    
    # Context
    triggered_by = models.CharField(max_length=100, blank=True, help_text='What triggered this recommendation')
    priority = models.IntegerField(default=0, help_text='Higher number = higher priority')
    
    # Status
    is_completed = models.BooleanField(default=False)
    is_dismissed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_recommendations'
        verbose_name = 'User Recommendation'
        verbose_name_plural = 'User Recommendations'
        ordering = ['-priority', '-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.recommendation.title}"


class AIChatMessage(models.Model):
    """
    Chat messages between user and AI companion
    """
    SENDER_CHOICES = [
        ('user', 'User'),
        ('ai', 'AI'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chat_messages')
    sender = models.CharField(max_length=10, choices=SENDER_CHOICES)
    message = models.TextField()
    
    # Optional: link to journal entry for context
    entry_reference_id = models.IntegerField(null=True, blank=True)
    
    # Optional: emotion context for the message
    emotion_context = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'ai_chat_messages'
        verbose_name = 'AI Chat Message'
        verbose_name_plural = 'AI Chat Messages'
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.sender}: {self.message[:50]}..."


class Notification(models.Model):
    """
    User notifications for various events
    """
    TYPE_CHOICES = [
        ('session_reminder', 'Session Reminder'),
        ('mood_insight', 'Mood Insight'),
        ('weekly_report', 'Weekly Report'),
        ('streak_alert', 'Streak Alert'),
        ('ai_suggestion', 'AI Suggestion'),
        ('recommendation', 'Recommendation'),
        ('system', 'System Notification'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    
    # Optional: link to related object
    action_url = models.CharField(max_length=500, blank=True, help_text='URL to navigate when clicked')
    related_object_id = models.IntegerField(null=True, blank=True, help_text='ID of related object (entry, recommendation, etc.)')
    
    # Status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True, help_text='Additional data for the notification')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notifications'
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'is_read']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"
    
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            from django.utils import timezone
            self.is_read = True
            self.read_at = timezone.now()
            self.save()
