"""
Models for recommendations and notifications
"""
from django.db import models
from django.conf import settings


class Recommendation(models.Model):
    """
    AI-generated recommendations for users with encryption
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
    
    # Encrypted fields
    title_encrypted = models.TextField(blank=True, help_text='Encrypted title')
    description_encrypted = models.TextField(blank=True, help_text='Encrypted description')
    
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
        return self.get_title()
    
    def set_title(self, plaintext_title: str):
        """Set encrypted title"""
        if plaintext_title:
            from users.encryption import get_encryption_service
            encryption_service = get_encryption_service()
            self.title_encrypted = encryption_service.encrypt(plaintext_title)
        else:
            self.title_encrypted = ""
    
    def get_title(self) -> str:
        """Get decrypted title"""
        if self.title_encrypted:
            from users.encryption import get_encryption_service
            encryption_service = get_encryption_service()
            return encryption_service.decrypt(self.title_encrypted)
        return ""  # Return empty string if no encrypted title
    
    def set_description(self, plaintext_description: str):
        """Set encrypted description"""
        if plaintext_description:
            from users.encryption import get_encryption_service
            encryption_service = get_encryption_service()
            self.description_encrypted = encryption_service.encrypt(plaintext_description)
        else:
            self.description_encrypted = ""
    
    def get_description(self) -> str:
        """Get decrypted description"""
        if self.description_encrypted:
            from users.encryption import get_encryption_service
            encryption_service = get_encryption_service()
            return encryption_service.decrypt(self.description_encrypted)
        return ""  # Return empty string if no encrypted description


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
    Chat messages between user and AI companion with encryption
    """
    SENDER_CHOICES = [
        ('user', 'User'),
        ('ai', 'AI'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chat_messages')
    sender = models.CharField(max_length=10, choices=SENDER_CHOICES)
    
    # Encrypted message content
    message_encrypted = models.TextField(blank=True, help_text='Encrypted message')
    
    # Optional: link to journal entry for context
    entry_reference_id = models.IntegerField(null=True, blank=True)
    
    # Optional: emotion context for the message (store as encrypted JSON)
    emotion_context_encrypted = models.TextField(blank=True, help_text='Encrypted emotion context')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'ai_chat_messages'
        verbose_name = 'AI Chat Message'
        verbose_name_plural = 'AI Chat Messages'
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.sender}: {self.get_message()[:50]}..."
    
    def set_message(self, plaintext_message: str):
        """Set encrypted message"""
        if plaintext_message:
            from users.encryption import get_encryption_service
            encryption_service = get_encryption_service()
            self.message_encrypted = encryption_service.encrypt(plaintext_message)
        else:
            self.message_encrypted = ""
    
    def get_message(self) -> str:
        """Get decrypted message"""
        if self.message_encrypted:
            from users.encryption import get_encryption_service
            encryption_service = get_encryption_service()
            return encryption_service.decrypt(self.message_encrypted)
        return ""  # Return empty string if no encrypted message
    
    def set_emotion_context(self, context_dict: dict):
        """Set encrypted emotion context"""
        if context_dict:
            from users.encryption import get_encryption_service
            encryption_service = get_encryption_service()
            self.emotion_context_encrypted = encryption_service.encrypt_json(context_dict)
        else:
            self.emotion_context_encrypted = ""
    
    def get_emotion_context(self) -> dict:
        """Get decrypted emotion context"""
        if self.emotion_context_encrypted:
            from users.encryption import get_encryption_service
            encryption_service = get_encryption_service()
            return encryption_service.decrypt_json(self.emotion_context_encrypted)
        return {}  # Return empty dict if no encrypted context


class Notification(models.Model):
    """
    User notifications for various events with encryption
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
    
    # Encrypted fields
    title_encrypted = models.TextField(blank=True, help_text='Encrypted title')
    message_encrypted = models.TextField(blank=True, help_text='Encrypted message')
    metadata_encrypted = models.TextField(blank=True, help_text='Encrypted metadata')
    
    # Plain text versions (deprecated, keep for backward compatibility)
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
        return f"{self.user.username} - {self.get_title()}"
    
    def set_title(self, plaintext_title: str):
        """Set encrypted title"""
        if plaintext_title:
            from users.encryption import get_encryption_service
            encryption_service = get_encryption_service()
            self.title_encrypted = encryption_service.encrypt(plaintext_title)
        else:
            self.title_encrypted = ""
    
    def get_title(self) -> str:
        """Get decrypted title"""
        if self.title_encrypted:
            from users.encryption import get_encryption_service
            encryption_service = get_encryption_service()
            return encryption_service.decrypt(self.title_encrypted)
        return ""  # Return empty string if no encrypted title
    
    def set_message(self, plaintext_message: str):
        """Set encrypted message"""
        if plaintext_message:
            from users.encryption import get_encryption_service
            encryption_service = get_encryption_service()
            self.message_encrypted = encryption_service.encrypt(plaintext_message)
        else:
            self.message_encrypted = ""
    
    def get_message(self) -> str:
        """Get decrypted message"""
        if self.message_encrypted:
            from users.encryption import get_encryption_service
            encryption_service = get_encryption_service()
            return encryption_service.decrypt(self.message_encrypted)
        return ""  # Return empty string if no encrypted message
    
    def set_metadata(self, metadata_dict: dict):
        """Set encrypted metadata"""
        if metadata_dict:
            from users.encryption import get_encryption_service
            encryption_service = get_encryption_service()
            self.metadata_encrypted = encryption_service.encrypt_json(metadata_dict)
        else:
            self.metadata_encrypted = ""
    
    def get_metadata(self) -> dict:
        """Get decrypted metadata"""
        if self.metadata_encrypted:
            from users.encryption import get_encryption_service
            encryption_service = get_encryption_service()
            return encryption_service.decrypt_json(self.metadata_encrypted)
        return {}  # Return empty dict if no encrypted metadata
    
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            from django.utils import timezone
            self.is_read = True
            self.read_at = timezone.now()
            self.save()
