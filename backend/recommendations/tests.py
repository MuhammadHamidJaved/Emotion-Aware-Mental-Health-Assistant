from unittest.mock import Mock, patch

import requests
from django.contrib.auth import get_user_model
from django.test import SimpleTestCase
from rest_framework.test import APITestCase

from common.external_service_utils import log_external_failure, map_external_exception


User = get_user_model()


class ExternalServiceUtilsTests(SimpleTestCase):
	def test_map_timeout_exception(self):
		error = map_external_exception(
			requests.exceptions.Timeout('timed out'),
			service_name='recommendation-microservice',
			operation='recommend',
		)

		self.assertEqual(error.error_type, 'timeout')
		self.assertEqual(error.status_code, 504)

	def test_map_connection_exception(self):
		error = map_external_exception(
			requests.exceptions.ConnectionError('offline'),
			service_name='recommendation-microservice',
			operation='recommend',
		)

		self.assertEqual(error.error_type, 'connection_error')
		self.assertEqual(error.status_code, 503)

	def test_map_request_exception(self):
		error = map_external_exception(
			requests.exceptions.RequestException('bad request'),
			service_name='recommendation-microservice',
			operation='recommend',
		)

		self.assertEqual(error.error_type, 'request_error')
		self.assertEqual(error.status_code, 502)

	def test_map_unexpected_exception(self):
		error = map_external_exception(
			ValueError('boom'),
			service_name='recommendation-microservice',
			operation='recommend',
		)

		self.assertEqual(error.error_type, 'unexpected_error')
		self.assertEqual(error.status_code, 500)

	def test_log_external_failure_uses_specified_level(self):
		logger = Mock()
		error = map_external_exception(
			requests.exceptions.Timeout('timed out'),
			service_name='recommendation-microservice',
			operation='recommend',
		)

		log_external_failure(logger, error, level='warning')

		logger.warning.assert_called_once()


class RecommendationApiTests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user(
			username='recommendations-api@example.com',
			email='recommendations-api@example.com',
			password='StrongPass123!',
		)
		self.client.force_authenticate(user=self.user)

	@patch('recommendations.recommendation_views.requests.post')
	def test_get_recommendations_returns_200_on_success(self, mock_post):
		mock_response = Mock()
		mock_response.raise_for_status.return_value = None
		mock_response.json.return_value = {
			'recommendation_id': 'rec_1',
			'recommendations': {'music': {'tracks': []}},
			'personalization_applied': {'music': True},
		}
		mock_post.return_value = mock_response

		response = self.client.post('/api/recommendations/get/', {'emotion': 'happy'}, format='json')

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data['emotion'], 'happy')
		self.assertIn('recommendations', response.data)

	@patch('recommendations.recommendation_views.requests.post')
	def test_get_recommendations_maps_timeout_to_504(self, mock_post):
		mock_post.side_effect = requests.exceptions.Timeout('timed out')

		response = self.client.post('/api/recommendations/get/', {'emotion': 'happy'}, format='json')

		self.assertEqual(response.status_code, 504)
		self.assertEqual(response.data['error'], 'Recommendation service timed out. Please try again.')

	@patch('recommendations.recommendation_views.requests.post')
	def test_send_feedback_maps_connection_error_to_503(self, mock_post):
		mock_post.side_effect = requests.exceptions.ConnectionError('offline')

		response = self.client.post(
			'/api/recommendations/feedback/',
			{
				'recommendation_id': 'rec_1',
				'recommendation_type': 'music',
				'item_id': 'track_1',
				'feedback_type': 'like',
			},
			format='json',
		)

		self.assertEqual(response.status_code, 503)
		self.assertEqual(response.data['error'], 'Could not send feedback. Recommendation service is unavailable.')

	@patch('recommendations.recommendation_views.requests.get')
	def test_get_recommendation_history_maps_timeout_to_504(self, mock_get):
		mock_get.side_effect = requests.exceptions.Timeout('timed out')

		response = self.client.get('/api/recommendations/history/')

		self.assertEqual(response.status_code, 504)
		self.assertEqual(response.data['error'], 'Could not load history. Service timed out.')
