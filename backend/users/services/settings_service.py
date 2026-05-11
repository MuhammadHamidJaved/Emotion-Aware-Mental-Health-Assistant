"""Business logic for user settings endpoints."""

import importlib
import logging

from users.settings_models import UserPreferences

logger = logging.getLogger(__name__)


DEFAULT_NOTIFICATION_SETTINGS = {
    'session_reminders': True,
    'mood_insights': True,
    'weekly_reports': False,
    'streak_alerts': True,
    'ai_suggestions': True,
    'email_notifications': True,
    'push_notifications': False,
}

DEFAULT_PRIVACY_SETTINGS = {
    'data_collection': True,
    'share_analytics': False,
    'cloud_backup': True,
    'storage_type': 'hybrid',
}

DEFAULT_APPEARANCE_SETTINGS = {
    'mood_adaptive': True,
    'dark_mode': False,
    'color_scheme': 'default',
}

DEFAULT_RECOMMENDATION_SETTINGS = {
    'music_language': '',
    'music_genres': [],
    'favorite_artists': [],
    'market': 'US',
    'fitness_level': 'moderate',
    'age_group': None,
    'content_language': 'en',
}


class SettingsService:
    @staticmethod
    def _get_preferences(user):
        preferences, _ = UserPreferences.objects.get_or_create(user=user)
        return preferences

    @staticmethod
    def _merge_defaults(defaults: dict, saved: dict) -> dict:
        return {**defaults, **(saved or {})}

    @staticmethod
    def _decrypt_profile_fields(user):
        bio = ""
        phone_number = ""

        try:
            from users.encryption import get_encryption_service

            encryption_service = get_encryption_service()

            if user.bio_encrypted:
                bio = encryption_service.decrypt(user.bio_encrypted)
            elif user.bio:
                bio = user.bio

            if user.phone_number_encrypted:
                phone_number = encryption_service.decrypt(user.phone_number_encrypted)
            elif user.phone_number:
                phone_number = user.phone_number
        except (ImportError, Exception) as exc:
            logger.warning(f"Encryption not available, using plain text: {exc}")
            bio = user.bio or ""
            phone_number = user.phone_number or ""

        return bio, phone_number

    @staticmethod
    def get_profile_settings(user) -> dict:
        if user.total_entries == 0:
            try:
                user.update_stats()
            except Exception as exc:
                logger.warning(f"Could not update user stats: {exc}")

        bio, phone_number = SettingsService._decrypt_profile_fields(user)

        return {
            'first_name': user.first_name or '',
            'last_name': user.last_name or '',
            'email': user.email,
            'bio': bio,
            'phone_number': phone_number,
            'profile_picture': user.profile_picture or None,
            'total_entries': user.total_entries,
            'current_streak': user.current_streak,
            'longest_streak': user.longest_streak,
        }

    @staticmethod
    def update_profile_settings(user, request_data, request_files) -> tuple[dict, int]:
        try:
            from users.encryption import get_encryption_service
        except ImportError as exc:
            logger.error(f"Encryption service not available: {exc}")
            return {'error': 'Encryption service not available. Please install cryptography package.'}, 500

        try:
            encryption_service = get_encryption_service()

            data = {
                key: request_data[key]
                for key in request_data
                if key != 'profile_picture'
            }

            if 'profile_picture' in request_files:
                profile_file = request_files['profile_picture']
                try:
                    uploader = importlib.import_module('cloudinary.uploader')
                    upload_result = uploader.upload(
                        profile_file,
                        folder='emotion-assistant/profile_pictures',
                        resource_type='image',
                    )
                    data['profile_picture'] = upload_result.get('secure_url')
                except Exception as exc:
                    return {'error': f'Failed to upload profile picture: {exc}'}, 400

            if 'first_name' in data:
                user.first_name = data['first_name']
            if 'last_name' in data:
                user.last_name = data['last_name']
            if 'profile_picture' in data:
                user.profile_picture = data['profile_picture']

            if 'bio' in data:
                bio_text = data['bio']
                user.bio_encrypted = encryption_service.encrypt(bio_text) if bio_text else ''
                user.bio = bio_text

            if 'phone_number' in data:
                phone_text = data['phone_number']
                user.phone_number_encrypted = encryption_service.encrypt(phone_text) if phone_text else ''
                user.phone_number = phone_text

            user.save()

            return {
                'message': 'Profile updated successfully',
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'bio': encryption_service.decrypt(user.bio_encrypted) if user.bio_encrypted else '',
                'phone_number': encryption_service.decrypt(user.phone_number_encrypted) if user.phone_number_encrypted else '',
                'profile_picture': user.profile_picture,
            }, 200

        except Exception as exc:
            logger.error(f"Error updating profile: {exc}")
            return {'error': str(exc)}, 500

    @staticmethod
    def get_notification_settings(user) -> dict:
        preferences = SettingsService._get_preferences(user)
        return SettingsService._merge_defaults(
            DEFAULT_NOTIFICATION_SETTINGS,
            preferences.get_notification_settings(),
        )

    @staticmethod
    def update_notification_settings(user, request_data) -> tuple[dict, int]:
        try:
            preferences = SettingsService._get_preferences(user)
            new_settings = request_data.copy()
            preferences.set_notification_settings(new_settings)
            preferences.save()
            return {
                'message': 'Notification settings updated successfully',
                'settings': new_settings,
            }, 200
        except Exception as exc:
            logger.error(f"Error updating notification settings: {exc}")
            return {'error': str(exc)}, 500

    @staticmethod
    def get_privacy_settings(user) -> dict:
        preferences = SettingsService._get_preferences(user)
        return SettingsService._merge_defaults(
            DEFAULT_PRIVACY_SETTINGS,
            preferences.get_privacy_settings(),
        )

    @staticmethod
    def update_privacy_settings(user, request_data) -> tuple[dict, int]:
        try:
            preferences = SettingsService._get_preferences(user)
            new_settings = request_data.copy()
            preferences.set_privacy_settings(new_settings)
            preferences.save()
            return {
                'message': 'Privacy settings updated successfully',
                'settings': new_settings,
            }, 200
        except Exception as exc:
            logger.error(f"Error updating privacy settings: {exc}")
            return {'error': str(exc)}, 500

    @staticmethod
    def get_appearance_settings(user) -> dict:
        preferences = SettingsService._get_preferences(user)
        return SettingsService._merge_defaults(
            DEFAULT_APPEARANCE_SETTINGS,
            preferences.get_appearance_settings(),
        )

    @staticmethod
    def update_appearance_settings(user, request_data) -> tuple[dict, int]:
        try:
            preferences = SettingsService._get_preferences(user)
            new_settings = request_data.copy()
            preferences.set_appearance_settings(new_settings)
            preferences.save()
            return {
                'message': 'Appearance settings updated successfully',
                'settings': new_settings,
            }, 200
        except Exception as exc:
            logger.error(f"Error updating appearance settings: {exc}")
            return {'error': str(exc)}, 500

    @staticmethod
    def get_recommendation_settings(user) -> dict:
        preferences = SettingsService._get_preferences(user)
        return SettingsService._merge_defaults(
            DEFAULT_RECOMMENDATION_SETTINGS,
            preferences.get_recommendation_settings(),
        )

    @staticmethod
    def update_recommendation_settings(user, request_data) -> tuple[dict, int]:
        try:
            new_settings = request_data.copy()

            preferences = SettingsService._get_preferences(user)
            existing = preferences.get_recommendation_settings()
            existing.update(new_settings)
            preferences.set_recommendation_settings(existing)
            preferences.save()

            return {
                'message': 'Recommendation settings updated successfully',
                'settings': existing,
            }, 200
        except Exception as exc:
            logger.error(f"Error updating recommendation settings: {exc}")
            return {'error': str(exc)}, 500
