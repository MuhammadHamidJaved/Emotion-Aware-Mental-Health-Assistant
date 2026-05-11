"""Custom Django system checks for security-critical runtime settings."""

import os

from django.conf import settings
from django.core.checks import Error, Warning, register, Tags


def _is_default_secret_key(secret_key: str) -> bool:
    if not secret_key:
        return True
    return secret_key.startswith('django-insecure-')


@register(Tags.security)
def validate_runtime_security_settings(app_configs, **kwargs):
    issues = []
    deploy_check = bool(kwargs.get('deploy', False))

    is_debug = bool(getattr(settings, 'DEBUG', False))
    secret_key = getattr(settings, 'SECRET_KEY', '')
    allowed_hosts = getattr(settings, 'ALLOWED_HOSTS', [])
    cors_allowed_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
    encryption_key = os.environ.get('ENCRYPTION_KEY', getattr(settings, 'ENCRYPTION_KEY', None))

    if not is_debug and _is_default_secret_key(secret_key):
        issue_cls = Error if deploy_check else Warning
        issue_id = 'users.E001' if deploy_check else 'users.W002'
        issues.append(
            issue_cls(
                'Insecure SECRET_KEY detected while DEBUG=False.',
                hint='Set SECRET_KEY from environment and do not use Django auto-generated defaults in production.',
                id=issue_id,
            )
        )

    if not is_debug and (not allowed_hosts or allowed_hosts == ['*']):
        issue_cls = Error if deploy_check else Warning
        issue_id = 'users.E002' if deploy_check else 'users.W003'
        issues.append(
            issue_cls(
                'ALLOWED_HOSTS is not safely configured for production.',
                hint='Set explicit hostnames/IPs and avoid wildcard ALLOWED_HOSTS when DEBUG=False.',
                id=issue_id,
            )
        )

    if not encryption_key and not is_debug:
        issue_cls = Error if deploy_check else Warning
        issue_id = 'users.E003' if deploy_check else 'users.W004'
        issues.append(
            issue_cls(
                'ENCRYPTION_KEY is missing while DEBUG=False.',
                hint='Set ENCRYPTION_KEY in environment for production to avoid fallback development key usage.',
                id=issue_id,
            )
        )

    if not encryption_key and is_debug:
        issues.append(
            Warning(
                'ENCRYPTION_KEY is not set; development fallback key may be used.',
                hint='Set ENCRYPTION_KEY in your .env to test with production-like encryption behavior.',
                id='users.W001',
            )
        )

    if not is_debug and cors_allowed_origins and '*' in cors_allowed_origins:
        issue_cls = Error if deploy_check else Warning
        issue_id = 'users.E004' if deploy_check else 'users.W005'
        issues.append(
            issue_cls(
                'CORS_ALLOWED_ORIGINS contains wildcard in production.',
                hint='Use explicit trusted frontend origins when DEBUG=False.',
                id=issue_id,
            )
        )

    return issues
