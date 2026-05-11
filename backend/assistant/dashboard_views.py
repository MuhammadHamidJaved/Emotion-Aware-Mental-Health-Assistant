"""
Dashboard API endpoints for statistics and analytics
"""
import logging
from datetime import timedelta

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .analytics_constants import DASHBOARD_EMOTION_TO_VALENCE_AROUSAL
from .repositories.entry_analytics_repository import EntryAnalyticsRepository
from .services.response_helpers import ok_response

logger = logging.getLogger(__name__)

try:
    from emotions.models import EmotionDetection
except ImportError as e:
    logger.error(f"Import error: {e}")
    EmotionDetection = None


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Get dashboard statistics for the authenticated user
    GET /api/dashboard/stats/
    
    Returns:
    - total_entries: Total journal entries count
    - current_streak: Current daily streak
    - dominant_emotion: Most frequent emotion in recent entries
    - ml_predictions_count: Total emotion detections (for ML predictions count)
    """
    user = request.user
    
    # Total entries count
    total_entries = EntryAnalyticsRepository.get_total_entries(user)
    
    # Calculate current streak (consecutive days with at least one entry)
    # Optimized: Get all entry dates at once, then calculate streak in Python
    streak = 0
    current_date = timezone.now().date()
    
    # Get all entry dates for the user (last 365 days to limit query)
    entry_dates = EntryAnalyticsRepository.get_entry_dates_since(
        user=user,
        start_date=current_date - timedelta(days=365),
    )
    
    # Calculate streak by checking consecutive days
    # Start from today, but if no entry today, start from yesterday (give user until end of day)
    check_date = current_date
    if check_date not in entry_dates:
        # No entry today, check if there's an entry yesterday
        check_date = current_date - timedelta(days=1)
        if check_date not in entry_dates:
            # Streak is broken (no entry today or yesterday)
            streak = 0
            check_date = None
    
    # Count consecutive days backwards
    while check_date and check_date in entry_dates:
        streak += 1
        check_date -= timedelta(days=1)
    
    # Get dominant emotion from recent entries (last 30 days)
    # Optimized: Use database aggregation instead of loading all entries
    dominant_emotion = 'neutral'
    try:
        dominant_emotion = EntryAnalyticsRepository.get_dominant_emotion_since(
            user=user,
            start_date=timezone.now() - timedelta(days=30),
            default='neutral',
        )
    except Exception as e:
        # Field doesn't exist yet, use default
        logger.warning(f"Emotion field not available yet: {e}")
        dominant_emotion = 'neutral'
    
    # ML predictions count (total emotion detections)
    # First try to count EmotionDetection records
    ml_predictions_count = EntryAnalyticsRepository.get_ml_predictions_count(
        user=user,
        emotion_detection_model=EmotionDetection,
    )
    
    return ok_response({
        'total_entries': total_entries,
        'current_streak': streak,
        'dominant_emotion': dominant_emotion,
        'ml_predictions_count': ml_predictions_count
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mood_trend(request):
    """
    Get mood trend data for the last 7 days
    GET /api/dashboard/mood-trend/?days=7
    
    Returns array of daily mood data:
    - date: Date string
    - avgValence: Average valence score (0-10)
    - avgArousal: Average arousal score (0-10)
    """
    user = request.user
    days = int(request.query_params.get('days', 7))
    
    # Get entries/detections and grouped maps from repository.
    start_date = timezone.now() - timedelta(days=days)
    detections_by_date, entries_by_date = EntryAnalyticsRepository.get_mood_trend_source_data(
        user=user,
        start_date=start_date,
        emotion_detection_model=EmotionDetection,
    )
    
    # Emotion mapping for fallback calculation
    emotion_to_valence_arousal = DASHBOARD_EMOTION_TO_VALENCE_AROUSAL
    
    # Build result for each day
    result = []
    for i in range(days):
        date = (timezone.now() - timedelta(days=days - 1 - i)).date()
        
        day_detections = detections_by_date.get(date, [])
        day_entries = entries_by_date.get(date, [])
        
        if day_detections:
            # Calculate average from detections
            valences = [d.valence for d in day_detections if d.valence is not None]
            arousals = [d.arousal for d in day_detections if d.arousal is not None]
            
            if valences and arousals:
                avg_valence = sum(valences) / len(valences)
                avg_arousal = sum(arousals) / len(arousals)
                valence_0_10 = ((avg_valence + 1) / 2) * 10
                arousal_0_10 = avg_arousal * 10
                
                result.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'avgValence': round(valence_0_10, 2),
                    'avgArousal': round(arousal_0_10, 2)
                })
            else:
                # No valid detection data, use neutral
                result.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'avgValence': 5.0,
                    'avgArousal': 5.0
                })
        elif day_entries:
            # Fallback: calculate from entry emotions
            valences = []
            arousals = []
            for entry in day_entries:
                emotion_lower = entry.emotion.lower() if entry.emotion else 'neutral'
                base_valence, base_arousal = emotion_to_valence_arousal.get(emotion_lower, (0.0, 0.5))
                confidence = entry.emotion_confidence if entry.emotion_confidence else 0.5
                valences.append(base_valence * confidence)
                arousals.append(base_arousal * confidence)
            
            if valences:
                avg_valence = sum(valences) / len(valences)
                avg_arousal = sum(arousals) / len(arousals)
                valence_0_10 = ((avg_valence + 1) / 2) * 10
                arousal_0_10 = avg_arousal * 10
                
                result.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'avgValence': round(valence_0_10, 2),
                    'avgArousal': round(arousal_0_10, 2)
                })
            else:
                result.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'avgValence': 5.0,
                    'avgArousal': 5.0
                })
        else:
            # No data for this day, return neutral values
            result.append({
                'date': date.strftime('%Y-%m-%d'),
                'avgValence': 5.0,
                'avgArousal': 5.0
            })
    
    return ok_response(result)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def emotion_distribution(request):
    """
    Get emotion distribution data for pie chart
    GET /api/dashboard/emotion-distribution/?days=30
    
    Returns array of emotions with counts:
    - emotion: Emotion name
    - count: Number of occurrences
    """
    user = request.user
    days = int(request.query_params.get('days', 30))
    
    # Get entries from last N days
    start_date = timezone.now() - timedelta(days=days)
    
    try:
        result = EntryAnalyticsRepository.get_emotion_distribution(user=user, start_date=start_date)
        
        logger.info(f"Emotion distribution for user {user.id}: {result}")
        return ok_response(result)
    except Exception as e:
        # Field doesn't exist yet, return empty array
        logger.warning(f"Emotion field not available yet: {e}")
        return ok_response([])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recent_entries(request):
    """
    Get recent journal entries for dashboard
    GET /api/dashboard/recent-entries/?limit=5
    
    Returns array of recent entries with basic info
    """
    try:
        user = request.user
        limit = int(request.query_params.get('limit', 5))
        
        entries = EntryAnalyticsRepository.get_recent_entries_for_user(user=user, limit=limit)
        
        # Optimized: Get all emotion detections in one query to avoid N+1
        entry_ids = [entry.id for entry in entries]
        detections = EntryAnalyticsRepository.get_latest_detections_for_entry_ids(
            entry_ids=entry_ids,
            emotion_detection_model=EmotionDetection,
        )
        
        result = []
        for entry in entries:
            try:
                # Get emotion detection confidence if exists (from prefetched data)
                detection = detections.get(entry.id)
                confidence = int(detection.confidence * 100) if detection and detection.confidence else None
                
                # Get preview text - handle both encrypted and plain text gracefully
                try:
                    text_content = entry.get_text_content() or ''
                except Exception as decrypt_error:
                    logger.warning(f"Could not decrypt text for entry {entry.id}: {decrypt_error}")
                    text_content = ''
                
                if text_content and len(text_content) > 100:
                    preview = text_content[:100] + '...'
                else:
                    preview = text_content if text_content else 'No content'
                
                # Get emotion - handle case where emotion field might not exist yet (before migration)
                # Use getattr with default to safely access emotion field
                emotion = getattr(entry, 'emotion', None) or 'neutral'
                
                # Format date
                if hasattr(entry.entry_date, 'strftime'):
                    date_str = entry.entry_date.strftime('%Y-%m-%d')
                else:
                    date_str = str(entry.entry_date)[:10] if entry.entry_date else ''
                
                result.append({
                    'id': entry.id,
                    'date': date_str,
                    'emotion': emotion,
                    'preview': preview,
                    'confidence': confidence,
                    'type': entry.entry_type
                })
            except Exception as e:
                # Log but continue - we want to show what we can
                logger.warning(f"Error processing entry {entry.id}: {str(e)}")
                # Still add the entry with minimal data
                try:
                    result.append({
                        'id': entry.id,
                        'date': str(entry.entry_date)[:10] if entry.entry_date else '',
                        'emotion': getattr(entry, 'emotion', 'neutral'),
                        'preview': 'Content unavailable',
                        'confidence': None,
                        'type': getattr(entry, 'entry_type', 'text')
                    })
                except:
                    continue
        
        return ok_response(result)
    except Exception as e:
        import traceback
        error_msg = str(e)
        logger.error(f"Error in recent_entries endpoint: {error_msg}")
        traceback.print_exc()
        # Return empty array instead of error if there's an issue, so dashboard still loads
        return ok_response([])

