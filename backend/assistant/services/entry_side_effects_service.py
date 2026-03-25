"""Post-create side effects for assistant entries."""

import logging
from datetime import timedelta

from django.utils import timezone

from assistant.models import CheckInEntry

logger = logging.getLogger(__name__)


EMOTION_TO_VALENCE_AROUSAL = {
    'happy': (0.8, 0.7),
    'sad': (-0.6, 0.3),
    'angry': (-0.4, 0.9),
    'anxious': (-0.5, 0.8),
    'calm': (0.2, 0.2),
    'excited': (0.7, 0.9),
    'neutral': (0.0, 0.3),
    'surprised': (0.3, 0.9),
    'surprise': (0.3, 0.9),
    'fearful': (-0.7, 0.9),
    'disgusted': (-0.5, 0.6),
    'contempt': (-0.3, 0.4),
    'frustrated': (-0.4, 0.8),
    'grateful': (0.7, 0.5),
    'loved': (0.9, 0.6),
    'confident': (0.6, 0.7),
    'tired': (-0.2, 0.2),
    'lonely': (-0.5, 0.3),
    'scared': (-0.6, 0.9),
    'disappointed': (-0.4, 0.4),
    'energetic': (0.6, 0.9),
    'peaceful': (0.3, 0.2),
}


class EntrySideEffectsService:
    @staticmethod
    def handle_post_create_side_effects(entry, user, emotion_detection_model=None, notification_service=None):
        EntrySideEffectsService.create_emotion_detection_record(entry, emotion_detection_model)
        EntrySideEffectsService.create_notifications_and_update_stats(entry, user, notification_service)

    @staticmethod
    def create_emotion_detection_record(entry, emotion_detection_model=None):
        if not entry.emotion or not emotion_detection_model:
            return

        try:
            modality_map = {
                'text': 'text',
                'voice': 'voice',
                'video': 'facial',
            }
            modality = modality_map.get(entry.entry_type, 'text')

            confidence = entry.emotion_confidence if entry.emotion_confidence is not None else 0.5

            emotion_scores = {
                'happy': 0.0,
                'sad': 0.0,
                'angry': 0.0,
                'anxious': 0.0,
                'neutral': 0.0,
                'surprised': 0.0,
                'disgusted': 0.0,
                'fearful': 0.0,
            }

            emotion_lower = entry.emotion.lower()
            if emotion_lower in emotion_scores:
                emotion_scores[emotion_lower] = confidence
            elif emotion_lower == 'surprise':
                emotion_scores['surprised'] = confidence
            else:
                emotion_scores['neutral'] = confidence

            base_valence, base_arousal = EMOTION_TO_VALENCE_AROUSAL.get(
                emotion_lower,
                (0.0, 0.5)
            )
            valence = base_valence * confidence
            arousal = base_arousal * confidence

            emotion_detection_model.objects.create(
                entry=entry,
                modality=modality,
                happy=emotion_scores['happy'],
                sad=emotion_scores['sad'],
                angry=emotion_scores['angry'],
                anxious=emotion_scores['anxious'],
                neutral=emotion_scores['neutral'],
                surprised=emotion_scores['surprised'],
                disgusted=emotion_scores['disgusted'],
                fearful=emotion_scores['fearful'],
                confidence=confidence,
                valence=valence,
                arousal=arousal
            )
            logger.info(f"Created EmotionDetection record for entry {entry.id} with emotion {entry.emotion}")

        except Exception as exc:
            logger.error(f"Error creating EmotionDetection record: {exc}")

    @staticmethod
    def create_notifications_and_update_stats(entry, user, notification_service=None):
        if not notification_service:
            return

        try:
            streak = EntrySideEffectsService._calculate_current_streak(user)

            user.total_entries = CheckInEntry.objects.filter(
                user=user,
                is_draft=False
            ).count()
            user.current_streak = streak
            if streak > user.longest_streak:
                user.longest_streak = streak
            user.save()

            if notification_service.should_send_notification(user, 'streak_alert'):
                milestone_streaks = [3, 7, 14, 30, 50, 100]
                if streak in milestone_streaks:
                    notification_service.create_streak_alert(user, streak)

            if notification_service.should_send_notification(user, 'system'):
                notification_service.create_notification(
                    user=user,
                    notification_type='system',
                    title='Entry saved successfully',
                    message=f'Your {entry.entry_type} entry has been saved.',
                    action_url=f'/check-in/{entry.id}',
                    related_object_id=entry.id
                )

        except Exception as exc:
            logger.error(f"Error creating notifications after entry save: {exc}")

    @staticmethod
    def _calculate_current_streak(user):
        streak = 0
        current_date = timezone.now().date()
        check_date = current_date

        while True:
            entries_today = CheckInEntry.objects.filter(
                user=user,
                is_draft=False,
                entry_date__date=check_date
            ).exists()

            if entries_today:
                streak += 1
                check_date -= timedelta(days=1)
            else:
                break

        return streak
