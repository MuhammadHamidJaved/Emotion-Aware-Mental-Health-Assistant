"""
Additional models for user settings and preferences
These fields can be added to User model or kept separate
"""
from django.db import models
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class UserPreferences(models.Model):
    """
    User preferences and settings
    Sensitive data will be encrypted at the application level
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='preferences'
    )
    
    # Notification preferences (stored as JSON, encrypted)
    notification_settings = models.TextField(blank=True, help_text='Encrypted JSON')
    
    # Privacy settings (stored as JSON, encrypted)
    privacy_settings = models.TextField(blank=True, help_text='Encrypted JSON')
    
    # Appearance settings (stored as JSON, encrypted)
    appearance_settings = models.TextField(blank=True, help_text='Encrypted JSON')
    
    # Onboarding settings (stored as JSON, encrypted)
    onboarding_settings = models.TextField(blank=True, help_text='Encrypted JSON - storage preference and feature permissions')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_preferences'
        verbose_name = 'User Preferences'
        verbose_name_plural = 'User Preferences'
    
    def get_notification_settings(self) -> dict:
        """Decrypt and return notification settings"""
        try:
            from .encryption import get_encryption_service
            service = get_encryption_service()
            return service.decrypt_json(self.notification_settings) if self.notification_settings else {}
        except ImportError as e:
            logger.error(f"Encryption service not available: {e}")
            return {}
    
    def set_notification_settings(self, settings: dict):
        """Encrypt and store notification settings"""
        try:
            from .encryption import get_encryption_service
            service = get_encryption_service()
            self.notification_settings = service.encrypt_json(settings)
        except ImportError as e:
            logger.error(f"Encryption service not available: {e}")
            # Store as plain JSON if encryption not available (not secure, but prevents crashes)
            import json
            self.notification_settings = json.dumps(settings)
    
    def get_privacy_settings(self) -> dict:
        """Decrypt and return privacy settings"""
        try:
            from .encryption import get_encryption_service
            service = get_encryption_service()
            return service.decrypt_json(self.privacy_settings) if self.privacy_settings else {}
        except ImportError as e:
            logger.error(f"Encryption service not available: {e}")
            return {}
    
    def set_privacy_settings(self, settings: dict):
        """Encrypt and store privacy settings"""
        try:
            from .encryption import get_encryption_service
            service = get_encryption_service()
            self.privacy_settings = service.encrypt_json(settings)
        except ImportError as e:
            logger.error(f"Encryption service not available: {e}")
            import json
            self.privacy_settings = json.dumps(settings)
    
    def get_appearance_settings(self) -> dict:
        """Decrypt and return appearance settings"""
        try:
            from .encryption import get_encryption_service
            service = get_encryption_service()
            return service.decrypt_json(self.appearance_settings) if self.appearance_settings else {}
        except ImportError as e:
            logger.error(f"Encryption service not available: {e}")
            return {}
    
    def set_appearance_settings(self, settings: dict):
        """Encrypt and store appearance settings"""
        try:
            from .encryption import get_encryption_service
            service = get_encryption_service()
            self.appearance_settings = service.encrypt_json(settings)
        except ImportError as e:
            logger.error(f"Encryption service not available: {e}")
            import json
            self.appearance_settings = json.dumps(settings)
    
    def get_onboarding_settings(self) -> dict:
        """Decrypt and return onboarding settings"""
        try:
            from .encryption import get_encryption_service
            service = get_encryption_service()
            return service.decrypt_json(self.onboarding_settings) if self.onboarding_settings else {}
        except ImportError as e:
            logger.error(f"Encryption service not available: {e}")
            return {}
    
    def set_onboarding_settings(self, settings: dict):
        """Encrypt and store onboarding settings"""
        try:
            from .encryption import get_encryption_service
            service = get_encryption_service()
            self.onboarding_settings = service.encrypt_json(settings)
        except ImportError as e:
            logger.error(f"Encryption service not available: {e}")
            import json
            self.onboarding_settings = json.dumps(settings)

