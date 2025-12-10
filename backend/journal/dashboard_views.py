"""
Dashboard API endpoints for statistics and analytics
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q, Avg, Max
from django.db.models import QuerySet
from django.utils import timezone
from datetime import timedelta
from collections import Counter
import logging

logger = logging.getLogger(__name__)

try:
    from .models import JournalEntry
    from emotions.models import EmotionDetection, MoodCheckIn
except ImportError as e:
    logger.error(f"Import error: {e}")
    EmotionDetection = None
    MoodCheckIn = None


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
    total_entries = JournalEntry.objects.filter(user=user, is_draft=False).count()
    
    # Calculate current streak (consecutive days with at least one entry)
    streak = 0
    current_date = timezone.now().date()
    check_date = current_date
    
    while True:
        entries_today = JournalEntry.objects.filter(
            user=user,
            is_draft=False,
            entry_date__date=check_date
        ).exists()
        
        if entries_today:
            streak += 1
            check_date -= timedelta(days=1)
        else:
            break
    
    # Get dominant emotion from recent entries (last 30 days)
    # Use try-except to handle case where emotion field doesn't exist yet (before migration)
    dominant_emotion = 'neutral'
    try:
        recent_entries = JournalEntry.objects.filter(
            user=user,
            is_draft=False,
            entry_date__gte=timezone.now() - timedelta(days=30),
            emotion__isnull=False
        ).exclude(emotion='')
        
        if recent_entries.exists():
            emotion_counts = Counter([entry.emotion for entry in recent_entries if entry.emotion])
            if emotion_counts:
                dominant_emotion = emotion_counts.most_common(1)[0][0]
    except Exception as e:
        # Field doesn't exist yet, use default
        logger.warning(f"Emotion field not available yet: {e}")
        dominant_emotion = 'neutral'
    
    # ML predictions count (total emotion detections)
    # First try to count EmotionDetection records
    if EmotionDetection:
        try:
            ml_predictions_count = EmotionDetection.objects.filter(
                entry__user=user
            ).count()
        except Exception as e:
            logger.warning(f"Error counting EmotionDetection records: {e}")
            # Fallback: count entries with emotions
            ml_predictions_count = JournalEntry.objects.filter(
                user=user,
                is_draft=False,
                emotion__isnull=False
            ).exclude(emotion='').count()
    else:
        # Fallback: count entries with emotions if EmotionDetection model doesn't exist
        ml_predictions_count = JournalEntry.objects.filter(
            user=user,
            is_draft=False,
            emotion__isnull=False
        ).exclude(emotion='').count()
    
    return Response({
        'total_entries': total_entries,
        'current_streak': streak,
        'dominant_emotion': dominant_emotion,
        'ml_predictions_count': ml_predictions_count
    }, status=status.HTTP_200_OK)


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
    
    # Get entries from last N days
    start_date = timezone.now() - timedelta(days=days)
    entries = JournalEntry.objects.filter(
        user=user,
        is_draft=False,
        entry_date__gte=start_date
    )
    
    # Get emotion detections for these entries
    detections = EmotionDetection.objects.filter(
        entry__user=user,
        detected_at__gte=start_date
    )
    
    # Group by date
    result = []
    for i in range(days):
        date = (timezone.now() - timedelta(days=days - 1 - i)).date()
        
        # Get detections for this date (check both detected_at and entry date)
        day_detections = detections.filter(
            Q(detected_at__date=date) | Q(entry__entry_date__date=date)
        )
        
        # Also get entries for this date as fallback
        day_entries = entries.filter(entry_date__date=date).exclude(emotion='').exclude(emotion__isnull=True)
        
        if day_detections.exists():
            avg_valence = day_detections.aggregate(avg=Avg('valence'))['avg'] or 0
            avg_arousal = day_detections.aggregate(avg=Avg('arousal'))['avg'] or 0
            
            # Convert from -1 to 1 range to 0-10 range for frontend
            valence_0_10 = ((avg_valence + 1) / 2) * 10
            arousal_0_10 = avg_arousal * 10
            
            result.append({
                'date': date.strftime('%Y-%m-%d'),
                'avgValence': round(valence_0_10, 2),
                'avgArousal': round(arousal_0_10, 2)
            })
        elif day_entries.exists():
            # Fallback: calculate from entry emotions
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
            # No data for this day, return neutral values
            result.append({
                'date': date.strftime('%Y-%m-%d'),
                'avgValence': 5.0,
                'avgArousal': 5.0
            })
    
    return Response(result, status=status.HTTP_200_OK)


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
        entries = JournalEntry.objects.filter(
            user=user,
            is_draft=False,
            entry_date__gte=start_date,
            emotion__isnull=False
        ).exclude(emotion='')
        
        # Count emotions (normalize to lowercase for consistency)
        emotion_counts = Counter([
            entry.emotion.lower().strip() if entry.emotion else None
            for entry in entries 
            if entry.emotion and entry.emotion.strip()
        ])
        
        # Convert to array format
        result = [
            {'emotion': emotion, 'count': count}
            for emotion, count in emotion_counts.items()
            if emotion  # Filter out None values
        ]
        
        # Sort by count descending
        result.sort(key=lambda x: x['count'], reverse=True)
        
        logger.info(f"Emotion distribution for user {user.id}: {result}")
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        # Field doesn't exist yet, return empty array
        logger.warning(f"Emotion field not available yet: {e}")
        return Response([], status=status.HTTP_200_OK)


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
        
        entries = JournalEntry.objects.filter(
            user=user,
            is_draft=False
        ).order_by('-entry_date')[:limit]
        
        result = []
        for entry in entries:
            try:
                # Get emotion detection confidence if exists
                detection = EmotionDetection.objects.filter(entry=entry).first()
                confidence = int(detection.confidence * 100) if detection and detection.confidence else None
                
                # Get preview text - handle None safely
                text_content = entry.text_content or ''
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
                # Skip this entry if there's an error processing it
                print(f"Error processing entry {entry.id}: {str(e)}")
                continue
        
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        import traceback
        error_msg = str(e)
        logger.error(f"Error in recent_entries endpoint: {error_msg}")
        traceback.print_exc()
        # Return empty array instead of error if there's an issue, so dashboard still loads
        return Response([], status=status.HTTP_200_OK)

