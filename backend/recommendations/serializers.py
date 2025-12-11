"""
Serializers for chat messages and notifications
"""
from rest_framework import serializers
from .models import AIChatMessage, Notification, Recommendation, UserRecommendation


class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for AI chat messages with encryption support"""
    
    entry_reference = serializers.IntegerField(source='entry_reference_id', read_only=True, allow_null=True)
    message = serializers.SerializerMethodField()
    emotion_context = serializers.SerializerMethodField()
    
    class Meta:
        model = AIChatMessage
        fields = ['id', 'sender', 'message', 'entry_reference', 'emotion_context', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_message(self, obj):
        """Get decrypted message"""
        return obj.get_message()
    
    def get_emotion_context(self, obj):
        """Get decrypted emotion context"""
        return obj.get_emotion_context()


class ChatMessageCreateSerializer(serializers.Serializer):
    """Serializer for creating a new chat message"""
    message = serializers.CharField(required=True, max_length=2000)
    entry_reference = serializers.IntegerField(required=False, allow_null=True)
    emotion_context = serializers.JSONField(required=False, default=dict)


class ChatResponseSerializer(serializers.Serializer):
    """Serializer for chat API response"""
    message = serializers.CharField()
    sources = serializers.ListField(required=False, default=list)
    error = serializers.CharField(required=False, allow_null=True)


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model with encryption support"""
    
    title = serializers.SerializerMethodField()
    message = serializers.SerializerMethodField()
    metadata = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id',
            'type',
            'title',
            'message',
            'action_url',
            'related_object_id',
            'is_read',
            'read_at',
            'metadata',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'read_at']
    
    def get_title(self, obj):
        """Get decrypted title"""
        return obj.get_title()
    
    def get_message(self, obj):
        """Get decrypted message"""
        return obj.get_message()
    
    def get_metadata(self, obj):
        """Get decrypted metadata"""
        return obj.get_metadata()


class RecommendationSerializer(serializers.ModelSerializer):
    """Serializer for Recommendation model with encryption support"""
    
    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    
    class Meta:
        model = Recommendation
        fields = ['id', 'title', 'description', 'category', 'icon', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_title(self, obj):
        """Get decrypted title"""
        return obj.get_title()
    
    def get_description(self, obj):
        """Get decrypted description"""
        return obj.get_description()


class UserRecommendationSerializer(serializers.ModelSerializer):
    """Serializer for UserRecommendation model with nested recommendation"""
    recommendation = RecommendationSerializer(read_only=True)
    
    class Meta:
        model = UserRecommendation
        fields = [
            'id',
            'recommendation',
            'triggered_by',
            'priority',
            'is_completed',
            'is_dismissed',
            'completed_at',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'completed_at']


