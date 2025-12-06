"""
Serializers for chat messages
"""
from rest_framework import serializers
from .models import AIChatMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for AI chat messages"""
    
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


