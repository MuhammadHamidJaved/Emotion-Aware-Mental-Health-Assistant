"""
Serializers for chat messages and notifications
"""
from rest_framework import serializers
from .models import AIChatMessage, Notification, Recommendation, UserRecommendation


class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for AI chat messages"""
    
    entry_reference = serializers.IntegerField(source='entry_reference_id', read_only=True, allow_null=True)
    
    class Meta:
        model = AIChatMessage
        fields = ['id', 'sender', 'message', 'entry_reference', 'emotion_context', 'created_at']
        read_only_fields = ['id', 'created_at']


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
    """Serializer for Notification model"""
    
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


class RecommendationSerializer(serializers.ModelSerializer):
    """Serializer for Recommendation model"""
    
    class Meta:
        model = Recommendation
        fields = ['id', 'title', 'description', 'category', 'icon', 'created_at']
        read_only_fields = ['id', 'created_at']


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


