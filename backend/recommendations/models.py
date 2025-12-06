from django.db import models
from django.conf import settings


class Recommendation(models.Model):
    """
    Wellness recommendations (exercises, music, articles, videos)
    """
    CATEGORY_CHOICES = (
        ('exercise', 'Exercise'),
        ('music', 'Music'),
        ('article', 'Article'),
        ('video', 'Video'),
        ('meditation', 'Meditation'),
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    
    # Content
    content_url = models.URLField(blank=True)
    thumbnail_url = models.URLField(blank=True)
    duration = models.IntegerField(default=0, help_text='Duration in minutes')
    
    # Targeting
    target_emotions = models.JSONField(default=list, help_text='List of emotions this helps with')
    difficulty = models.CharField(max_length=20, default='beginner')
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'recommendations'
        ordering = ['-created_at']
        verbose_name = 'Recommendation'
        verbose_name_plural = 'Recommendations'
    
    def __str__(self):
        return f"{self.category} - {self.title}"


class UserRecommendation(models.Model):
    """
    Personalized recommendations for users
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='user_recommendations')
    recommendation = models.ForeignKey(Recommendation, on_delete=models.CASCADE)
    
    # Engagement
    is_completed = models.BooleanField(default=False)
    times_completed = models.IntegerField(default=0)
    rating = models.IntegerField(null=True, blank=True, help_text='1-5 star rating')
    is_bookmarked = models.BooleanField(default=False)
    
    # Timestamps
    recommended_at = models.DateTimeField(auto_now_add=True)
    last_accessed = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'user_recommendations'
        unique_together = ['user', 'recommendation']
        ordering = ['-recommended_at']
        verbose_name = 'User Recommendation'
        verbose_name_plural = 'User Recommendations'
    
    def __str__(self):
        return f"{self.user.username} - {self.recommendation.title}"


class AIChatMessage(models.Model):
    """
    AI companion chat messages
    """
    SENDER_CHOICES = (
        ('user', 'User'),
        ('ai', 'AI'),
    )
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chat_messages')
    sender = models.CharField(max_length=10, choices=SENDER_CHOICES)
    message = models.TextField()
    
    # Context
    entry_reference = models.ForeignKey('journal.JournalEntry', on_delete=models.SET_NULL, null=True, blank=True)
    emotion_context = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'ai_chat_messages'
        ordering = ['created_at']
        verbose_name = 'AI Chat Message'
        verbose_name_plural = 'AI Chat Messages'
    
    def __str__(self):
        return f"{self.sender} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
