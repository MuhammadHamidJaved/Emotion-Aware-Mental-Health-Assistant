"""Web Push delivery using VAPID (optional — no-op if keys not configured)."""

from __future__ import annotations

import json
import logging

from django.conf import settings

logger = logging.getLogger(__name__)


def send_push_to_user(user, title: str, message: str, action_path: str = '') -> int:
    """
    Send a Web Push to all stored subscriptions for user.
    Returns number of successful sends.
    """
    private_key = getattr(settings, 'WEB_PUSH_PRIVATE_KEY', '') or ''
    if not private_key.strip():
        return 0

    try:
        from pywebpush import WebPushException, webpush
    except ImportError:
        logger.warning('pywebpush not installed; skipping Web Push')
        return 0

    from .models import PushSubscription

    base = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000').rstrip('/')
    path = action_path if action_path.startswith('/') else f'/{action_path}' if action_path else '/'
    full_url = f'{base}{path}' if action_path else base

    payload = json.dumps({
        'title': title or 'EmotionAI',
        'body': (message or '')[:500],
        'url': full_url,
    })

    vapid_claims = {'sub': getattr(settings, 'WEB_PUSH_ADMIN_CONTACT', 'mailto:support@example.com')}

    sent = 0
    dead_ids = []

    for sub in PushSubscription.objects.filter(user=user):
        subscription_info = {
            'endpoint': sub.endpoint,
            'keys': {'p256dh': sub.p256dh, 'auth': sub.auth},
        }
        try:
            webpush(
                subscription_info=subscription_info,
                data=payload,
                vapid_private_key=private_key,
                vapid_claims=vapid_claims,
            )
            sent += 1
        except WebPushException as exc:
            if getattr(exc, 'response', None) is not None and exc.response.status_code in (404, 410):
                dead_ids.append(sub.id)
            else:
                logger.warning('Web Push failed for user %s: %s', user.id, exc)
        except Exception as exc:  # noqa: BLE001
            logger.warning('Web Push error for user %s: %s', user.id, exc)

    if dead_ids:
        PushSubscription.objects.filter(id__in=dead_ids).delete()

    return sent


def get_public_vapid_key() -> str:
    return getattr(settings, 'WEB_PUSH_PUBLIC_KEY', '') or ''
