"""
Serializers for journal entries
"""
from rest_framework import serializers
from .models import JournalEntry, EntryTag, EntryTagRelation


class JournalEntrySerializer(serializers.ModelSerializer):
    """Serializer for journal entries"""
    tags = serializers.SerializerMethodField()
    emotion_confidence = serializers.FloatField(read_only=True)
    
    class Meta:
        model = JournalEntry
        fields = [
            'id',
            'entry_type',
            'title',
            'text_content',
            'transcription',
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
    
    def validate(self, attrs):
        """Validate that content exists based on entry type"""
        entry_type = attrs.get('entry_type')
        
        if entry_type == 'text' and not attrs.get('text_content'):
            raise serializers.ValidationError({
                'text_content': 'Text content is required for text entries.'
            })
        
        return attrs
