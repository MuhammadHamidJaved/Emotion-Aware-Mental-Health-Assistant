"""
Settings API endpoints with AES-256 encryption
"""
import json
import logging
import re

import requests
from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.conf import settings as django_settings
from common.external_service_utils import log_external_failure, map_external_exception
from .services.settings_service import SettingsService
from .services.response_helpers import api_response, error_response, first_error_message, ok_response
from .serializers import (
    AppearanceSettingsPatchSerializer,
    NotificationSettingsPatchSerializer,
    PrivacySettingsPatchSerializer,
    ProfileSettingsPatchSerializer,
    RecommendationSettingsPatchSerializer,
)

logger = logging.getLogger(__name__)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def settings_profile(request):
    """
    Get or update user profile settings
    GET /api/settings/profile/
    PATCH /api/settings/profile/
    """
    if request.method == 'GET':
        payload = SettingsService.get_profile_settings(request.user)
        return ok_response(payload)
    
    elif request.method == 'PATCH':
        request_serializer = ProfileSettingsPatchSerializer(data=request.data, partial=True)
        if not request_serializer.is_valid():
            return error_response(first_error_message(request_serializer.errors), 400)

        payload, status_code = SettingsService.update_profile_settings(
            request.user,
            request_serializer.validated_data,
            request.FILES,
        )
        return api_response(payload, status_code)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def settings_notifications(request):
    """
    Get or update notification settings
    GET /api/settings/notifications/
    PATCH /api/settings/notifications/
    """
    if request.method == 'GET':
        payload = SettingsService.get_notification_settings(request.user)
        return ok_response(payload)
    
    elif request.method == 'PATCH':
        request_serializer = NotificationSettingsPatchSerializer(data=request.data, partial=True)
        if not request_serializer.is_valid():
            return error_response(first_error_message(request_serializer.errors), 400)

        payload, status_code = SettingsService.update_notification_settings(
            request.user,
            request_serializer.validated_data,
        )
        return api_response(payload, status_code)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def settings_privacy(request):
    """
    Get or update privacy settings
    GET /api/settings/privacy/
    PATCH /api/settings/privacy/
    """
    if request.method == 'GET':
        payload = SettingsService.get_privacy_settings(request.user)
        return ok_response(payload)
    
    elif request.method == 'PATCH':
        request_serializer = PrivacySettingsPatchSerializer(data=request.data, partial=True)
        if not request_serializer.is_valid():
            return error_response(first_error_message(request_serializer.errors), 400)

        payload, status_code = SettingsService.update_privacy_settings(
            request.user,
            request_serializer.validated_data,
        )
        return api_response(payload, status_code)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def settings_appearance(request):
    """
    Get or update appearance settings
    GET /api/settings/appearance/
    PATCH /api/settings/appearance/
    """
    if request.method == 'GET':
        payload = SettingsService.get_appearance_settings(request.user)
        return ok_response(payload)
    
    elif request.method == 'PATCH':
        request_serializer = AppearanceSettingsPatchSerializer(data=request.data, partial=True)
        if not request_serializer.is_valid():
            return error_response(first_error_message(request_serializer.errors), 400)

        payload, status_code = SettingsService.update_appearance_settings(
            request.user,
            request_serializer.validated_data,
        )
        return api_response(payload, status_code)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def settings_export_data(request):
    """
    Export user data as a downloadable JSON file.
    POST /api/settings/export-data/
    """
    from users.services.data_export_service import build_user_data_export

    payload = build_user_data_export(request.user)
    body = json.dumps(payload, indent=2, default=str)
    safe_slug = re.sub(r'[^a-zA-Z0-9_-]+', '_', request.user.email.split('@')[0])[:80] or 'user'
    filename = f'emotionai_export_{safe_slug}.json'

    response = HttpResponse(body, content_type='application/json; charset=utf-8')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def settings_delete_account(request):
    """
    Permanently delete the user account and related data (CASCADE).
    POST /api/settings/delete-account/
    """
    user = request.user
    user_id = user.pk
    user.delete()
    logger.info('User account deleted id=%s', user_id)
    return ok_response({
        'message': 'Your account and associated data have been permanently deleted.',
        'deleted': True,
    })


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def settings_recommendations(request):
    """
    Get or update recommendation personalization settings.
    These preferences are sent to the recommendation microservice
    to personalize music, exercises, quotes, and meditation suggestions.
    
    GET /api/settings/recommendations/
    PATCH /api/settings/recommendations/
    """
    if request.method == 'GET':
        payload = SettingsService.get_recommendation_settings(request.user)
        return ok_response(payload)
    
    elif request.method == 'PATCH':
        request_serializer = RecommendationSettingsPatchSerializer(data=request.data, partial=True)
        if not request_serializer.is_valid():
            return error_response(first_error_message(request_serializer.errors), 400)

        payload, status_code = SettingsService.update_recommendation_settings(
            request.user,
            request_serializer.validated_data,
        )
        return api_response(payload, status_code)


RECOMMENDATION_MICROSERVICE_URL = getattr(
    django_settings, 'RECOMMENDATION_MICROSERVICE_URL', 'http://localhost:5000/api'
)

MUSIC_LANGUAGES = [
    {'value': '', 'label': 'Any Language'},
    {'value': 'english', 'label': 'English'},
    {'value': 'hindi', 'label': 'Hindi'},
    {'value': 'urdu', 'label': 'Urdu'},
    {'value': 'punjabi', 'label': 'Punjabi'},
    {'value': 'arabic', 'label': 'Arabic'},
    {'value': 'turkish', 'label': 'Turkish'},
    {'value': 'korean', 'label': 'Korean'},
    {'value': 'japanese', 'label': 'Japanese'},
    {'value': 'spanish', 'label': 'Spanish'},
    {'value': 'french', 'label': 'French'},
    {'value': 'german', 'label': 'German'},
    {'value': 'portuguese', 'label': 'Portuguese'},
    {'value': 'bengali', 'label': 'Bengali'},
    {'value': 'tamil', 'label': 'Tamil'},
    {'value': 'telugu', 'label': 'Telugu'},
    {'value': 'chinese', 'label': 'Chinese'},
    {'value': 'italian', 'label': 'Italian'},
    {'value': 'russian', 'label': 'Russian'},
    {'value': 'thai', 'label': 'Thai'},
    {'value': 'vietnamese', 'label': 'Vietnamese'},
    {'value': 'malay', 'label': 'Malay'},
    {'value': 'indonesian', 'label': 'Indonesian'},
]

MARKETS = [
    {'code': 'US', 'name': 'United States'},
    {'code': 'GB', 'name': 'United Kingdom'},
    {'code': 'PK', 'name': 'Pakistan'},
    {'code': 'IN', 'name': 'India'},
    {'code': 'AE', 'name': 'United Arab Emirates'},
    {'code': 'SA', 'name': 'Saudi Arabia'},
    {'code': 'DE', 'name': 'Germany'},
    {'code': 'FR', 'name': 'France'},
    {'code': 'JP', 'name': 'Japan'},
    {'code': 'KR', 'name': 'South Korea'},
    {'code': 'AU', 'name': 'Australia'},
    {'code': 'CA', 'name': 'Canada'},
    {'code': 'TR', 'name': 'Turkey'},
    {'code': 'BR', 'name': 'Brazil'},
]

FITNESS_LEVELS = ['beginner', 'moderate', 'advanced']

AGE_GROUPS = [
    {'value': 'teen', 'label': 'Teen (13-17)'},
    {'value': 'young_adult', 'label': 'Young Adult (18-25)'},
    {'value': 'adult', 'label': 'Adult (26-59)'},
    {'value': 'senior', 'label': 'Senior (60+)'},
]


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def meta_recommendation_options(request):
    """
    Return valid options for recommendation personalization fields.
    Tries to fetch genres from the microservice; falls back to a hardcoded list.
    
    GET /api/settings/recommendations/options/
    """
    genres = [
        'acoustic', 'afrobeat', 'alt-rock', 'alternative', 'ambient',
        'blues', 'classical', 'chill', 'club', 'country',
        'dance', 'deep-house', 'disco', 'drum-and-bass', 'edm',
        'electronic', 'folk', 'funk', 'gospel', 'grunge',
        'hip-hop', 'house', 'indie', 'indie-pop', 'jazz',
        'k-pop', 'latin', 'lo-fi', 'metal', 'new-age',
        'opera', 'piano', 'pop', 'punk', 'r-n-b',
        'reggae', 'rock', 'romance', 'soul', 'study',
        'techno', 'trance', 'world-music',
    ]

    try:
        res = requests.get(f"{RECOMMENDATION_MICROSERVICE_URL}/meta/genres", timeout=5)
        if res.ok:
            data = res.json()
            if isinstance(data, list):
                genres = data
            elif isinstance(data, dict) and 'genres' in data:
                genres = data['genres']
    except Exception as e:
        error_info = map_external_exception(
            e,
            service_name='recommendation-microservice',
            operation='meta-genres',
            timeout_message='Recommendation metadata service timed out; using defaults.',
            connection_message='Recommendation metadata service unavailable; using defaults.',
            request_message='Recommendation metadata request failed; using defaults.',
            unexpected_message='Recommendation metadata fetch failed; using defaults.',
        )
        log_external_failure(logger, error_info, level='warning')

    return api_response({
        'music_languages': MUSIC_LANGUAGES,
        'genres': sorted(genres),
        'markets': MARKETS,
        'fitness_levels': FITNESS_LEVELS,
        'age_groups': AGE_GROUPS,
    }, 200)

