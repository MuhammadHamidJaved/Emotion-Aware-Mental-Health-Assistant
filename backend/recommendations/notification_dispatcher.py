"""
Orchestrates in-app notifications, email (SendGrid via Django email), and Web Push.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Sequence

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

from . import push_service
from .models import Notification
from .notification_service import NotificationService

logger = logging.getLogger(__name__)

DEFAULT_CHANNELS: Sequence[str] = ('in_app', 'email', 'push')


class NotificationDispatcher:
    @staticmethod
    def _prefs(user) -> Dict[str, Any]:
        try:
            return user.preferences.get_notification_settings()
        except Exception:  # noqa: BLE001
            return {}

    @staticmethod
    def _absolute_url(path: str) -> str:
        if not path:
            return getattr(settings, 'FRONTEND_URL', 'http://localhost:3000').rstrip('/')
        if path.startswith('http://') or path.startswith('https://'):
            return path
        base = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000').rstrip('/')
        rel = path if path.startswith('/') else f'/{path}'
        return f'{base}{rel}'

    @staticmethod
    def _effective_channels(user, requested: Sequence[str]) -> List[str]:
        prefs = NotificationDispatcher._prefs(user)
        out: List[str] = []
        if 'in_app' in requested:
            out.append('in_app')
        if 'email' in requested and prefs.get('email_notifications', True):
            out.append('email')
        if 'push' in requested and prefs.get('push_notifications', False):
            out.append('push')
        return out

    @staticmethod
    def _send_email(user, subject: str, text_body: str, html_body: str) -> None:
        if not user or not getattr(user, 'email', None):
            return
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None)
        if not from_email:
            logger.warning('DEFAULT_FROM_EMAIL not set; skip email')
            return
        msg = EmailMultiAlternatives(
            subject=subject[:998],
            body=text_body,
            from_email=from_email,
            to=[user.email],
        )
        msg.attach_alternative(html_body, 'text/html')
        msg.send(fail_silently=False)

    @staticmethod
    def dispatch(
        user,
        notification_type: str,
        title: str,
        message: str,
        action_url: str = '',
        metadata: Optional[dict] = None,
        related_object_id: Optional[int] = None,
        channels: Optional[Sequence[str]] = None,
        skip_type_check: bool = False,
    ) -> Optional[Notification]:
        """
        If ``channels`` is None, use in-app + email + push (each channel still respects user toggles).
        Pass ``channels=('in_app',)`` for transactional in-app-only (e.g. entry saved).
        ``skip_type_check`` (dev/test): send even if per-type preference is off; channel toggles still apply.
        """
        if not skip_type_check and not NotificationService.should_send_notification(user, notification_type):
            return None

        req = list(channels) if channels is not None else list(DEFAULT_CHANNELS)
        eff = NotificationDispatcher._effective_channels(user, req)

        notif = None
        if 'in_app' in eff:
            notif = NotificationService.create_notification(
                user=user,
                notification_type=notification_type,
                title=title,
                message=message,
                action_url=action_url or '',
                related_object_id=related_object_id,
                metadata=metadata,
            )

        if 'email' in eff:
            try:
                abs_url = NotificationDispatcher._absolute_url(action_url)
                html = render_to_string(
                    'emails/notification.html',
                    {'title': title, 'message': message, 'action_url': abs_url if action_url else ''},
                )
                text = f'{title}\n\n{message}\n\n{abs_url if action_url else ""}'
                NotificationDispatcher._send_email(user, title, text, html)
            except Exception as exc:  # noqa: BLE001
                # Email delivery should not break API flow; log concise warning only.
                logger.warning('Email send failed for user %s: %s', getattr(user, 'id', None), exc)

        if 'push' in eff:
            try:
                push_service.send_push_to_user(user, title, message, action_url or '/notifications')
            except Exception as exc:  # noqa: BLE001
                logger.warning('Push send failed for user %s: %s', getattr(user, 'id', None), exc)

        return notif
