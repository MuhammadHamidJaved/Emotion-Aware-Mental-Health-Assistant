"""Scheduled notification jobs (session reminders, mood insights, weekly reports)."""

from __future__ import annotations

import logging
from datetime import timedelta

from django.utils import timezone

from assistant.models import CheckInEntry
from assistant.repositories.entry_analytics_repository import EntryAnalyticsRepository

from .models import NotificationScheduleState
from .notification_dispatcher import NotificationDispatcher

logger = logging.getLogger(__name__)


def _iter_users_with_prefs():
    from users.models import User
    from users.settings_models import UserPreferences

    for user in User.objects.filter(is_active=True):
        pref, _ = UserPreferences.objects.get_or_create(user=user)
        yield user, pref, pref.get_notification_settings()


def _iso_week_id(d=None) -> str:
    d = d or timezone.now().date()
    iso = d.isocalendar()
    return f'{iso.year}-W{iso.week:02d}'


def _ensure_state(user) -> NotificationScheduleState:
    state, _ = NotificationScheduleState.objects.get_or_create(user=user)
    return state


def run_session_reminders() -> int:
    """One reminder per user per calendar day (UTC), if no check-in that day."""
    today = timezone.now().date()
    sent = 0

    for user, _pref, prefs in _iter_users_with_prefs():
        if not prefs.get('session_reminders', True):
            continue
        state = _ensure_state(user)
        if state.last_session_reminder_date == today:
            continue
        if CheckInEntry.objects.filter(user=user, is_draft=False, entry_date__date=today).exists():
            continue

        NotificationDispatcher.dispatch(
            user=user,
            notification_type='session_reminder',
            title='Time for your emotional check-in',
            message='Take a moment to reflect on how you\'re feeling today.',
            action_url='/check-in/new',
        )
        state.last_session_reminder_date = today
        state.save(update_fields=['last_session_reminder_date', 'updated_at'])
        sent += 1
    logger.info('session_reminders: sent %s', sent)
    return sent


def run_mood_insights() -> int:
    """Once per ISO week per user, template-based insight from last-14-day activity."""
    week_id = _iso_week_id()
    sent = 0

    start = timezone.now() - timedelta(days=14)

    for user, _pref, prefs in _iter_users_with_prefs():
        if not prefs.get('mood_insights', True):
            continue
        state = _ensure_state(user)
        if state.last_mood_insight_iso_week == week_id:
            continue

        recent = CheckInEntry.objects.filter(user=user, is_draft=False, entry_date__gte=start).count()
        if recent < 1:
            continue

        dominant = EntryAnalyticsRepository.get_dominant_emotion_since(user, start, default='neutral')
        insight = (
            f'Over the last two weeks you logged {recent} check-in(s). '
            f'Your dominant mood label lately is "{dominant}". '
            f'Open Insights to see trends and keep building awareness.'
        )

        NotificationDispatcher.dispatch(
            user=user,
            notification_type='mood_insight',
            title='New mood insight available',
            message=insight,
            action_url='/insights',
            metadata={'dominant': dominant, 'recent_entries': recent},
        )
        state.last_mood_insight_iso_week = week_id
        state.save(update_fields=['last_mood_insight_iso_week', 'updated_at'])
        sent += 1
    logger.info('mood_insights: sent %s', sent)
    return sent


def run_weekly_reports() -> int:
    """Once per ISO week per user; richer summary for email + in-app."""
    week_id = _iso_week_id()
    sent = 0

    start = timezone.now() - timedelta(days=7)

    for user, _pref, prefs in _iter_users_with_prefs():
        if not prefs.get('weekly_reports', False):
            continue
        state = _ensure_state(user)
        if state.last_weekly_report_iso_week == week_id:
            continue

        week_entries = CheckInEntry.objects.filter(
            user=user, is_draft=False, entry_date__gte=start,
        ).count()
        if week_entries < 1:
            continue

        dominant = EntryAnalyticsRepository.get_dominant_emotion_since(user, start, default='neutral')
        streak = getattr(user, 'current_streak', 0) or 0
        message = (
            f'This week: {week_entries} check-in(s), dominant mood "{dominant}", '
            f'current streak {streak} day(s). Review the full picture on Insights.'
        )

        NotificationDispatcher.dispatch(
            user=user,
            notification_type='weekly_report',
            title='Your weekly emotional wellness report',
            message=message,
            action_url='/insights',
            metadata={
                'week_entries': week_entries,
                'dominant': dominant,
                'streak': streak,
                'iso_week': week_id,
            },
        )
        state.last_weekly_report_iso_week = week_id
        state.save(update_fields=['last_weekly_report_iso_week', 'updated_at'])
        sent += 1
    logger.info('weekly_reports: sent %s', sent)
    return sent


def run_all_scheduled() -> dict:
    return {
        'session_reminders': run_session_reminders(),
        'mood_insights': run_mood_insights(),
        'weekly_reports': run_weekly_reports(),
    }
