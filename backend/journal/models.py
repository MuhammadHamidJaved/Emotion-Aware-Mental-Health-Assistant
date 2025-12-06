from django.db import models
from django.conf import settings


class JournalEntry(models.Model):
    """
    Journal entry model supporting text, voice, and video entries
    """
    ENTRY_TYPES = (
        ('text', 'Text'),
        ('voice', 'Voice'),
        ('video', 'Video'),
    )
    
    PRIVACY_CHOICES = (
        ('private', 'Private'),
        ('therapist', 'Shared with Therapist'),
    )
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='journal_entries')
    entry_type = models.CharField(max_length=10, choices=ENTRY_TYPES, default='text')
    
    # Content
    title = models.CharField(max_length=200, blank=True)
    text_content = models.TextField(blank=True)
    voice_file = models.FileField(upload_to='voice_entries/', null=True, blank=True)
    video_file = models.FileField(upload_to='video_entries/', null=True, blank=True)
    transcription = models.TextField(blank=True)
    
    # Metadata
    word_count = models.IntegerField(default=0)
    duration = models.IntegerField(default=0, help_text='Duration in seconds for voice/video')
    privacy_setting = models.CharField(max_length=20, choices=PRIVACY_CHOICES, default='private')
    
    # Location
    location_name = models.CharField(max_length=200, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Timestamps
    entry_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Status
    is_favorite = models.BooleanField(default=False)
    is_draft = models.BooleanField(default=False)
    
    # Emotion (manual selection for now, ML prediction later)
    emotion = models.CharField(max_length=50, blank=True, help_text='User-selected emotion')
    emotion_confidence = models.FloatField(null=True, blank=True, help_text='ML confidence score (0-1)')
    
    class Meta:
        db_table = 'journal_entries'
        ordering = ['-entry_date']
        verbose_name = 'Journal Entry'
        verbose_name_plural = 'Journal Entries'
    
    def __str__(self):
        return f"{self.user.username} - {self.entry_date.strftime('%Y-%m-%d %H:%M')}"


class EntryMedia(models.Model):
    """
    Media attachments for journal entries (photos)
    """
    entry = models.ForeignKey(JournalEntry, on_delete=models.CASCADE, related_name='media_files')
    media_file = models.ImageField(upload_to='entry_media/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'entry_media'
        verbose_name = 'Entry Media'
        verbose_name_plural = 'Entry Media'
    
    def __str__(self):
        return f"Media for {self.entry.id}"


class EntryTag(models.Model):
    """
    Tags for categorizing journal entries
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tags')
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#3B82F6')  # Hex color
    usage_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'entry_tags'
        unique_together = ['user', 'name']
        ordering = ['-usage_count', 'name']
        verbose_name = 'Entry Tag'
        verbose_name_plural = 'Entry Tags'
    
    def __str__(self):
        return f"#{self.name}"


class EntryTagRelation(models.Model):
    """
    Many-to-many relationship between entries and tags
    """
    entry = models.ForeignKey(JournalEntry, on_delete=models.CASCADE, related_name='entry_tags')
    tag = models.ForeignKey(EntryTag, on_delete=models.CASCADE, related_name='tagged_entries')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'entry_tag_relations'
        unique_together = ['entry', 'tag']
        verbose_name = 'Entry Tag Relation'
        verbose_name_plural = 'Entry Tag Relations'
    
    def __str__(self):
        return f"{self.entry.id} - {self.tag.name}"
