from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, TestCase
from django.utils import timezone
from rest_framework.test import APITestCase
from datetime import timedelta
from unittest.mock import patch

from emotions.models import EmotionDetection
from .models import CheckInEntry
from .repositories.entry_analytics_repository import EntryAnalyticsRepository
from .services.response_helpers import created_response, error_response, no_content_response, ok_response


User = get_user_model()


class AssistantResponseHelpersTests(SimpleTestCase):
	def test_ok_response(self):
		response = ok_response({'ok': True})

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data, {'ok': True})

	def test_created_response(self):
		response = created_response({'id': 1})

		self.assertEqual(response.status_code, 201)
		self.assertEqual(response.data, {'id': 1})

	def test_error_response(self):
		response = error_response('failure', 400, details='bad input')

		self.assertEqual(response.status_code, 400)
		self.assertEqual(response.data['error'], 'failure')
		self.assertEqual(response.data['details'], 'bad input')

	def test_no_content_response(self):
		response = no_content_response()

		self.assertEqual(response.status_code, 204)


class AssistantEmotionDetectionApiTests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user(
			username='assistant-api@example.com',
			email='assistant-api@example.com',
			password='StrongPass123!',
		)
		self.client.force_authenticate(user=self.user)

	def test_detect_emotion_from_image_returns_400_for_invalid_payload(self):
		response = self.client.post('/api/assistant/emotion/detect/', {}, format='json')

		self.assertEqual(response.status_code, 400)
		self.assertIn('image_data', response.data)

	@patch('assistant.views.RecommendationSideEffectsService.fetch_recommendations_for_detected_emotion', return_value=None)
	@patch('assistant.views.call_emotion_microservice', return_value=None)
	def test_detect_emotion_from_image_returns_500_when_microservice_fails(self, _mock_emotion, _mock_recommendations):
		response = self.client.post('/api/assistant/emotion/detect/', {'image_data': 'abc123'}, format='json')

		self.assertEqual(response.status_code, 500)
		self.assertEqual(response.data['error'], 'Failed to detect emotion. Please try again.')

	@patch('assistant.views.RecommendationSideEffectsService.fetch_recommendations_for_detected_emotion', return_value=None)
	@patch(
		'assistant.views.call_emotion_microservice',
		return_value={
			'predicted_emotion': 'happy',
			'confidence': 0.91,
			'all_scores': {'happy': 0.91},
			'top_3': [{'emotion': 'happy', 'confidence': 0.91}],
			'processing_time_ms': 13,
		},
	)
	def test_detect_emotion_from_image_returns_200_with_expected_shape(self, _mock_emotion, _mock_recommendations):
		response = self.client.post('/api/assistant/emotion/detect/', {'image_data': 'abc123'}, format='json')

		self.assertEqual(response.status_code, 200)
		self.assertTrue(response.data['success'])
		self.assertEqual(response.data['predicted_emotion'], 'happy')
		self.assertIn('recommendations', response.data)

	@patch('assistant.views.RecommendationSideEffectsService.fetch_recommendations_for_detected_emotion', return_value=None)
	@patch('assistant.views.call_voice_emotion_microservice', return_value=None)
	def test_detect_emotion_from_audio_returns_400_without_file(self):
		response = self.client.post('/api/assistant/emotion/detect/audio/', {}, format='multipart')

		self.assertEqual(response.status_code, 400)

	@patch('assistant.views.RecommendationSideEffectsService.fetch_recommendations_for_detected_emotion', return_value=None)
	@patch('assistant.views.call_voice_emotion_microservice', return_value=None)
	def test_detect_emotion_from_audio_returns_503_when_microservice_fails(self, _mock_voice, _mock_recommendations):
		audio = SimpleUploadedFile('clip.webm', b'fake', content_type='audio/webm')
		response = self.client.post('/api/assistant/emotion/detect/audio/', {'file': audio}, format='multipart')

		self.assertEqual(response.status_code, 503)
		self.assertIn('error', response.data)

	@patch('assistant.views.RecommendationSideEffectsService.fetch_recommendations_for_detected_emotion', return_value=None)
	@patch(
		'assistant.views.call_voice_emotion_microservice',
		return_value={
			'predicted_emotion': 'happy',
			'confidence': 0.88,
			'all_scores': {'happy': 0.88},
			'top_3': [{'emotion': 'happy', 'confidence': 0.88}],
			'processing_time_ms': 0,
		},
	)
	def test_detect_emotion_from_audio_returns_200_with_expected_shape(self, _mock_voice, _mock_recommendations):
		audio = SimpleUploadedFile('clip.webm', b'fake', content_type='audio/webm')
		response = self.client.post('/api/assistant/emotion/detect/audio/', {'file': audio}, format='multipart')

		self.assertEqual(response.status_code, 200)
		self.assertTrue(response.data['success'])
		self.assertEqual(response.data['predicted_emotion'], 'happy')
		self.assertIn('recommendations', response.data)


class EntryAnalyticsRepositoryTests(TestCase):
	def setUp(self):
		self.user = User.objects.create_user(
			username='assistant-repo@example.com',
			email='assistant-repo@example.com',
			password='StrongPass123!',
		)

	def test_get_dominant_emotion_since_returns_most_common_emotion(self):
		now = timezone.now()
		CheckInEntry.objects.create(user=self.user, entry_type='text', entry_date=now - timedelta(days=1), emotion='happy')
		CheckInEntry.objects.create(user=self.user, entry_type='text', entry_date=now - timedelta(days=2), emotion='happy')
		CheckInEntry.objects.create(user=self.user, entry_type='text', entry_date=now - timedelta(days=3), emotion='sad')

		dominant = EntryAnalyticsRepository.get_dominant_emotion_since(
			user=self.user,
			start_date=now - timedelta(days=30),
			default='neutral',
		)

		self.assertEqual(dominant, 'happy')

	def test_get_ml_predictions_count_prefers_detection_records(self):
		entry = CheckInEntry.objects.create(
			user=self.user,
			entry_type='text',
			entry_date=timezone.now() - timedelta(days=1),
			emotion='happy',
		)
		EmotionDetection.objects.create(
			entry=entry,
			modality='text',
			confidence=0.9,
		)

		count = EntryAnalyticsRepository.get_ml_predictions_count(
			user=self.user,
			emotion_detection_model=EmotionDetection,
		)

		self.assertEqual(count, 1)

	def test_get_mood_trend_source_data_groups_by_entry_date(self):
		entry = CheckInEntry.objects.create(
			user=self.user,
			entry_type='text',
			entry_date=timezone.now() - timedelta(days=1),
			emotion='happy',
			emotion_confidence=0.8,
		)
		detection = EmotionDetection.objects.create(
			entry=entry,
			modality='text',
			confidence=0.85,
		)

		detections_by_date, entries_by_date = EntryAnalyticsRepository.get_mood_trend_source_data(
			user=self.user,
			start_date=timezone.now() - timedelta(days=30),
			emotion_detection_model=EmotionDetection,
		)

		entry_day = entry.entry_date.date()
		self.assertIn(entry_day, entries_by_date)
		self.assertIn(entry_day, detections_by_date)
		self.assertIn(entry, entries_by_date[entry_day])
		self.assertIn(detection, detections_by_date[entry_day])

	def test_get_entries_in_period_includes_boundary_dates(self):
		now = timezone.now()
		older = now - timedelta(days=5)
		entry = CheckInEntry.objects.create(
			user=self.user,
			entry_type='text',
			entry_date=older,
			emotion='sad',
		)

		entries = EntryAnalyticsRepository.get_entries_in_period(
			user=self.user,
			start_date=older,
			end_date=now,
		)

		self.assertIn(entry, entries)

	def test_get_insights_timeline_detections_by_date_groups_by_detected_at(self):
		entry = CheckInEntry.objects.create(
			user=self.user,
			entry_type='text',
			entry_date=timezone.now() - timedelta(days=1),
			emotion='happy',
		)
		detection = EmotionDetection.objects.create(
			entry=entry,
			modality='text',
			confidence=0.75,
		)

		grouped = EntryAnalyticsRepository.get_insights_timeline_detections_by_date(
			user=self.user,
			start_date=timezone.now() - timedelta(days=30),
			emotion_detection_model=EmotionDetection,
		)

		detected_day = detection.detected_at.date()
		self.assertIn(detected_day, grouped)
		self.assertIn(detection, grouped[detected_day])

	def test_get_entries_for_day_ordered_returns_only_target_day(self):
		target = timezone.now()
		entry_target = CheckInEntry.objects.create(
			user=self.user,
			entry_type='text',
			entry_date=target,
			emotion='happy',
		)
		CheckInEntry.objects.create(
			user=self.user,
			entry_type='text',
			entry_date=target - timedelta(days=2),
			emotion='sad',
		)

		entries = EntryAnalyticsRepository.get_entries_for_day_ordered(
			user=self.user,
			target_date=target.date(),
		)

		self.assertEqual(list(entries), [entry_target])

	def test_get_entry_dominant_emotion_uses_detection_when_available(self):
		entry = CheckInEntry.objects.create(
			user=self.user,
			entry_type='text',
			entry_date=timezone.now(),
			emotion='',
		)
		EmotionDetection.objects.create(
			entry=entry,
			modality='text',
			happy=0.9,
			sad=0.1,
			confidence=0.9,
		)

		emotion = EntryAnalyticsRepository.get_entry_dominant_emotion(
			entry=entry,
			emotion_detection_model=EmotionDetection,
		)

		self.assertEqual(emotion, 'happy')

	def test_get_recent_entries_for_user_respects_limit(self):
		now = timezone.now()
		for i in range(3):
			CheckInEntry.objects.create(
				user=self.user,
				entry_type='text',
				entry_date=now - timedelta(days=i),
				emotion='happy',
			)

		entries = EntryAnalyticsRepository.get_recent_entries_for_user(user=self.user, limit=2)
		self.assertEqual(len(entries), 2)
