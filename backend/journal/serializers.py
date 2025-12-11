"""
Serializers for journal entries
"""
from rest_framework import serializers
from .models import JournalEntry, EntryTag, EntryTagRelation


class JournalEntrySerializer(serializers.ModelSerializer):
    """Serializer for journal entries with encryption support"""
    tags = serializers.SerializerMethodField()
    emotion_confidence = serializers.FloatField(read_only=True)
    title = serializers.SerializerMethodField()
    text_content = serializers.SerializerMethodField()
    transcription = serializers.SerializerMethodField()
    voice_file_url = serializers.SerializerMethodField()
    video_file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = JournalEntry
        fields = [
            'id',
            'entry_type',
            'title',
            'text_content',
            'transcription',
            'voice_file_url',
            'video_file_url',
            'word_count',
            'duration',
            'emotion',
            'emotion_confidence',
            'tags',
            'is_favorite',
            'is_draft',
            'entry_date',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'word_count', 'created_at', 'updated_at']
    
    def get_tags(self, obj):
        """Get list of tag names for this entry"""
        return [tag_relation.tag.name for tag_relation in obj.entry_tags.all()]
    
    def get_title(self, obj):
        """Get decrypted title"""
        return obj.get_title()
    
    def get_text_content(self, obj):
        """Get decrypted text content"""
        return obj.get_text_content()
    
    def get_transcription(self, obj):
        """Get decrypted transcription"""
        return obj.get_transcription()
    
    def get_voice_file_url(self, obj):
        """Get voice file URL"""
        return obj.voice_file if obj.voice_file else None
    
    def get_video_file_url(self, obj):
        """Get video file URL"""
        return obj.video_file if obj.video_file else None


class JournalEntryCreateSerializer(serializers.Serializer):
    """Serializer for creating a new journal entry"""
    entry_type = serializers.ChoiceField(
        choices=['text', 'voice', 'video'],
        required=True
    )
    title = serializers.CharField(max_length=200, required=False, allow_blank=True)
    text_content = serializers.CharField(required=False, allow_blank=True)
    transcription = serializers.CharField(required=False, allow_blank=True)
    emotion = serializers.CharField(max_length=50, required=False, allow_blank=True)
    emotion_confidence = serializers.FloatField(required=False, min_value=0.0, max_value=1.0)
    tags = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        allow_empty=True
    )
    duration = serializers.IntegerField(required=False, min_value=0, default=0)
    is_favorite = serializers.BooleanField(required=False, default=False)
    is_draft = serializers.BooleanField(required=False, default=False)
    entry_date = serializers.DateTimeField(required=False)
    voice_file = serializers.FileField(required=False, allow_null=True)
    video_file = serializers.FileField(required=False, allow_null=True)
    
    def validate(self, attrs):
        """Validate that content exists based on entry type"""
        entry_type = attrs.get('entry_type')
        
        if entry_type == 'text' and not attrs.get('text_content'):
            raise serializers.ValidationError({
                'text_content': 'Text content is required for text entries.'
            })
        
        return attrs
