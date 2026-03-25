"""
Calendar API endpoints for mood calendar view
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.utils import timezone
from datetime import date
from collections import Counter
import logging
from .analytics_constants import CALENDAR_EMOTION_TO_SCORE
from .services.response_helpers import error_response, ok_response
from .repositories.entry_analytics_repository import EntryAnalyticsRepository
import calendar

logger = logging.getLogger(__name__)

try:
    from emotions.models import EmotionDetection
except ImportError as e:
    logger.error(f"Import error: {e}")


# Emotion to emoji mapping
EMOTION_EMOJI = {
    'happy': '😊',
    'sad': '😢',
    'anxious': '😰',
    'calm': '😌',
    'excited': '🤩',
    'angry': '😠',
    'grateful': '🙏',
    'confident': '😎',
    'frustrated': '😤',
    'neutral': '😐',
    'tired': '😴',
    'loved': '🥰',
    'energetic': '⚡',
    'peaceful': '☮️',
    'surprised': '😲',
    'disgusted': '🤢',
    'fearful': '😨',
}

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def calendar_month(request):
    """
    Get calendar data for a specific month
    GET /api/calendar/month/?year=2025&month=1
    
    Returns dictionary with date strings as keys:
    {
        "2025-01-01": {
            "date": "2025-01-01",
            "dominantEmotion": "happy",
            "emoji": "😊",
            "entryCount": 3,
            "moodScore": 91
        },
        ...
    }
    """
    user = request.user
    
    try:
        year = int(request.query_params.get('year', timezone.now().year))
        month = int(request.query_params.get('month', timezone.now().month))
        
        # Get start and end dates for the month
        first_day = date(year, month, 1)
        last_day_num = calendar.monthrange(year, month)[1]
        last_day = date(year, month, last_day_num)
        
        # Get all entries for this month
        entries = EntryAnalyticsRepository.get_entries_by_day_range_ordered(
            user=user,
            first_day=first_day,
            last_day=last_day,
        )
        
        # Group entries by date
        calendar_data = {}
        
        for entry in entries:
            entry_date = entry.entry_date.date()
            date_str = entry_date.isoformat()
            
            if date_str not in calendar_data:
                calendar_data[date_str] = {
                    'date': date_str,
                    'entries': [],
                    'emotions': []
                }
            
            calendar_data[date_str]['entries'].append(entry)
            
            # Get emotion from entry or detection
            emotion = None
            emotion_obj = getattr(entry, 'emotion', None)
            if emotion_obj:
                emotion = emotion_obj
            
            # Try to get from EmotionDetection if no emotion on entry
            if not emotion:
                emotion = EntryAnalyticsRepository.get_entry_dominant_emotion(
                    entry=entry,
                    emotion_detection_model=EmotionDetection,
                )
            
            if emotion:
                calendar_data[date_str]['emotions'].append(emotion)
        
        # Process each day's data
        result = {}
        for date_str, day_data in calendar_data.items():
            entry_count = len(day_data['entries'])
            emotions = day_data['emotions']
            
            if not emotions:
                continue  # Skip days with no emotions
            
            # Get dominant emotion
            emotion_counts = Counter(emotions)
            dominant_emotion = emotion_counts.most_common(1)[0][0]
            
            # Get emoji
            emoji = EMOTION_EMOJI.get(dominant_emotion, '😐')
            
            # Calculate average mood score
            scores = [CALENDAR_EMOTION_TO_SCORE.get(e, 50) for e in emotions]
            mood_score = int(sum(scores) / len(scores)) if scores else 50
            
            result[date_str] = {
                'date': date_str,
                'dominantEmotion': dominant_emotion,
                'emoji': emoji,
                'entryCount': entry_count,
                'moodScore': mood_score
            }
        
        return ok_response(result)
        
    except Exception as e:
        logger.error(f"Error in calendar_month: {e}")
        return ok_response({})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def calendar_day_details(request):
    """
    Get detailed entries for a specific day
    GET /api/calendar/day/?date=2025-01-01
    
    Returns array of entries for that day
    """
    user = request.user
    
    try:
        date_str = request.query_params.get('date')
        if not date_str:
            return error_response('Date parameter required', status.HTTP_400_BAD_REQUEST)
        
        target_date = date.fromisoformat(date_str)
        
        # Get entries for this date
        entries = EntryAnalyticsRepository.get_entries_for_day_ordered(
            user=user,
            target_date=target_date,
        )
        
        result = []
        for entry in entries:
            # Get emotion
            emotion = getattr(entry, 'emotion', None)
            if not emotion:
                emotion = EntryAnalyticsRepository.get_entry_dominant_emotion(
                    entry=entry,
                    emotion_detection_model=EmotionDetection,
                )
            
            # Get decrypted content
            try:
                title = entry.get_title() or 'Untitled Entry'
                text_content = entry.get_text_content() or ''
                if text_content and len(text_content) > 200:
                    text_content = text_content[:200] + '...'
            except Exception as decrypt_error:
                logger.warning(f"Could not decrypt entry {entry.id}: {decrypt_error}")
                title = 'Untitled Entry'
                text_content = ''
            
            result.append({
                'id': entry.id,
                'title': title,
                'text_content': text_content,
                'emotion': emotion or 'neutral',
                'entry_type': entry.entry_type,
                'entry_date': entry.entry_date.isoformat(),
                'word_count': entry.word_count,
            })
        
        return ok_response(result)
        
    except ValueError as e:
        return error_response('Invalid date format. Use YYYY-MM-DD', status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error in calendar_day_details: {e}")
        return error_response(str(e), status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def calendar_month_summary(request):
    """
    Get month summary statistics
    GET /api/calendar/month-summary/?year=2025&month=1
    
    Returns:
    {
        "total_entries": 16,
        "days_logged": 8,
        "avg_mood_score": 81
    }
    """
    user = request.user
    
    try:
        year = int(request.query_params.get('year', timezone.now().year))
        month = int(request.query_params.get('month', timezone.now().month))
        
        # Get start and end dates for the month
        first_day = date(year, month, 1)
        last_day_num = calendar.monthrange(year, month)[1]
        last_day = date(year, month, last_day_num)
        
        # Get all entries for this month
        entries = EntryAnalyticsRepository.get_entries_by_day_range_ordered(
            user=user,
            first_day=first_day,
            last_day=last_day,
        )
        
        total_entries = entries.count()
        
        # Get unique days with entries
        days_logged = EntryAnalyticsRepository.get_distinct_logged_days_count(entries)
        
        # Calculate average mood score
        mood_scores = []
        for entry in entries:
            emotion = getattr(entry, 'emotion', None)
            if not emotion:
                emotion = EntryAnalyticsRepository.get_entry_dominant_emotion(
                    entry=entry,
                    emotion_detection_model=EmotionDetection,
                )
            
            if emotion and emotion in CALENDAR_EMOTION_TO_SCORE:
                mood_scores.append(CALENDAR_EMOTION_TO_SCORE[emotion])
        
        avg_mood_score = int(sum(mood_scores) / len(mood_scores)) if mood_scores else 0
        
        return ok_response({
            'total_entries': total_entries,
            'days_logged': days_logged,
            'avg_mood_score': avg_mood_score
        })
        
    except Exception as e:
        logger.error(f"Error in calendar_month_summary: {e}")
        return ok_response({
            'total_entries': 0,
            'days_logged': 0,
            'avg_mood_score': 0
        })




