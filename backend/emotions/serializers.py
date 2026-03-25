"""Serializers for emotions API validation."""

from rest_framework import serializers

from .models import QuickMoodLog


class DaysQuerySerializer(serializers.Serializer):
    days = serializers.IntegerField(required=False, min_value=1, max_value=365, default=30)


class QuickMoodLogCreateSerializer(serializers.Serializer):
    mood = serializers.ChoiceField(choices=[choice[0] for choice in QuickMoodLog.MOOD_CHOICES], required=True)
    intensity = serializers.IntegerField(required=False, min_value=1, max_value=10, default=5)
    note = serializers.CharField(required=False, allow_blank=True, max_length=200, default='')
