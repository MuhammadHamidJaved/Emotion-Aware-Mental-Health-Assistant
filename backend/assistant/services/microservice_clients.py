"""External microservice client functions for assistant flows."""

import logging
from typing import Any, Dict, Optional

import requests
from django.conf import settings
from common.external_service_utils import log_external_failure, map_external_exception

logger = logging.getLogger(__name__)

EMOTION_MICROSERVICE_URL = getattr(settings, 'EMOTION_MICROSERVICE_URL', 'http://localhost:8001')
EMOTION_7CLASS_MICROSERVICE_URL = getattr(settings, 'EMOTION_7CLASS_MICROSERVICE_URL', 'http://localhost:5002')
RECOMMENDATION_MICROSERVICE_URL = getattr(settings, 'RECOMMENDATION_MICROSERVICE_URL', 'http://localhost:5001/api')
TEXT_EMOTION_MICROSERVICE_URL = getattr(settings, 'TEXT_EMOTION_MICROSERVICE_URL', 'http://localhost:5001')
VOICE_EMOTION_MICROSERVICE_URL = getattr(settings, 'VOICE_EMOTION_MICROSERVICE_URL', 'http://127.0.0.1:5003')

# Map common audio-model labels (e.g. CREMA-D / Wav2Vec2) to app recommendation vocabulary
_AUDIO_EMOTION_TO_APP = {
    'happy': 'happy',
    'happiness': 'happy',
    'joy': 'happy',
    'neutral': 'neutral',
    'calm': 'calm',
    'angry': 'angry',
    'anger': 'angry',
    'sad': 'sad',
    'sadness': 'sad',
    'fear': 'anxious',
    'fearful': 'anxious',
    'anxiety': 'anxious',
    'disgust': 'disgusted',
    'disgusted': 'disgusted',
    'surprise': 'surprised',
    'surprised': 'surprised',
}


def call_emotion_microservice(image_data_base64: str) -> dict:
    """Call the facial recognition microservice to detect emotion from base64 image."""
    try:
        url = f"{EMOTION_MICROSERVICE_URL}/predict/base64"
        payload = {"image_data": image_data_base64}

        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()

        data = response.json()
        if data.get('success'):
            return {
                'predicted_emotion': data.get('predicted_emotion', ''),
                'confidence': data.get('confidence', 0.0),
                'all_scores': data.get('all_scores', {}),
                'top_3': data.get('top_3', []),
                'processing_time_ms': data.get('processing_time_ms', 0)
            }

        logger.error(f"Microservice returned error: {data.get('error')}")
        return None

    except Exception as exc:
        error_info = map_external_exception(
            exc,
            service_name='emotion-microservice',
            operation='predict-base64',
            timeout_message='Emotion detection service timed out. Please try again.',
            connection_message='Emotion detection service is not available.',
            request_message='Emotion detection service request failed.',
            unexpected_message='Unexpected emotion detection service error.',
        )
        log_external_failure(logger, error_info)
        return None


def call_emotion_7class_microservice(image_data_base64: str) -> dict:
    """Call the 7-class emotion detection microservice."""
    try:
        url = f"{EMOTION_7CLASS_MICROSERVICE_URL}/predict/base64"

        if not image_data_base64.startswith('data:image'):
            image_data_base64 = f'data:image/jpeg;base64,{image_data_base64}'

        payload = {
            'image': image_data_base64,
            'model_type': 'custom_cnn'
        }

        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()

        data = response.json()

        if data.get('num_faces', 0) > 0 and data.get('faces'):
            first_face = data['faces'][0]

            predicted_emotion = first_face.get('emotion', 'neutral')
            confidence = first_face.get('confidence', 0.0)
            all_emotions = first_face.get('all_emotions', {})

            all_scores = {}
            for emotion, score in all_emotions.items():
                all_scores[emotion.lower()] = float(score)

            top_3 = sorted(
                all_scores.items(),
                key=lambda x: x[1],
                reverse=True
            )[:3]
            top_3 = [{'emotion': emo, 'confidence': conf} for emo, conf in top_3]

            return {
                'predicted_emotion': predicted_emotion.lower(),
                'confidence': confidence,
                'all_scores': all_scores,
                'top_3': top_3,
                'processing_time_ms': data.get('processing_time_ms', 0),
                'num_faces': data.get('num_faces', 0)
            }

        logger.warning('No faces detected in image by 7-class microservice')
        return {
            'predicted_emotion': 'neutral',
            'confidence': 0.0,
            'all_scores': {'neutral': 1.0},
            'top_3': [{'emotion': 'neutral', 'confidence': 1.0}],
            'processing_time_ms': data.get('processing_time_ms', 0),
            'num_faces': 0
        }

    except Exception as exc:
        error_info = map_external_exception(
            exc,
            service_name='emotion-7class-microservice',
            operation='predict-base64',
            timeout_message='7-class emotion detection service timed out. Please try again.',
            connection_message='7-class emotion detection service is not available.',
            request_message='7-class emotion detection service request failed.',
            unexpected_message='Unexpected 7-class emotion detection service error.',
        )
        log_external_failure(logger, error_info)
        return None


def call_text_emotion_microservice(text: str) -> dict:
    """Call the text emotion detection microservice to detect emotion from text."""
    try:
        url = f"{TEXT_EMOTION_MICROSERVICE_URL}/v1/predict"
        payload = {'text': text}

        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()

        data = response.json()

        emotion_mapping = {
            'joy': 'happy',
            'happiness': 'happy',
            'excitement': 'excited',
            'optimism': 'excited',
            'sadness': 'sad',
            'sad': 'sad',
            'anger': 'angry',
            'angry': 'angry',
            'fear': 'fearful',
            'fearful': 'fearful',
            'anxiety': 'anxious',
            'anxious': 'anxious',
            'disgust': 'disgusted',
            'disgusted': 'disgusted',
            'surprise': 'surprised',
            'surprised': 'surprised',
            'neutral': 'neutral',
            'calm': 'calm',
            'peaceful': 'calm',
            'gratitude': 'grateful',
            'grateful': 'grateful',
            'love': 'loved',
            'loved': 'loved',
            'frustration': 'frustrated',
            'frustrated': 'frustrated',
            'tired': 'tired',
            'lonely': 'lonely',
            'scared': 'fearful',
            'disappointed': 'disappointed',
            'energetic': 'energetic',
            'confident': 'confident',
            'contempt': 'contempt',
        }

        predicted_label = data.get('label', '').lower()
        mapped_emotion = emotion_mapping.get(predicted_label, 'neutral')

        confidence = data.get('score', 0.0)

        all_scores = {}
        if 'metadata' in data and 'all_scores' in data['metadata']:
            for emotion_label, score in data['metadata']['all_scores'].items():
                mapped = emotion_mapping.get(emotion_label.lower(), emotion_label.lower())
                all_scores[mapped] = score

        if not all_scores:
            all_scores[mapped_emotion] = confidence

        return {
            'predicted_emotion': mapped_emotion,
            'confidence': confidence,
            'all_scores': all_scores,
            'top_3': sorted(all_scores.items(), key=lambda x: x[1], reverse=True)[:3],
            'processing_time_ms': 0,
            'original_label': predicted_label
        }

    except Exception as exc:
        error_info = map_external_exception(
            exc,
            service_name='text-emotion-microservice',
            operation='predict-text',
            timeout_message='Text emotion detection service timed out. Please try again.',
            connection_message='Text emotion detection service is not available.',
            request_message='Text emotion detection service request failed.',
            unexpected_message='Unexpected text emotion detection service error.',
        )
        log_external_failure(logger, error_info)
        return None


def call_voice_emotion_microservice(uploaded_file) -> Optional[Dict[str, Any]]:
    """Call the audio emotion microservice (multipart file -> predictions)."""
    try:
        url = f"{VOICE_EMOTION_MICROSERVICE_URL.rstrip('/')}/predict"
        uploaded_file.seek(0)
        raw_name = getattr(uploaded_file, 'name', None) or 'recording.webm'
        content_type = getattr(uploaded_file, 'content_type', None) or 'application/octet-stream'
        payload = uploaded_file.read()
        files = {'file': (raw_name, payload, content_type)}

        response = requests.post(url, files=files, timeout=120)
        response.raise_for_status()

        data = response.json()
        predictions = data.get('predictions') or []
        if not predictions:
            logger.warning('Voice emotion microservice returned empty predictions')
            return None

        merged_scores: dict[str, float] = {}
        for item in predictions:
            raw = (item.get('emotion') or '').strip().lower()
            try:
                score = float(item.get('score', 0.0))
            except (TypeError, ValueError):
                score = 0.0
            app_label = _AUDIO_EMOTION_TO_APP.get(raw, raw)
            merged_scores[app_label] = max(merged_scores.get(app_label, 0.0), score)

        if not merged_scores:
            return None

        sorted_items = sorted(merged_scores.items(), key=lambda x: x[1], reverse=True)
        predicted_emotion = sorted_items[0][0]
        confidence = sorted_items[0][1]

        top_3 = [{'emotion': emo, 'confidence': conf} for emo, conf in sorted_items[:3]]

        return {
            'predicted_emotion': predicted_emotion,
            'confidence': confidence,
            'all_scores': merged_scores,
            'top_3': top_3,
            'processing_time_ms': 0,
        }

    except Exception as exc:
        error_info = map_external_exception(
            exc,
            service_name='voice-emotion-microservice',
            operation='predict-audio',
            timeout_message='Voice emotion detection timed out. Try a shorter recording.',
            connection_message='Voice emotion service is not available. Ensure it is running on port 5003.',
            request_message='Voice emotion service request failed.',
            unexpected_message='Unexpected voice emotion service error.',
        )
        log_external_failure(logger, error_info)
        return None


def get_user_recommendation_preferences(user) -> dict:
    """Load saved recommendation personalization preferences for a user."""
    try:
        from users.settings_models import UserPreferences

        prefs = UserPreferences.objects.filter(user=user).first()
        if prefs:
            return prefs.get_recommendation_settings()
    except Exception as exc:
        logger.error(f"Error loading recommendation preferences: {exc}")
    return {}


def call_recommendation_microservice(user_id: str, emotion: str, context: dict = None, preferences: dict = None) -> dict:
    """Call the recommendation microservice to get mood-based recommendations."""
    try:
        url = f"{RECOMMENDATION_MICROSERVICE_URL}/recommend"
        payload = {
            'user_id': str(user_id),
            'emotion': emotion.lower(),
            'preferences': preferences or {},
            'context': context or {}
        }

        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()

        data = response.json()
        if data.get('recommendations'):
            logger.info(f"Successfully fetched recommendations for emotion: {emotion}")
            music_data = data.get('recommendations', {}).get('music', {})
            logger.info(f"Music data structure: {type(music_data)}, keys: {music_data.keys() if isinstance(music_data, dict) else 'N/A'}")
            if isinstance(music_data, dict) and music_data.get('tracks'):
                logger.info(f"Number of tracks: {len(music_data.get('tracks', []))}")
            return data

        logger.warning('Recommendation service returned empty recommendations')
        return None

    except Exception as exc:
        error_info = map_external_exception(
            exc,
            service_name='recommendation-microservice',
            operation='recommend',
            timeout_message='Recommendation service timed out. Please try again.',
            connection_message='Recommendation service is not available.',
            request_message='Recommendation service request failed.',
            unexpected_message='Unexpected recommendation service error.',
        )
        log_external_failure(logger, error_info)
        return None
