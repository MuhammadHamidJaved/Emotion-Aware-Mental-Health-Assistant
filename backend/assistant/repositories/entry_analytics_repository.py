"""Data access helpers for assistant analytics queries."""

from django.db.models import Count
from django.db.models.functions import Lower

from assistant.models import CheckInEntry


class EntryAnalyticsRepository:
    @staticmethod
    def get_total_entries(user):
        return CheckInEntry.objects.filter(user=user, is_draft=False).count()

    @staticmethod
    def get_entry_dates_since(user, start_date):
        return set(
            CheckInEntry.objects.filter(
                user=user,
                is_draft=False,
                entry_date__gte=start_date,
            ).values_list('entry_date__date', flat=True).distinct()
        )

    @staticmethod
    def get_dominant_emotion_since(user, start_date, default='neutral'):
        emotion_counts = (
            CheckInEntry.objects.filter(
                user=user,
                is_draft=False,
                entry_date__gte=start_date,
                emotion__isnull=False,
            )
            .exclude(emotion='')
            .values('emotion')
            .annotate(count=Count('emotion'))
            .order_by('-count')[:1]
        )

        if emotion_counts:
            return emotion_counts[0]['emotion']
        return default

    @staticmethod
    def get_entries_with_emotion_count(user):
        return (
            CheckInEntry.objects.filter(
                user=user,
                is_draft=False,
                emotion__isnull=False,
            )
            .exclude(emotion='')
            .count()
        )

    @staticmethod
    def get_ml_predictions_count(user, emotion_detection_model=None):
        if emotion_detection_model:
            try:
                return emotion_detection_model.objects.filter(entry__user=user).count()
            except Exception:
                return EntryAnalyticsRepository.get_entries_with_emotion_count(user)
        return EntryAnalyticsRepository.get_entries_with_emotion_count(user)

    @staticmethod
    def get_emotion_distribution(user, start_date):
        """Return normalized emotion counts for the given user and date range."""
        emotion_counts = (
            CheckInEntry.objects.filter(
                user=user,
                is_draft=False,
                entry_date__gte=start_date,
                emotion__isnull=False,
            )
            .exclude(emotion='')
            .annotate(emotion_lower=Lower('emotion'))
            .values('emotion_lower')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        return [
            {
                'emotion': item['emotion_lower'].strip() if item['emotion_lower'] else '',
                'count': item['count'],
            }
            for item in emotion_counts
            if item['emotion_lower'] and item['emotion_lower'].strip()
        ]

    @staticmethod
    def get_mood_trend_source_data(user, start_date, emotion_detection_model):
        """Fetch and group entries/detections by date for mood trend calculations."""
        entries = CheckInEntry.objects.filter(
            user=user,
            is_draft=False,
            entry_date__gte=start_date,
        )

        detections = emotion_detection_model.objects.filter(
            entry__user=user,
            detected_at__gte=start_date,
        )

        detections_list = list(detections.select_related('entry'))
        entries_list = list(entries.exclude(emotion='').exclude(emotion__isnull=True))

        detections_by_date = {}
        for detection in detections_list:
            date1 = detection.detected_at.date() if detection.detected_at else None
            date2 = detection.entry.entry_date.date() if detection.entry and detection.entry.entry_date else None

            for date in [date1, date2]:
                if date:
                    if date not in detections_by_date:
                        detections_by_date[date] = []
                    detections_by_date[date].append(detection)

        entries_by_date = {}
        for entry in entries_list:
            date = entry.entry_date.date() if entry.entry_date else None
            if date:
                if date not in entries_by_date:
                    entries_by_date[date] = []
                entries_by_date[date].append(entry)

        return detections_by_date, entries_by_date

    @staticmethod
    def get_entries_in_period(user, start_date, end_date):
        return CheckInEntry.objects.filter(
            user=user,
            is_draft=False,
            entry_date__gte=start_date,
            entry_date__lte=end_date,
        )

    @staticmethod
    def get_entries_in_half_open_period(user, start_date, end_date):
        return CheckInEntry.objects.filter(
            user=user,
            is_draft=False,
            entry_date__gte=start_date,
            entry_date__lt=end_date,
        )

    @staticmethod
    def get_entries_with_emotions(queryset):
        return queryset.exclude(emotion__isnull=True).exclude(emotion='')

    @staticmethod
    def get_emotion_detections_since(user, start_date, emotion_detection_model):
        return emotion_detection_model.objects.filter(
            entry__user=user,
            entry__is_draft=False,
            detected_at__gte=start_date,
        )

    @staticmethod
    def get_emotion_detections_in_half_open_period(user, start_date, end_date, emotion_detection_model):
        return emotion_detection_model.objects.filter(
            entry__user=user,
            entry__is_draft=False,
            detected_at__gte=start_date,
            detected_at__lt=end_date,
        )

    @staticmethod
    def get_entry_dates_in_period(user, start_date, end_date):
        return CheckInEntry.objects.filter(
            user=user,
            is_draft=False,
            entry_date__gte=start_date,
            entry_date__lte=end_date,
        ).values_list('entry_date__date', flat=True).distinct().order_by('-entry_date__date')

    @staticmethod
    def get_entries_with_emotions_for_day(user, target_date):
        return EntryAnalyticsRepository.get_entries_with_emotions(
            CheckInEntry.objects.filter(
                user=user,
                is_draft=False,
                entry_date__date=target_date,
            )
        )

    @staticmethod
    def get_insights_timeline_detections_by_date(user, start_date, emotion_detection_model):
        detections = EntryAnalyticsRepository.get_emotion_detections_since(
            user=user,
            start_date=start_date,
            emotion_detection_model=emotion_detection_model,
        ).select_related('entry')

        detections_by_date = {}
        for detection in detections:
            date_key = detection.detected_at.date()
            if date_key not in detections_by_date:
                detections_by_date[date_key] = []
            detections_by_date[date_key].append(detection)
        return detections_by_date

    @staticmethod
    def get_entries_by_day_range_ordered(user, first_day, last_day):
        return CheckInEntry.objects.filter(
            user=user,
            is_draft=False,
            entry_date__date__gte=first_day,
            entry_date__date__lte=last_day,
        ).order_by('entry_date')

    @staticmethod
    def get_entries_for_day_ordered(user, target_date):
        return CheckInEntry.objects.filter(
            user=user,
            is_draft=False,
            entry_date__date=target_date,
        ).order_by('entry_date')

    @staticmethod
    def get_distinct_logged_days_count(entries_queryset):
        days_with_entries = entries_queryset.values_list('entry_date__date', flat=True).distinct()
        return len(set(days_with_entries))

    @staticmethod
    def get_entry_dominant_emotion(entry, emotion_detection_model):
        detection = emotion_detection_model.objects.filter(entry=entry).first()
        if detection:
            return detection.get_dominant_emotion()
        return None

    @staticmethod
    def get_recent_entries_for_user(user, limit):
        return (
            CheckInEntry.objects.filter(user=user, is_draft=False)
            .select_related()
            .prefetch_related('emotion_detections')
            .order_by('-entry_date')[:limit]
        )

    @staticmethod
    def get_latest_detections_for_entry_ids(entry_ids, emotion_detection_model):
        latest_by_entry_id = {}
        if not entry_ids or not emotion_detection_model:
            return latest_by_entry_id

        for detection in emotion_detection_model.objects.filter(entry_id__in=entry_ids).select_related('entry'):
            entry_id = detection.entry_id
            if entry_id not in latest_by_entry_id or detection.detected_at > latest_by_entry_id[entry_id].detected_at:
                latest_by_entry_id[entry_id] = detection
        return latest_by_entry_id
