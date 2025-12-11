"""
Dashboard API endpoints for statistics and analytics
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q, Avg, Max
from django.db.models.functions import Lower, Trim
from django.db.models import QuerySet
from django.utils import timezone
from datetime import timedelta
from collections import Counter
import logging

logger = logging.getLogger(__name__)

try:
    from .models import JournalEntry
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
    total_entries = JournalEntry.objects.filter(user=user, is_draft=False).count()
    
    # Calculate current streak (consecutive days with at least one entry)
    # Optimized: Get all entry dates at once, then calculate streak in Python
    streak = 0
    current_date = timezone.now().date()
    
    # Get all entry dates for the user (last 365 days to limit query)
    entry_dates = set(
        JournalEntry.objects.filter(
            user=user,
            is_draft=False,
            entry_date__gte=current_date - timedelta(days=365)
        ).values_list('entry_date__date', flat=True).distinct()
    )
    
    # Calculate streak by checking consecutive days
    check_date = current_date
    while check_date in entry_dates:
        streak += 1
        check_date -= timedelta(days=1)
    
    # Get dominant emotion from recent entries (last 30 days)
    # Optimized: Use database aggregation instead of loading all entries
    dominant_emotion = 'neutral'
    try:
        from django.db.models import Count
        emotion_counts = JournalEntry.objects.filter(
            user=user,
            is_draft=False,
            entry_date__gte=timezone.now() - timedelta(days=30),
            emotion__isnull=False
        ).exclude(emotion='').values('emotion').annotate(
            count=Count('emotion')
        ).order_by('-count')[:1]
        
        if emotion_counts:
            dominant_emotion = emotion_counts[0]['emotion']
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
    
    # Optimized: Get all detections and entries at once, then group by date in Python
    # This reduces the number of database queries from N (one per day) to 2 (one for detections, one for entries)
    detections_list = list(detections.select_related('entry'))
    entries_list = list(entries.exclude(emotion='').exclude(emotion__isnull=True))
    
    # Group detections by date
    detections_by_date = {}
    for detection in detections_list:
        # Check both detected_at and entry date
        date1 = detection.detected_at.date() if detection.detected_at else None
        date2 = detection.entry.entry_date.date() if detection.entry and detection.entry.entry_date else None
        
        for date in [date1, date2]:
            if date:
                if date not in detections_by_date:
                    detections_by_date[date] = []
                detections_by_date[date].append(detection)
    
    # Group entries by date
    entries_by_date = {}
    for entry in entries_list:
        date = entry.entry_date.date() if entry.entry_date else None
        if date:
            if date not in entries_by_date:
                entries_by_date[date] = []
            entries_by_date[date].append(entry)
    
    # Emotion mapping for fallback calculation
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
        # Optimized: Use database aggregation instead of loading all entries into memory
        # Get emotion counts using database aggregation
        # Note: Using Lower() for case-insensitive grouping
        emotion_counts = JournalEntry.objects.filter(
            user=user,
            is_draft=False,
            entry_date__gte=start_date,
            emotion__isnull=False
        ).exclude(emotion='').annotate(
            emotion_lower=Lower('emotion')
        ).values('emotion_lower').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Convert to array format and trim whitespace
        result = [
            {'emotion': item['emotion_lower'].strip() if item['emotion_lower'] else '', 'count': item['count']}
            for item in emotion_counts
            if item['emotion_lower'] and item['emotion_lower'].strip()  # Filter out None/empty values
        ]
        
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
        ).select_related().prefetch_related('emotion_detections').order_by('-entry_date')[:limit]
        
        # Optimized: Get all emotion detections in one query to avoid N+1
        entry_ids = [entry.id for entry in entries]
        detections = {}
        if EmotionDetection and entry_ids:
            for detection in EmotionDetection.objects.filter(entry_id__in=entry_ids).select_related('entry'):
                entry_id = detection.entry_id
                if entry_id not in detections or detection.detected_at > detections[entry_id].detected_at:
                    detections[entry_id] = detection
        
        result = []
        for entry in entries:
            try:
                # Get emotion detection confidence if exists (from prefetched data)
                detection = detections.get(entry.id)
                confidence = int(detection.confidence * 100) if detection and detection.confidence else None
                
                # Get preview text - handle both encrypted and plain text gracefully
                try:
                    text_content = entry.get_text_content_display() or ''
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
        
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        import traceback
        error_msg = str(e)
        logger.error(f"Error in recent_entries endpoint: {error_msg}")
        traceback.print_exc()
        # Return empty array instead of error if there's an issue, so dashboard still loads
        return Response([], status=status.HTTP_200_OK)

