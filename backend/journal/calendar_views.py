"""
Calendar API endpoints for mood calendar view
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q, Avg
from django.utils import timezone
from datetime import timedelta, date
from collections import Counter
import logging
import calendar

logger = logging.getLogger(__name__)

try:
    from .models import JournalEntry
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

# Emotion to score mapping (for mood calculation)
EMOTION_TO_SCORE = {
    'happy': 90, 'excited': 85, 'grateful': 88, 'confident': 82,
    'calm': 75, 'peaceful': 80, 'energetic': 85, 'loved': 87,
    'neutral': 50, 'tired': 40,
    'sad': 30, 'anxious': 35, 'angry': 25, 'frustrated': 30,
    'lonely': 35, 'scared': 30, 'disappointed': 35,
    'surprised': 60, 'disgusted': 20, 'fearful': 25
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
        entries = JournalEntry.objects.filter(
            user=user,
            is_draft=False,
            entry_date__date__gte=first_day,
            entry_date__date__lte=last_day
        ).order_by('entry_date')
        
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
                detection = EmotionDetection.objects.filter(entry=entry).first()
                if detection:
                    emotion = detection.get_dominant_emotion()
            
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
            scores = [EMOTION_TO_SCORE.get(e, 50) for e in emotions]
            mood_score = int(sum(scores) / len(scores)) if scores else 50
            
            result[date_str] = {
                'date': date_str,
                'dominantEmotion': dominant_emotion,
                'emoji': emoji,
                'entryCount': entry_count,
                'moodScore': mood_score
            }
        
        return Response(result, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in calendar_month: {e}")
        return Response({}, status=status.HTTP_200_OK)


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
            return Response({'error': 'Date parameter required'}, status=status.HTTP_400_BAD_REQUEST)
        
        target_date = date.fromisoformat(date_str)
        
        # Get entries for this date
        entries = JournalEntry.objects.filter(
            user=user,
            is_draft=False,
            entry_date__date=target_date
        ).order_by('entry_date')
        
        result = []
        for entry in entries:
            # Get emotion
            emotion = getattr(entry, 'emotion', None)
            if not emotion:
                detection = EmotionDetection.objects.filter(entry=entry).first()
                if detection:
                    emotion = detection.get_dominant_emotion()
            
            # Get decrypted content
            try:
                title = entry.get_title_display() or 'Untitled Entry'
                text_content = entry.get_text_content_display() or ''
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
        
        return Response(result, status=status.HTTP_200_OK)
        
    except ValueError as e:
        return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error in calendar_day_details: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
        entries = JournalEntry.objects.filter(
            user=user,
            is_draft=False,
            entry_date__date__gte=first_day,
            entry_date__date__lte=last_day
        )
        
        total_entries = entries.count()
        
        # Get unique days with entries
        days_with_entries = entries.values_list('entry_date__date', flat=True).distinct()
        days_logged = len(set(days_with_entries))
        
        # Calculate average mood score
        mood_scores = []
        for entry in entries:
            emotion = getattr(entry, 'emotion', None)
            if not emotion:
                detection = EmotionDetection.objects.filter(entry=entry).first()
                if detection:
                    emotion = detection.get_dominant_emotion()
            
            if emotion and emotion in EMOTION_TO_SCORE:
                mood_scores.append(EMOTION_TO_SCORE[emotion])
        
        avg_mood_score = int(sum(mood_scores) / len(mood_scores)) if mood_scores else 0
        
        return Response({
            'total_entries': total_entries,
            'days_logged': days_logged,
            'avg_mood_score': avg_mood_score
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in calendar_month_summary: {e}")
        return Response({
            'total_entries': 0,
            'days_logged': 0,
            'avg_mood_score': 0
        }, status=status.HTTP_200_OK)




