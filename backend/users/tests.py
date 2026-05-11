from django.contrib.auth import get_user_model
from django.test import SimpleTestCase, TestCase, override_settings
from unittest.mock import patch

from users.serializers import AppearanceSettingsPatchSerializer
from users.serializers import NotificationSettingsPatchSerializer
from users.serializers import PrivacySettingsPatchSerializer
from users.serializers import ProfileSettingsPatchSerializer
from users.serializers import RecommendationSettingsPatchSerializer
from users.checks import validate_runtime_security_settings
from users.services.settings_service import SettingsService
from users.settings_models import UserPreferences


User = get_user_model()


class SettingsServiceTests(TestCase):
	def setUp(self):
		self.user = User.objects.create_user(
			username='service-test@example.com',
			email='service-test@example.com',
			password='StrongPass123!'
		)

	def test_get_notification_settings_returns_defaults(self):
		settings = SettingsService.get_notification_settings(self.user)

		self.assertIn('session_reminders', settings)
		self.assertIn('mood_insights', settings)
		self.assertIn('email_notifications', settings)
		self.assertTrue(settings['session_reminders'])

	def test_recommendation_settings_serializer_rejects_more_than_three_artists(self):
		serializer = RecommendationSettingsPatchSerializer(
			data={'favorite_artists': ['a', 'b', 'c', 'd']},
			partial=True,
		)

		self.assertFalse(serializer.is_valid())
		self.assertIn('favorite_artists', serializer.errors)

	def test_profile_settings_serializer_rejects_long_phone_number(self):
		serializer = ProfileSettingsPatchSerializer(
			data={'phone_number': '1' * 21},
			partial=True,
		)

		self.assertFalse(serializer.is_valid())
		self.assertIn('phone_number', serializer.errors)

	def test_notification_settings_serializer_rejects_non_boolean(self):
		serializer = NotificationSettingsPatchSerializer(
			data={'push_notifications': 'maybe'},
			partial=True,
		)

		self.assertFalse(serializer.is_valid())
		self.assertIn('push_notifications', serializer.errors)

	def test_privacy_settings_serializer_rejects_invalid_storage_type(self):
		serializer = PrivacySettingsPatchSerializer(
			data={'storage_type': 'server'},
			partial=True,
		)

		self.assertFalse(serializer.is_valid())
		self.assertIn('storage_type', serializer.errors)

	def test_appearance_settings_serializer_rejects_invalid_color_scheme(self):
		serializer = AppearanceSettingsPatchSerializer(
			data={'color_scheme': 'purple'},
			partial=True,
		)

		self.assertFalse(serializer.is_valid())
		self.assertIn('color_scheme', serializer.errors)

	def test_update_recommendation_settings_merges_existing_preferences(self):
		preferences = UserPreferences.objects.create(user=self.user)
		preferences.set_recommendation_settings({'market': 'PK'})
		preferences.save()

		payload, status_code = SettingsService.update_recommendation_settings(
			self.user,
			{'fitness_level': 'advanced'},
		)

		self.assertEqual(status_code, 200)
		self.assertEqual(payload['settings']['market'], 'PK')
		self.assertEqual(payload['settings']['fitness_level'], 'advanced')

	def test_update_profile_settings_encrypts_sensitive_fields(self):
		payload, status_code = SettingsService.update_profile_settings(
			self.user,
			{'bio': 'private bio', 'phone_number': '12345'},
			{},
		)

		self.assertEqual(status_code, 200)
		self.user.refresh_from_db()
		self.assertNotEqual(self.user.bio_encrypted, '')
		self.assertNotEqual(self.user.phone_number_encrypted, '')
		self.assertEqual(payload['bio'], 'private bio')
		self.assertEqual(payload['phone_number'], '12345')


class SecurityChecksTests(SimpleTestCase):
	@override_settings(
		DEBUG=False,
		SECRET_KEY='django-insecure-test-key',
		ALLOWED_HOSTS=['*'],
		CORS_ALLOWED_ORIGINS=['*'],
	)
	@patch.dict('os.environ', {}, clear=False)
	def test_non_deploy_mode_returns_warnings(self):
		issues = validate_runtime_security_settings(None, deploy=False)
		issue_ids = sorted(issue.id for issue in issues)

		self.assertIn('users.W002', issue_ids)
		self.assertIn('users.W003', issue_ids)
		self.assertIn('users.W004', issue_ids)
		self.assertIn('users.W005', issue_ids)

	@override_settings(
		DEBUG=False,
		SECRET_KEY='django-insecure-test-key',
		ALLOWED_HOSTS=['*'],
		CORS_ALLOWED_ORIGINS=['*'],
	)
	@patch.dict('os.environ', {}, clear=False)
	def test_deploy_mode_returns_errors(self):
		issues = validate_runtime_security_settings(None, deploy=True)
		issue_ids = sorted(issue.id for issue in issues)

		self.assertIn('users.E001', issue_ids)
		self.assertIn('users.E002', issue_ids)
		self.assertIn('users.E003', issue_ids)
		self.assertIn('users.E004', issue_ids)
