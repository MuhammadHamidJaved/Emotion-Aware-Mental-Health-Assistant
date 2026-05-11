"""
API views for check-in entries
"""
import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import CheckInEntry
from .serializers import (
    CheckInEntrySerializer,
    CheckInEntryCreateSerializer,
    EmotionImageRequestSerializer,
    EmotionTextRequestSerializer,
)
from .services import microservice_clients
from .services.entry_service import EntryService
from .services.entry_side_effects_service import EntrySideEffectsService
from .services.recommendation_side_effects_service import RecommendationSideEffectsService
from .services.response_helpers import api_response, created_response, error_response, no_content_response, ok_response

logger = logging.getLogger(__name__)

# Import notification service
try:
    from recommendations.notification_service import NotificationService
except ImportError:
    logger.warning("NotificationService not available")
    NotificationService = None

# Import recommendation storage service
try:
    from recommendations.recommendation_service import RecommendationStorageService
except ImportError:
    logger.warning("RecommendationStorageService not available")
    RecommendationStorageService = None

# Import EmotionDetection model
try:
    from emotions.models import EmotionDetection
except ImportError:
    logger.warning("EmotionDetection model not available")
    EmotionDetection = None


def call_emotion_microservice(image_data_base64: str) -> dict:
    return microservice_clients.call_emotion_microservice(image_data_base64)


def call_emotion_7class_microservice(image_data_base64: str) -> dict:
    return microservice_clients.call_emotion_7class_microservice(image_data_base64)


def call_text_emotion_microservice(text: str) -> dict:
    return microservice_clients.call_text_emotion_microservice(text)


def call_voice_emotion_microservice(uploaded_file) -> dict:
    return microservice_clients.call_voice_emotion_microservice(uploaded_file)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def detect_emotion_from_image(request):
    """
    Detect emotion from an image (base64) using the microservice
    POST /api/assistant/emotion/detect/
    
    Body: {
        "image_data": "base64_encoded_image_string"
    }
    """
    request_serializer = EmotionImageRequestSerializer(data=request.data)
    if not request_serializer.is_valid():
        return api_response(request_serializer.errors, status.HTTP_400_BAD_REQUEST)
    image_data = request_serializer.validated_data['image_data']
    
    # Call emotion detection microservice
    result = call_emotion_microservice(image_data)
    
    if result is None:
        return error_response('Failed to detect emotion. Please try again.', status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    predicted_emotion = result['predicted_emotion']
    
    # Get recommendations based on detected emotion
    emotion_mapping = {
        'happy': 'happy',
        'sad': 'sad',
        'angry': 'angry',
        'anxious': 'anxious',
        'calm': 'calm',
        'neutral': 'neutral',
        'excited': 'happy',
        'frustrated': 'angry',
        'tired': 'sad',
        'confident': 'happy',
        'loved': 'happy',
        'fearful': 'anxious',
        'disgusted': 'angry',
        'disappointed': 'sad',
        'surprised': 'happy',
        'energetic': 'happy'
    }
    recommendations_data = RecommendationSideEffectsService.fetch_recommendations_for_detected_emotion(
        user=request.user,
        predicted_emotion=predicted_emotion,
        confidence=result['confidence'],
        detection_method='facial_recognition',
        emotion_mapping=emotion_mapping,
        notification_service=NotificationService,
        recommendation_storage_service=RecommendationStorageService,
    )
    
    # Build response
    response_data = {
        'success': True,
        'predicted_emotion': predicted_emotion,
        'confidence': result['confidence'],
        'all_scores': result['all_scores'],
        'top_3': result['top_3'],
        'processing_time_ms': result['processing_time_ms']
    }
    
    # Add recommendations if available
    if recommendations_data and isinstance(recommendations_data, dict):
        response_data['recommendations'] = recommendations_data.get('recommendations', {})
    else:
        # Include empty recommendations object so frontend doesn't break
        response_data['recommendations'] = {}
        logger.warning(f"Recommendations not available for emotion {predicted_emotion}. Recommendation microservice may be unavailable.")
    
    return ok_response(response_data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def detect_emotion_from_image_7class(request):
    """
    Detect emotion from an image (base64) using the 7-class emotion microservice
    This uses the new microservice with better accuracy (7 emotions: angry, disgust, fear, happy, neutral, sad, surprise)
    POST /api/assistant/emotion/detect/7class/
    
    Body: {
        "image_data": "base64_encoded_image_string"
    }
    """
    request_serializer = EmotionImageRequestSerializer(data=request.data)
    if not request_serializer.is_valid():
        return api_response(request_serializer.errors, status.HTTP_400_BAD_REQUEST)
    image_data = request_serializer.validated_data['image_data']
    
    # Call 7-class emotion detection microservice
    result = call_emotion_7class_microservice(image_data)
    
    if result is None:
        logger.error(f"7-class emotion detection failed for user {request.user.id}")
        return error_response(
            'Failed to detect emotion. Please ensure the 7-class emotion microservice is running on port 5002.',
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            details='The emotion detection service may be unavailable or there was an error processing the image.'
        )
    
    predicted_emotion = result['predicted_emotion']
    
    # Get recommendations based on detected emotion
    emotion_mapping = {
        'happy': 'happy',
        'sad': 'sad',
        'angry': 'angry',
        'disgust': 'angry',
        'fear': 'anxious',
        'neutral': 'neutral',
        'surprise': 'happy',
        'surprised': 'happy',
        'fearful': 'anxious',
        'disgusted': 'angry'
    }
    recommendations_data = RecommendationSideEffectsService.fetch_recommendations_for_detected_emotion(
        user=request.user,
        predicted_emotion=predicted_emotion,
        confidence=result['confidence'],
        detection_method='facial_recognition_7class',
        emotion_mapping=emotion_mapping,
        notification_service=NotificationService,
        recommendation_storage_service=RecommendationStorageService,
    )
    
    # Build response
    response_data = {
        'success': True,
        'predicted_emotion': predicted_emotion,
        'confidence': result['confidence'],
        'all_scores': result['all_scores'],
        'top_3': result['top_3'],
        'processing_time_ms': result['processing_time_ms'],
        'num_faces': result.get('num_faces', 0),
        'model_type': '7class'  # Indicate this is from the 7-class model
    }
    
    # Add recommendations if available
    if recommendations_data and isinstance(recommendations_data, dict):
        response_data['recommendations'] = recommendations_data.get('recommendations', {})
    else:
        # Include empty recommendations object so frontend doesn't break
        response_data['recommendations'] = {}
        logger.warning(f"Recommendations not available for emotion {predicted_emotion}. Recommendation microservice may be unavailable.")
    
    return ok_response(response_data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def detect_emotion_from_text(request):
    """
    Detect emotion from text using the text emotion microservice
    POST /api/assistant/emotion/detect/text/
    
    Body: {
        "text": "text string to analyze"
    }
    """
    request_serializer = EmotionTextRequestSerializer(data=request.data)
    if not request_serializer.is_valid():
        return api_response(request_serializer.errors, status.HTTP_400_BAD_REQUEST)
    text = request_serializer.validated_data['text']
    
    # Call text emotion detection microservice
    result = call_text_emotion_microservice(text)
    
    if result is None:
        return error_response('Failed to detect emotion. Please try again.', status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    predicted_emotion = result['predicted_emotion']
    
    # Get recommendations based on detected emotion
    emotion_mapping = {
        'happy': 'happy',
        'sad': 'sad',
        'angry': 'angry',
        'anxious': 'anxious',
        'calm': 'calm',
        'neutral': 'neutral',
        'excited': 'happy',
        'frustrated': 'angry',
        'tired': 'sad',
        'confident': 'happy',
        'loved': 'happy',
        'fearful': 'anxious',
        'disgusted': 'angry',
        'disappointed': 'sad',
        'surprised': 'happy',
        'energetic': 'happy',
        'grateful': 'happy',
        'contempt': 'angry'
    }
    recommendations_data = RecommendationSideEffectsService.fetch_recommendations_for_detected_emotion(
        user=request.user,
        predicted_emotion=predicted_emotion,
        confidence=result['confidence'],
        detection_method='text_analysis',
        emotion_mapping=emotion_mapping,
        notification_service=NotificationService,
        recommendation_storage_service=RecommendationStorageService,
    )
    
    # Build response
    response_data = {
        'success': True,
        'predicted_emotion': predicted_emotion,
        'confidence': result['confidence'],
        'all_scores': result['all_scores'],
        'top_3': result['top_3'],
        'processing_time_ms': result.get('processing_time_ms', 0),
        'original_label': result.get('original_label', '')
    }
    
    # Add recommendations if available
    if recommendations_data and isinstance(recommendations_data, dict):
        response_data['recommendations'] = recommendations_data.get('recommendations', {})
    else:
        # Include empty recommendations object so frontend doesn't break
        response_data['recommendations'] = {}
        logger.warning(f"Recommendations not available for emotion {predicted_emotion}. Recommendation microservice may be unavailable.")
    
    return ok_response(response_data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def detect_emotion_from_audio(request):
    """
    Detect emotion from an audio clip via the voice emotion microservice (port 5003).
    POST /api/assistant/emotion/detect/audio/

    Body: multipart/form-data with field ``file`` (e.g. webm from MediaRecorder).
    """
    audio_file = request.FILES.get('file')
    if not audio_file:
        return error_response('Missing audio file. Use form field "file".', status.HTTP_400_BAD_REQUEST)

    result = call_voice_emotion_microservice(audio_file)

    if result is None:
        return error_response(
            'Failed to detect emotion from audio. Ensure the voice emotion microservice is running on port 5003.',
            status.HTTP_503_SERVICE_UNAVAILABLE,
            details='The service may be starting, the model may not be loaded, or the audio could not be processed.',
        )

    predicted_emotion = result['predicted_emotion']

    emotion_mapping = {
        'happy': 'happy',
        'sad': 'sad',
        'angry': 'angry',
        'anxious': 'anxious',
        'calm': 'calm',
        'neutral': 'neutral',
        'excited': 'happy',
        'frustrated': 'angry',
        'tired': 'sad',
        'confident': 'happy',
        'loved': 'happy',
        'fearful': 'anxious',
        'disgusted': 'angry',
        'disappointed': 'sad',
        'surprised': 'happy',
        'energetic': 'happy',
        'grateful': 'happy',
        'contempt': 'angry',
    }
    recommendations_data = RecommendationSideEffectsService.fetch_recommendations_for_detected_emotion(
        user=request.user,
        predicted_emotion=predicted_emotion,
        confidence=result['confidence'],
        detection_method='voice_audio',
        emotion_mapping=emotion_mapping,
        notification_service=NotificationService,
        recommendation_storage_service=RecommendationStorageService,
    )

    response_data = {
        'success': True,
        'predicted_emotion': predicted_emotion,
        'confidence': result['confidence'],
        'all_scores': result['all_scores'],
        'top_3': result['top_3'],
        'processing_time_ms': result.get('processing_time_ms', 0),
    }

    if recommendations_data and isinstance(recommendations_data, dict):
        response_data['recommendations'] = recommendations_data.get('recommendations', {})
    else:
        response_data['recommendations'] = {}
        logger.warning(
            f"Recommendations not available for voice emotion {predicted_emotion}. Recommendation microservice may be unavailable."
        )

    return ok_response(response_data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def entries_list_or_create(request):
    """
    List all check-in entries or create a new one
    GET /api/assistant/entries/ - List entries
    POST /api/assistant/entries/ - Create entry (supports multipart/form-data for file uploads)
    """
    if request.method == 'GET':
        entry_type = request.query_params.get('type')
        emotion = request.query_params.get('emotion')
        entries = EntryService.list_entries_for_user(
            user=request.user,
            entry_type=entry_type,
            emotion=emotion,
        )
        
        serializer = CheckInEntrySerializer(entries, many=True)
        return ok_response(serializer.data)
    
    elif request.method == 'POST':
        serializer = CheckInEntryCreateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return api_response(serializer.errors, status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validated_data

        entry, media_error = EntryService.create_entry(request.user, validated_data)
        if media_error:
            return error_response(media_error, status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        EntrySideEffectsService.handle_post_create_side_effects(
            entry=entry,
            user=request.user,
            emotion_detection_model=EmotionDetection,
            notification_service=NotificationService,
        )
        
        response_serializer = CheckInEntrySerializer(entry)
        return created_response(response_serializer.data)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def entry_detail_update_delete(request, entry_id):
    """
    Get, update, or delete a check-in entry
    GET /api/assistant/entries/{id}/ - Get entry
    PUT/PATCH /api/assistant/entries/{id}/ - Update entry
    DELETE /api/assistant/entries/{id}/ - Delete entry
    """
    entry = EntryService.get_entry_for_user(request.user, entry_id)
    if not entry:
        return error_response('Entry not found', status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = CheckInEntrySerializer(entry)
        return ok_response(serializer.data)
    
    elif request.method in ['PUT', 'PATCH']:
        serializer = CheckInEntryCreateSerializer(data=request.data, partial=True)
        
        if not serializer.is_valid():
            return api_response(serializer.errors, status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validated_data
        entry = EntryService.update_entry(request.user, entry, validated_data)
        
        response_serializer = CheckInEntrySerializer(entry)
        return ok_response(response_serializer.data)
    
    elif request.method == 'DELETE':
        EntryService.delete_entry(entry)
        return no_content_response()
