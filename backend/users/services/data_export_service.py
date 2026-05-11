"""Build a portable JSON export of a user's data (GDPR-style)."""

from __future__ import annotations

from typing import Any, Dict, List

from django.contrib.auth import get_user_model

User = get_user_model()


def build_user_data_export(user) -> Dict[str, Any]:
    from assistant.models import CheckInEntry
    from emotions.models import QuickMoodLog
    from recommendations.models import AIChatMessage, Notification

    from users.services.settings_service import SettingsService

    profile: Dict[str, Any] = {
        'id': user.id,
        'email': user.email,
        'username': user.username,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'bio': user.bio or '',
        'phone_number': user.phone_number or '',
        'profile_picture': user.profile_picture or None,
        'date_of_birth': user.date_of_birth.isoformat() if user.date_of_birth else None,
        'onboarding_complete': user.onboarding_complete,
        'total_entries': user.total_entries,
        'current_streak': user.current_streak,
        'longest_streak': user.longest_streak,
        'created_at': user.created_at.isoformat() if user.created_at else None,
    }

    settings_summary = {
        'notifications': SettingsService.get_notification_settings(user),
        'privacy': SettingsService.get_privacy_settings(user),
        'appearance': SettingsService.get_appearance_settings(user),
        'recommendations': SettingsService.get_recommendation_settings(user),
    }

    entries_out: List[Dict[str, Any]] = []
    for entry in CheckInEntry.objects.filter(user=user).prefetch_related(
        'entry_tags__tag',
        'emotion_detections',
    ).order_by('-entry_date'):
        tags = [rel.tag.name for rel in entry.entry_tags.all()]
        detections = []
        for det in entry.emotion_detections.all():
            detections.append(
                {
                    'modality': det.modality,
                    'dominant': det.get_dominant_emotion(),
                    'confidence': det.confidence,
                    'valence': det.valence,
                    'arousal': det.arousal,
                    'detected_at': det.detected_at.isoformat() if det.detected_at else None,
                }
            )
        entries_out.append(
            {
                'id': entry.id,
                'entry_type': entry.entry_type,
                'title': entry.get_title(),
                'text_content': entry.get_text_content(),
                'transcription': entry.get_transcription(),
                'voice_file': entry.voice_file or None,
                'video_file': entry.video_file or None,
                'word_count': entry.word_count,
                'duration': entry.duration,
                'emotion': entry.emotion,
                'emotion_confidence': entry.emotion_confidence,
                'entry_date': entry.entry_date.isoformat() if entry.entry_date else None,
                'is_draft': entry.is_draft,
                'tags': tags,
                'emotion_detections': detections,
            }
        )

    quick_moods = [
        {
            'mood': log.mood,
            'intensity': log.intensity,
            'note': log.note or '',
            'checked_in_at': log.checked_in_at.isoformat() if log.checked_in_at else None,
        }
        for log in QuickMoodLog.objects.filter(user=user).order_by('-checked_in_at')
    ]

    chat_messages = []
    for msg in AIChatMessage.objects.filter(user=user).order_by('created_at'):
        chat_messages.append(
            {
                'id': msg.id,
                'sender': msg.sender,
                'message': msg.get_message(),
                'entry_reference_id': msg.entry_reference_id,
                'created_at': msg.created_at.isoformat() if msg.created_at else None,
            }
        )

    notifications_out = []
    for n in Notification.objects.filter(user=user).order_by('-created_at'):
        notifications_out.append(
            {
                'id': n.id,
                'type': n.type,
                'title': n.get_title(),
                'message': n.get_message(),
                'action_url': n.action_url,
                'is_read': n.is_read,
                'created_at': n.created_at.isoformat() if n.created_at else None,
            }
        )

    return {
        'export_version': 1,
        'user': profile,
        'settings': settings_summary,
        'check_ins': entries_out,
        'quick_mood_logs': quick_moods,
        'chat_messages': chat_messages,
        'notifications': notifications_out,
    }
