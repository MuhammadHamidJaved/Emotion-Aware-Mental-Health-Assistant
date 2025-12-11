from django.db import models
from django.conf import settings
from journal.models import JournalEntry


class EmotionDetection(models.Model):
    """
    Emotion detection results for journal entries
    """
    MODALITY_CHOICES = (
        ('text', 'Text'),
        ('voice', 'Voice'),
        ('facial', 'Facial Expression'),
        ('fused', 'Multimodal Fusion'),
    )
    
    entry = models.ForeignKey(JournalEntry, on_delete=models.CASCADE, related_name='emotion_detections')
    modality = models.CharField(max_length=10, choices=MODALITY_CHOICES)
    
    # Emotion scores (0-1 probability)
    happy = models.FloatField(default=0.0)
    sad = models.FloatField(default=0.0)
    angry = models.FloatField(default=0.0)
    anxious = models.FloatField(default=0.0)
    neutral = models.FloatField(default=0.0)
    surprised = models.FloatField(default=0.0)
    disgusted = models.FloatField(default=0.0)
    fearful = models.FloatField(default=0.0)
    
    # Dimensional emotion representation
    valence = models.FloatField(default=0.0, help_text='Negative (-1) to Positive (+1)')
    arousal = models.FloatField(default=0.0, help_text='Low (0) to High (1)')
    
    # Confidence
    confidence = models.FloatField(default=0.0)
    
    detected_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'emotion_detections'
        ordering = ['-detected_at']
        verbose_name = 'Emotion Detection'
        verbose_name_plural = 'Emotion Detections'
    
    def __str__(self):
        return f"{self.entry.id} - {self.modality}"
    
    def get_dominant_emotion(self):
        """Get the emotion with highest probability"""
        emotions = {
            'happy': self.happy,
            'sad': self.sad,
            'angry': self.angry,
            'anxious': self.anxious,
            'neutral': self.neutral,
            'surprised': self.surprised,
            'disgusted': self.disgusted,
            'fearful': self.fearful,
        }
        return max(emotions, key=emotions.get)


class QuickMoodLog(models.Model):
    """
    Quick mood check-ins throughout the day (simple mood tracking)
    """
    MOOD_CHOICES = (
        ('happy', 'Happy 😊'),
        ('sad', 'Sad 😢'),
        ('angry', 'Angry 😠'),
        ('anxious', 'Anxious 😰'),
        ('neutral', 'Neutral 😐'),
        ('tired', 'Tired 😴'),
        ('excited', 'Excited 🎉'),
        ('loved', 'Loved 😍'),
    )
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='quick_mood_logs')
    mood = models.CharField(max_length=20, choices=MOOD_CHOICES)
    intensity = models.IntegerField(default=5, help_text='1-10 scale')
    note = models.CharField(max_length=200, blank=True)
    
    checked_in_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'quick_mood_logs'
        ordering = ['-checked_in_at']
        verbose_name = 'Quick Mood Log'
        verbose_name_plural = 'Quick Mood Logs'
    
    def __str__(self):
        return f"{self.user.username} - {self.mood} at {self.checked_in_at.strftime('%Y-%m-%d %H:%M')}"
