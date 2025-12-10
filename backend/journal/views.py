"""
API views for journal entries
"""
import logging
import requests
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import JournalEntry, EntryTag, EntryTagRelation
from .serializers import JournalEntrySerializer, JournalEntryCreateSerializer

logger = logging.getLogger(__name__)

# Import notification service
try:
    from recommendations.notification_service import NotificationService
except ImportError:
    logger.warning("NotificationService not available")
    NotificationService = None

# Import EmotionDetection model
try:
    from emotions.models import EmotionDetection
except ImportError:
    logger.warning("EmotionDetection model not available")
    EmotionDetection = None

# Microservice base URLs - can be configured in settings
EMOTION_MICROSERVICE_URL = getattr(settings, 'EMOTION_MICROSERVICE_URL', 'http://localhost:8001')
RECOMMENDATION_MICROSERVICE_URL = getattr(settings, 'RECOMMENDATION_MICROSERVICE_URL', 'http://localhost:5000/api')
TEXT_EMOTION_MICROSERVICE_URL = getattr(settings, 'TEXT_EMOTION_MICROSERVICE_URL', 'http://localhost:5001')


def call_emotion_microservice(image_data_base64: str) -> dict:
    """
    Call the facial recognition microservice to detect emotion from base64 image
    
    Args:
        image_data_base64: Base64 encoded image string
        
    Returns:
        dict with emotion prediction results or None if error
    """
    try:
        url = f"{EMOTION_MICROSERVICE_URL}/predict/base64"
        payload = {
            "image_data": image_data_base64
        }
        
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
        else:
            logger.error(f"Microservice returned error: {data.get('error')}")
            return None
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Error calling emotion microservice: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error in emotion microservice call: {str(e)}")
        return None


def call_text_emotion_microservice(text: str) -> dict:
    """
    Call the text emotion detection microservice to detect emotion from text
    
    Args:
        text: Text string to analyze
        
    Returns:
        dict with emotion prediction results or None if error
    """
    try:
        url = f"{TEXT_EMOTION_MICROSERVICE_URL}/v1/predict"
        payload = {
            "text": text
        }
        
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        # Map microservice emotion labels to our emotion format
        # The microservice returns labels like 'joy', 'sadness', 'anger', etc.
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
        
        # Get the predicted label from microservice
        predicted_label = data.get('label', '').lower()
        mapped_emotion = emotion_mapping.get(predicted_label, 'neutral')
        
        # Get confidence score
        confidence = data.get('score', 0.0)
        
        # Get all scores from metadata if available
        all_scores = {}
        if 'metadata' in data and 'all_scores' in data['metadata']:
            for emotion_label, score in data['metadata']['all_scores'].items():
                mapped = emotion_mapping.get(emotion_label.lower(), emotion_label.lower())
                all_scores[mapped] = score
        
        # If no all_scores, create a simple one with the dominant emotion
        if not all_scores:
            all_scores[mapped_emotion] = confidence
        
        return {
            'predicted_emotion': mapped_emotion,
            'confidence': confidence,
            'all_scores': all_scores,
            'top_3': sorted(all_scores.items(), key=lambda x: x[1], reverse=True)[:3],
            'processing_time_ms': 0,  # Microservice doesn't return this
            'original_label': predicted_label
        }
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Error calling text emotion microservice: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error in text emotion microservice call: {str(e)}")
        return None


def call_recommendation_microservice(user_id: str, emotion: str, context: dict = None) -> dict:
    """
    Call the recommendation microservice to get mood-based recommendations
    
    Args:
        user_id: User identifier
        emotion: Detected emotion (happy, sad, angry, anxious, calm, neutral)
        context: Optional context dictionary (time_of_day, etc.)
        
    Returns:
        dict with recommendations or None if error
    """
    try:
        url = f"{RECOMMENDATION_MICROSERVICE_URL}/recommend"
        payload = {
            "user_id": str(user_id),
            "emotion": emotion.lower(),
            "context": context or {}
        }
        
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        if data.get('recommendations'):
            logger.info(f"Successfully fetched recommendations for emotion: {emotion}")
            # Log music data structure for debugging
            music_data = data.get('recommendations', {}).get('music', {})
            logger.info(f"Music data structure: {type(music_data)}, keys: {music_data.keys() if isinstance(music_data, dict) else 'N/A'}")
            if isinstance(music_data, dict) and music_data.get('tracks'):
                logger.info(f"Number of tracks: {len(music_data.get('tracks', []))}")
            return data
        else:
            logger.warning(f"Recommendation service returned empty recommendations")
            return None
            
    except requests.exceptions.Timeout:
        logger.error(f"Timeout calling recommendation microservice")
        return None
    except requests.exceptions.RequestException as e:
        logger.error(f"Error calling recommendation microservice: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error in recommendation microservice call: {str(e)}")
        return None


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def detect_emotion_from_image(request):
    """
    Detect emotion from an image (base64) using the microservice
    POST /api/journal/emotion/detect/
    
    Body: {
        "image_data": "base64_encoded_image_string"
    }
    """
    image_data = request.data.get('image_data')
    
    if not image_data:
        return Response(
            {'error': 'image_data is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Call emotion detection microservice
    result = call_emotion_microservice(image_data)
    
    if result is None:
        return Response(
            {'error': 'Failed to detect emotion. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    predicted_emotion = result['predicted_emotion']
    
    # Get recommendations based on detected emotion
    recommendations_data = None
    try:
        # Map emotion to microservice format (happy, sad, angry, anxious, calm, neutral)
        emotion_mapping = {
            'happy': 'happy',
            'sad': 'sad',
            'angry': 'angry',
            'anxious': 'anxious',
            'calm': 'calm',
            'neutral': 'neutral',
            'excited': 'happy',  # Map similar emotions
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
        
        mapped_emotion = emotion_mapping.get(predicted_emotion.lower(), 'neutral')
        
        # Get time of day for context
        from datetime import datetime
        current_hour = datetime.now().hour
        if 5 <= current_hour < 12:
            time_of_day = 'morning'
        elif 12 <= current_hour < 17:
            time_of_day = 'afternoon'
        elif 17 <= current_hour < 21:
            time_of_day = 'evening'
        else:
            time_of_day = 'night'
        
        context = {
            'time_of_day': time_of_day,
            'confidence': result['confidence'],
            'detection_method': 'facial_recognition'
        }
        
        recommendations_data = call_recommendation_microservice(
            user_id=str(request.user.id),
            emotion=mapped_emotion,
            context=context
        )
        
        # Store recommendations and create notification if available
        if recommendations_data and NotificationService:
            try:
                # Create notification for recommendations
                if NotificationService.should_send_notification(request.user, 'recommendation'):
                    recommendation_text = "Based on your detected emotion, we have personalized recommendations for you!"
                    if recommendations_data.get('recommendations', {}).get('quote'):
                        recommendation_text += f" \"{recommendations_data['recommendations']['quote'][:100]}...\""
                    
                    NotificationService.create_recommendation_notification(
                        user=request.user,
                        recommendation_title=f"Recommendations for {predicted_emotion} mood",
                        recommendation_id=None
                    )
            except Exception as e:
                logger.error(f"Error creating recommendation notification: {e}")
                
    except Exception as e:
        logger.error(f"Error fetching recommendations: {e}")
        # Don't fail the emotion detection if recommendations fail
    
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
    if recommendations_data:
        response_data['recommendations'] = recommendations_data.get('recommendations', {})
    
    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def detect_emotion_from_text(request):
    """
    Detect emotion from text using the text emotion microservice
    POST /api/journal/emotion/detect/text/
    
    Body: {
        "text": "text string to analyze"
    }
    """
    text = request.data.get('text', '').strip()
    
    if not text:
        return Response(
            {'error': 'text is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if len(text) < 1:
        return Response(
            {'error': 'text must be at least 1 character'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Call text emotion detection microservice
    result = call_text_emotion_microservice(text)
    
    if result is None:
        return Response(
            {'error': 'Failed to detect emotion. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    predicted_emotion = result['predicted_emotion']
    
    # Get recommendations based on detected emotion
    recommendations_data = None
    try:
        # Map emotion to recommendation microservice format
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
        
        mapped_emotion = emotion_mapping.get(predicted_emotion.lower(), 'neutral')
        
        # Get time of day for context
        from datetime import datetime
        current_hour = datetime.now().hour
        if 5 <= current_hour < 12:
            time_of_day = 'morning'
        elif 12 <= current_hour < 17:
            time_of_day = 'afternoon'
        elif 17 <= current_hour < 21:
            time_of_day = 'evening'
        else:
            time_of_day = 'night'
        
        context = {
            'time_of_day': time_of_day,
            'confidence': result['confidence'],
            'detection_method': 'text_analysis'
        }
        
        recommendations_data = call_recommendation_microservice(
            user_id=str(request.user.id),
            emotion=mapped_emotion,
            context=context
        )
        
        # Store recommendations and create notification if available
        if recommendations_data and NotificationService:
            try:
                # Create notification for recommendations
                if NotificationService.should_send_notification(request.user, 'recommendation'):
                    recommendation_text = "Based on your detected emotion, we have personalized recommendations for you!"
                    if recommendations_data.get('recommendations', {}).get('quote'):
                        recommendation_text += f" \"{recommendations_data['recommendations']['quote'][:100]}...\""
                    
                    NotificationService.create_recommendation_notification(
                        user=request.user,
                        recommendation_title=f"Recommendations for {predicted_emotion} mood",
                        recommendation_id=None
                    )
            except Exception as e:
                logger.error(f"Error creating recommendation notification: {e}")
                
    except Exception as e:
        logger.error(f"Error fetching recommendations: {e}")
        # Don't fail the emotion detection if recommendations fail
    
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
    if recommendations_data:
        response_data['recommendations'] = recommendations_data.get('recommendations', {})
    
    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def entries_list_or_create(request):
    """
    List all journal entries or create a new one
    GET /api/journal/entries/ - List entries
    POST /api/journal/entries/ - Create entry
    """
    if request.method == 'GET':
        entries = JournalEntry.objects.filter(user=request.user).order_by('-entry_date')
        
        # Apply filters
        entry_type = request.query_params.get('type')
        if entry_type:
            entries = entries.filter(entry_type=entry_type)
        
        emotion = request.query_params.get('emotion')
        if emotion:
            entries = entries.filter(emotion=emotion)
        
        serializer = JournalEntrySerializer(entries, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    elif request.method == 'POST':
        serializer = JournalEntryCreateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validated_data
        
        # Calculate word count from text content
        text_content = validated_data.get('text_content', '') or validated_data.get('transcription', '')
        word_count = len(text_content.split()) if text_content else 0
        
        # Normalize emotion to lowercase for consistency
        emotion = validated_data.get('emotion', '')
        if emotion:
            emotion = emotion.lower().strip()
        
        # Create journal entry
        entry = JournalEntry.objects.create(
            user=request.user,
            entry_type=validated_data['entry_type'],
            title=validated_data.get('title', ''),
            text_content=validated_data.get('text_content', ''),
            transcription=validated_data.get('transcription', ''),
            emotion=emotion,
            emotion_confidence=validated_data.get('emotion_confidence'),
            word_count=word_count,
            duration=validated_data.get('duration', 0),
            is_favorite=validated_data.get('is_favorite', False),
            is_draft=validated_data.get('is_draft', False),
            entry_date=validated_data.get('entry_date', timezone.now())
        )
        
        # Handle tags
        tags = validated_data.get('tags', [])
        for tag_name in tags:
            if tag_name.strip():
                tag, created = EntryTag.objects.get_or_create(
                    user=request.user,
                    name=tag_name.strip().lower(),
                    defaults={'color': '#3B82F6'}
                )
                if created:
                    tag.usage_count = 1
                else:
                    tag.usage_count += 1
                tag.save()
                
                EntryTagRelation.objects.get_or_create(
                    entry=entry,
                    tag=tag
                )
        
        # Create EmotionDetection record if emotion is detected (for ML predictions count)
        if entry.emotion and EmotionDetection:
            try:
                # Determine modality based on entry type
                modality_map = {
                    'text': 'text',
                    'voice': 'voice',
                    'video': 'facial',
                }
                modality = modality_map.get(entry.entry_type, 'text')
                
                # Get emotion confidence (default to 0.5 if not provided)
                confidence = entry.emotion_confidence if entry.emotion_confidence is not None else 0.5
                
                # Create EmotionDetection record with emotion scores
                # Initialize all emotion scores to 0
                emotion_scores = {
                    'happy': 0.0,
                    'sad': 0.0,
                    'angry': 0.0,
                    'anxious': 0.0,
                    'neutral': 0.0,
                    'surprised': 0.0,
                    'disgusted': 0.0,
                    'fearful': 0.0,
                }
                
                # Set the dominant emotion score based on confidence
                emotion_lower = entry.emotion.lower()
                if emotion_lower in emotion_scores:
                    emotion_scores[emotion_lower] = confidence
                elif emotion_lower == 'surprise':
                    emotion_scores['surprised'] = confidence
                else:
                    # For emotions not in the model, use neutral as fallback
                    emotion_scores['neutral'] = confidence
                
                # Calculate valence and arousal from emotion
                # Valence: -1 (negative) to +1 (positive)
                # Arousal: 0 (calm) to 1 (excited)
                emotion_to_valence_arousal = {
                    'happy': (0.8, 0.7),
                    'sad': (-0.6, 0.3),
                    'angry': (-0.4, 0.9),
                    'anxious': (-0.5, 0.8),
                    'calm': (0.2, 0.2),
                    'excited': (0.7, 0.9),
                    'neutral': (0.0, 0.3),
                    'surprised': (0.3, 0.9),
                    'surprise': (0.3, 0.9),
                    'fearful': (-0.7, 0.9),
                    'disgusted': (-0.5, 0.6),
                    'contempt': (-0.3, 0.4),
                    'frustrated': (-0.4, 0.8),
                    'grateful': (0.7, 0.5),
                    'loved': (0.9, 0.6),
                    'confident': (0.6, 0.7),
                    'tired': (-0.2, 0.2),
                    'lonely': (-0.5, 0.3),
                    'scared': (-0.6, 0.9),
                    'disappointed': (-0.4, 0.4),
                    'energetic': (0.6, 0.9),
                    'peaceful': (0.3, 0.2),
                }
                
                base_valence, base_arousal = emotion_to_valence_arousal.get(
                    emotion_lower, 
                    (0.0, 0.5)  # Default for unknown emotions
                )
                # Scale by confidence
                valence = base_valence * confidence
                arousal = base_arousal * confidence
                
                EmotionDetection.objects.create(
                    entry=entry,
                    modality=modality,
                    happy=emotion_scores['happy'],
                    sad=emotion_scores['sad'],
                    angry=emotion_scores['angry'],
                    anxious=emotion_scores['anxious'],
                    neutral=emotion_scores['neutral'],
                    surprised=emotion_scores['surprised'],
                    disgusted=emotion_scores['disgusted'],
                    fearful=emotion_scores['fearful'],
                    confidence=confidence,
                    valence=valence,
                    arousal=arousal
                )
                logger.info(f"Created EmotionDetection record for entry {entry.id} with emotion {entry.emotion}")
            except Exception as e:
                logger.error(f"Error creating EmotionDetection record: {e}")
                # Don't fail the entry creation if EmotionDetection creation fails
        
        # Create notifications after entry is saved
        if NotificationService:
            try:
                # Calculate current streak
                streak = 0
                current_date = timezone.now().date()
                check_date = current_date
                
                while True:
                    entries_today = JournalEntry.objects.filter(
                        user=request.user,
                        is_draft=False,
                        entry_date__date=check_date
                    ).exists()
                    
                    if entries_today:
                        streak += 1
                        check_date -= timedelta(days=1)
                    else:
                        break
                
                # Update user's streak if it's higher
                if streak > request.user.current_streak:
                    request.user.current_streak = streak
                    if streak > request.user.longest_streak:
                        request.user.longest_streak = streak
                    request.user.save()
                
                # Create streak alert notification for milestones
                # Check if notification should be sent based on user preferences
                if NotificationService.should_send_notification(request.user, 'streak_alert'):
                    # Milestone streaks: 3, 7, 14, 30, 50, 100 days
                    milestone_streaks = [3, 7, 14, 30, 50, 100]
                    if streak in milestone_streaks:
                        NotificationService.create_streak_alert(request.user, streak)
                
                # Create a simple confirmation notification if enabled
                if NotificationService.should_send_notification(request.user, 'system'):
                    NotificationService.create_notification(
                        user=request.user,
                        notification_type='system',
                        title='Entry saved successfully',
                        message=f'Your {entry.entry_type} entry has been saved.',
                        action_url=f'/check-in/{entry.id}',
                        related_object_id=entry.id
                    )
            except Exception as e:
                logger.error(f"Error creating notifications after entry save: {e}")
        
        response_serializer = JournalEntrySerializer(entry)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def entry_detail_update_delete(request, entry_id):
    """
    Get, update, or delete a journal entry
    GET /api/journal/entries/{id}/ - Get entry
    PUT/PATCH /api/journal/entries/{id}/ - Update entry
    DELETE /api/journal/entries/{id}/ - Delete entry
    """
    try:
        entry = JournalEntry.objects.get(id=entry_id, user=request.user)
    except JournalEntry.DoesNotExist:
        return Response(
            {'error': 'Entry not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        serializer = JournalEntrySerializer(entry)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    elif request.method in ['PUT', 'PATCH']:
        serializer = JournalEntryCreateSerializer(data=request.data, partial=True)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validated_data
        
        # Update fields
        if 'title' in validated_data:
            entry.title = validated_data['title']
        if 'text_content' in validated_data:
            entry.text_content = validated_data['text_content']
            entry.word_count = len(validated_data['text_content'].split())
        if 'transcription' in validated_data:
            entry.transcription = validated_data['transcription']
        if 'emotion' in validated_data:
            entry.emotion = validated_data['emotion']
        if 'emotion_confidence' in validated_data:
            entry.emotion_confidence = validated_data['emotion_confidence']
        if 'is_favorite' in validated_data:
            entry.is_favorite = validated_data['is_favorite']
        if 'is_draft' in validated_data:
            entry.is_draft = validated_data['is_draft']
        
        entry.save()
        
        # Handle tags if provided
        if 'tags' in validated_data:
            # Remove existing tags
            EntryTagRelation.objects.filter(entry=entry).delete()
            
            # Add new tags
            for tag_name in validated_data['tags']:
                if tag_name.strip():
                    tag, created = EntryTag.objects.get_or_create(
                        user=request.user,
                        name=tag_name.strip().lower(),
                        defaults={'color': '#3B82F6'}
                    )
                    if created:
                        tag.usage_count = 1
                    else:
                        tag.usage_count += 1
                    tag.save()
                    
                    EntryTagRelation.objects.get_or_create(
                        entry=entry,
                        tag=tag
                    )
        
        response_serializer = JournalEntrySerializer(entry)
        return Response(response_serializer.data, status=status.HTTP_200_OK)
    
    elif request.method == 'DELETE':
        entry.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
