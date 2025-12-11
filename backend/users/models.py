from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser
    Sensitive fields (bio, phone_number) are encrypted at the application level
    """
    # Store Cloudinary URL (or any external URL) instead of a local image file path
    profile_picture = models.URLField(max_length=500, null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    bio_encrypted = models.TextField(blank=True, help_text='Encrypted bio')
    phone_number_encrypted = models.TextField(blank=True, help_text='Encrypted phone number')
    
    # Keep plain text versions for backward compatibility (will be deprecated)
    bio = models.TextField(max_length=500, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    
    # Mental health profile
    mental_health_concerns = models.JSONField(default=list, blank=True)
    mood_tracking_goals = models.JSONField(default=list, blank=True)
    
    # Preferences
    preferred_checkin_time = models.CharField(max_length=20, blank=True)
    enable_biometric = models.BooleanField(default=False)
    enable_notifications = models.BooleanField(default=True)
    
    # Stats
    total_entries = models.IntegerField(default=0)
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    
    # Onboarding
    onboarding_complete = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return self.username
    
    def update_stats(self):
        """Update user statistics from journal entries"""
        from journal.models import JournalEntry
        from django.utils import timezone
        from datetime import timedelta
        
        # Update total entries
        self.total_entries = JournalEntry.objects.filter(user=self, is_draft=False).count()
        
        # Calculate current streak
        today = timezone.now().date()
        current_streak = 0
        check_date = today
        
        # Check consecutive days (up to 365 days)
        for _ in range(365):
            has_entry = JournalEntry.objects.filter(
                user=self,
                is_draft=False,
                entry_date__date=check_date
            ).exists()
            
            if has_entry:
                current_streak += 1
            else:
                break
            
            check_date -= timedelta(days=1)
        
        self.current_streak = current_streak
        self.longest_streak = max(self.longest_streak, current_streak)
        self.save()
