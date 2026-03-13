"""
Views for personalized recommendation API endpoints.
These proxy requests to the recommendation microservice (port 5001)
with the user's saved personalization preferences.
"""
import requests
import logging
from datetime import datetime

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings as django_settings

logger = logging.getLogger(__name__)

RECOMMENDATION_MICROSERVICE_URL = getattr(
    django_settings, 'RECOMMENDATION_MICROSERVICE_URL', 'http://localhost:5001/api'
)

# ── helpers ────────────────────────────────────────────────────────────

def _get_user_preferences(user) -> dict:
    """Load the user's saved recommendation personalization settings."""
    try:
        from users.settings_models import UserPreferences
        prefs = UserPreferences.objects.filter(user=user).first()
        if prefs:
            return prefs.get_recommendation_settings()
    except Exception as e:
        logger.error(f"Error loading recommendation preferences: {e}")
    return {}


def _build_context() -> dict:
    """Build automatic context (time-of-day, etc.)."""
    hour = datetime.now().hour
    if 5 <= hour < 12:
        time_of_day = 'morning'
    elif 12 <= hour < 17:
        time_of_day = 'afternoon'
    elif 17 <= hour < 21:
        time_of_day = 'evening'
    else:
        time_of_day = 'night'
    return {'time_of_day': time_of_day}


EMOTION_MAP = {
    'happy': 'happy', 'sad': 'sad', 'angry': 'angry',
    'anxious': 'anxious', 'calm': 'calm', 'neutral': 'neutral',
    'excited': 'excited', 'frustrated': 'frustrated',
    'tired': 'tired', 'confident': 'confident',
    'loved': 'loved', 'fearful': 'fearful',
    'disgusted': 'disgusted', 'disappointed': 'disappointed',
    'surprised': 'surprised', 'energetic': 'energetic',
    'grateful': 'grateful', 'hopeful': 'hopeful',
    'lonely': 'lonely', 'jealous': 'jealous',
    'nostalgic': 'nostalgic', 'bored': 'bored',
    'confused': 'confused', 'embarrassed': 'embarrassed',
    'proud': 'proud', 'content': 'content',
    'overwhelmed': 'overwhelmed', 'amused': 'amused',
}


# ── endpoints ──────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_recommendations(request):
    """
    Fetch personalized recommendations from the microservice.
    Loads the caller's preferences automatically and merges them
    with any extra context/preferences sent in the request body.

    POST /api/recommendations/get/
    Body: {
        "emotion": "happy",            // required
        "context": { ... },            // optional overrides
        "preferences": { ... },        // optional overrides
        "types": ["music","exercise","quote","meditation","activity"]  // optional filter
    }
    """
    emotion_raw = request.data.get('emotion', 'neutral')
    emotion = EMOTION_MAP.get(emotion_raw.lower(), emotion_raw.lower())

    extra_context = request.data.get('context', {})
    extra_prefs = request.data.get('preferences', {})
    requested_types = request.data.get('types', None)  # None = all

    # Merge saved user prefs with any overrides from request
    saved_prefs = _get_user_preferences(request.user)
    merged_prefs = {**saved_prefs, **extra_prefs}

    # Auto-build context and merge
    auto_context = _build_context()
    merged_context = {**auto_context, **extra_context}

    # Map types array to include_* flags for the microservice
    type_flags = {}
    if requested_types:
        all_types = ['music', 'exercise', 'activity', 'quote', 'meditation']
        for t in all_types:
            type_flags[f'include_{t}'] = t in requested_types

    payload = {
        'user_id': str(request.user.id),
        'emotion': emotion,
        'preferences': merged_prefs,
        'context': merged_context,
        **type_flags,
    }

    # Pass through optional limit parameters
    if 'music_limit' in request.data:
        payload['music_limit'] = int(request.data['music_limit'])
    if 'exercise_limit' in request.data:
        payload['exercise_limit'] = int(request.data['exercise_limit'])

    try:
        url = f"{RECOMMENDATION_MICROSERVICE_URL}/recommend"
        resp = requests.post(url, json=payload, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        recommendations = data.get('recommendations', {})

        return Response({
            'recommendation_id': data.get('recommendation_id', ''),
            'emotion': emotion,
            'recommendations': recommendations,
            'preferences_used': merged_prefs,
            'personalization_applied': data.get('personalization_applied', {}),
        }, status=status.HTTP_200_OK)

    except requests.exceptions.Timeout:
        logger.error("Timeout calling recommendation microservice")
        return Response(
            {'error': 'Recommendation service timed out. Please try again.'},
            status=status.HTTP_504_GATEWAY_TIMEOUT,
        )
    except requests.exceptions.ConnectionError:
        logger.error("Cannot connect to recommendation microservice")
        return Response(
            {'error': 'Recommendation service is not available. Make sure it is running on port 5001.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    except requests.exceptions.RequestException as e:
        logger.error(f"Error calling recommendation microservice: {e}")
        return Response(
            {'error': f'Recommendation service error: {str(e)}'},
            status=status.HTTP_502_BAD_GATEWAY,
        )
    except Exception as e:
        logger.error(f"Unexpected error fetching recommendations: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_feedback(request):
    """
    Forward user feedback to the recommendation microservice
    so it can improve future recommendations.

    POST /api/recommendations/feedback/
    Body: {
        "recommendation_id": "...",
        "recommendation_type": "music",  // music / exercise / quote / meditation / activity
        "item_id": "spotify_track_id",   // ID of the specific item
        "feedback_type": "like",         // like / dislike / skip / complete
        "rating": 5                      // optional 1-5
    }
    """
    payload = {
        'user_id': str(request.user.id),
        'recommendation_id': request.data.get('recommendation_id', ''),
        'recommendation_type': request.data.get('recommendation_type', ''),
        'item_id': request.data.get('item_id', ''),
        'feedback_type': request.data.get('feedback_type', ''),
        'rating': request.data.get('rating'),
    }

    try:
        url = f"{RECOMMENDATION_MICROSERVICE_URL}/feedback"
        resp = requests.post(url, json=payload, timeout=10)
        resp.raise_for_status()
        return Response(resp.json(), status=status.HTTP_200_OK)

    except requests.exceptions.RequestException as e:
        logger.error(f"Error sending feedback to microservice: {e}")
        return Response(
            {'error': 'Could not send feedback. Please try again later.'},
            status=status.HTTP_502_BAD_GATEWAY,
        )
    except Exception as e:
        logger.error(f"Unexpected error sending feedback: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recommendation_history(request):
    """
    Get the user's recommendation history from the microservice.

    GET /api/recommendations/history/
    """
    try:
        url = f"{RECOMMENDATION_MICROSERVICE_URL}/history/{request.user.id}"
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        return Response(resp.json(), status=status.HTTP_200_OK)

    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching recommendation history: {e}")
        return Response(
            {'error': 'Could not load history.'},
            status=status.HTTP_502_BAD_GATEWAY,
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recommendation_patterns(request):
    """
    Get the user's recommendation usage patterns from the microservice.

    GET /api/recommendations/patterns/
    """
    try:
        url = f"{RECOMMENDATION_MICROSERVICE_URL}/patterns/{request.user.id}"
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        return Response(resp.json(), status=status.HTTP_200_OK)

    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching recommendation patterns: {e}")
        return Response(
            {'error': 'Could not load patterns.'},
            status=status.HTTP_502_BAD_GATEWAY,
        )
