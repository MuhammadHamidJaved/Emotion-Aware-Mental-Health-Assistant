"""
Insights & Analytics API endpoints
"""
import logging
from datetime import timedelta

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .analytics_constants import INSIGHTS_EMOTION_SCORE_MAP
from .repositories.entry_analytics_repository import EntryAnalyticsRepository
from .services.response_helpers import ok_response

logger = logging.getLogger(__name__)

try:
    from emotions.models import EmotionDetection
except ImportError as e:
    logger.error(f"Import error: {e}")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def insights_overview(request):
    """
    Get insights overview statistics
    GET /api/insights/overview/?days=30
    
    Returns:
    - overall_mood: Average mood score (0-100)
    - overall_mood_change: Change from previous period (+/- number)
    - positive_trend: Percentage of positive emotions
    - positive_trend_status: "Improving" or "Declining"
    - avg_entries_per_day: Average entries per day
    - best_streak: Longest streak in days
    """
    user = request.user
    days = int(request.query_params.get('days', 30))
    
    try:
        # Calculate date ranges
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        previous_start_date = start_date - timedelta(days=days)
        
        # Get entries for current period
        current_entries = EntryAnalyticsRepository.get_entries_in_period(
            user=user,
            start_date=start_date,
            end_date=end_date,
        )
        
        # Get entries for previous period (for comparison)
        previous_entries = EntryAnalyticsRepository.get_entries_in_half_open_period(
            user=user,
            start_date=previous_start_date,
            end_date=start_date,
        )
        
        # Calculate overall mood score (0-100)
        # Based on emotion detections or entry emotions
        mood_scores = []
        
        # Get mood scores from detections (valence -1 to 1, convert to 0-100)
        emotion_detections = EntryAnalyticsRepository.get_emotion_detections_since(
            user=user,
            start_date=start_date,
            emotion_detection_model=EmotionDetection,
        )
        
        if emotion_detections.exists():
            for detection in emotion_detections:
                # Convert valence (-1 to 1) to score (0 to 100)
                score = ((detection.valence + 1) / 2) * 100
                mood_scores.append(score)
        else:
            # Fallback: use emotion field from entries
            entries_with_emotions = EntryAnalyticsRepository.get_entries_with_emotions(current_entries)
            
            # Map emotions to scores (rough approximation)
            emotion_to_score = INSIGHTS_EMOTION_SCORE_MAP
            
            for entry in entries_with_emotions:
                emotion = getattr(entry, 'emotion', None)
                if emotion and emotion in emotion_to_score:
                    mood_scores.append(emotion_to_score[emotion])
        
        overall_mood = int(sum(mood_scores) / len(mood_scores)) if mood_scores else 50
        
        # Calculate previous period mood for comparison
        prev_mood_scores = []
        prev_detections = EntryAnalyticsRepository.get_emotion_detections_in_half_open_period(
            user=user,
            start_date=previous_start_date,
            end_date=start_date,
            emotion_detection_model=EmotionDetection,
        )
        
        if prev_detections.exists():
            for detection in prev_detections:
                score = ((detection.valence + 1) / 2) * 100
                prev_mood_scores.append(score)
        else:
            prev_entries_with_emotions = EntryAnalyticsRepository.get_entries_with_emotions(previous_entries)
            emotion_to_score = INSIGHTS_EMOTION_SCORE_MAP
            for entry in prev_entries_with_emotions:
                emotion = getattr(entry, 'emotion', None)
                if emotion and emotion in emotion_to_score:
                    prev_mood_scores.append(emotion_to_score[emotion])
        
        prev_overall_mood = int(sum(prev_mood_scores) / len(prev_mood_scores)) if prev_mood_scores else 50
        overall_mood_change = overall_mood - prev_overall_mood
        
        # Calculate positive trend percentage
        positive_emotions = ['happy', 'excited', 'grateful', 'confident', 'calm', 'peaceful', 'energetic', 'loved']
        
        entries_with_emotions = EntryAnalyticsRepository.get_entries_with_emotions(current_entries)
        
        total_with_emotions = entries_with_emotions.count()
        positive_count = entries_with_emotions.filter(emotion__in=positive_emotions).count()
        
        positive_trend = int((positive_count / total_with_emotions * 100)) if total_with_emotions > 0 else 50
        positive_trend_status = "Improving" if overall_mood_change >= 0 else "Declining"
        
        # Calculate average entries per day
        total_entries = current_entries.count()
        avg_entries_per_day = round(total_entries / days, 1) if days > 0 else 0
        
        # Calculate best streak - optimized version
        # Get all entry dates for the last 90 days (reduced from 365 for performance)
        streak_start_date = end_date - timedelta(days=90)
        entry_dates = EntryAnalyticsRepository.get_entry_dates_in_period(
            user=user,
            start_date=streak_start_date,
            end_date=end_date,
        )
        
        # Convert to set for O(1) lookup
        entry_dates_set = set(entry_dates)
        
        best_streak = 0
        current_streak = 0
        check_date = end_date.date()
        
        # Check last 90 days efficiently
        for i in range(90):
            if check_date in entry_dates_set:
                current_streak += 1
                best_streak = max(best_streak, current_streak)
            else:
                current_streak = 0
            
            check_date -= timedelta(days=1)
        
        return ok_response({
            'overall_mood': overall_mood,
            'overall_mood_change': overall_mood_change,
            'positive_trend': positive_trend,
            'positive_trend_status': positive_trend_status,
            'avg_entries_per_day': avg_entries_per_day,
            'best_streak': best_streak
        })
        
    except Exception as e:
        logger.error(f"Error in insights_overview: {e}")
        # Return default values on error
        return ok_response({
            'overall_mood': 50,
            'overall_mood_change': 0,
            'positive_trend': 50,
            'positive_trend_status': 'Neutral',
            'avg_entries_per_day': 0,
            'best_streak': 0
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def insights_mood_timeline(request):
    """
    Get mood history timeline data for area chart
    GET /api/insights/mood-timeline/?days=30
    
    Returns array of daily mood data:
    - date: Date string (e.g., "Jan 01")
    - valence: Valence score (0-10)
    - arousal: Arousal score (0-10)
    - avgScore: Average mood score (0-100)
    """
    user = request.user
    days = int(request.query_params.get('days', 30))
    
    try:
        start_date = timezone.now() - timedelta(days=days)
        
        detections_by_date = EntryAnalyticsRepository.get_insights_timeline_detections_by_date(
            user=user,
            start_date=start_date,
            emotion_detection_model=EmotionDetection,
        )
        
        result = []
        
        for i in range(days):
            date = (timezone.now() - timedelta(days=days - 1 - i)).date()
            
            # Get detections for this date from grouped data
            day_detections = detections_by_date.get(date, [])
            
            if day_detections:
                avg_valence = sum(d.valence for d in day_detections) / len(day_detections)
                avg_arousal = sum(d.arousal for d in day_detections) / len(day_detections)
                
                # Convert from -1 to 1 range to 0-10 range
                valence_0_10 = ((avg_valence + 1) / 2) * 10
                arousal_0_10 = avg_arousal * 10
                
                # Calculate average score (0-100)
                avg_score = ((avg_valence + 1) / 2) * 100
                
                result.append({
                    'date': date.strftime('%b %d'),  # "Jan 01" format
                    'valence': round(valence_0_10, 1),
                    'arousal': round(arousal_0_10, 1),
                    'avgScore': round(avg_score, 0)
                })
            else:
                # No data - check if we can infer from entries
                entries_today = EntryAnalyticsRepository.get_entries_with_emotions_for_day(
                    user=user,
                    target_date=date,
                )
                
                if entries_today.exists():
                    # Estimate from emotions
                    emotion_to_score = INSIGHTS_EMOTION_SCORE_MAP
                    
                    scores = []
                    for entry in entries_today:
                        emotion = getattr(entry, 'emotion', None)
                        if emotion and emotion in emotion_to_score:
                            scores.append(emotion_to_score[emotion])
                    
                    if scores:
                        avg_score = sum(scores) / len(scores)
                        # Estimate valence and arousal from score
                        valence_0_10 = (avg_score / 100) * 10  # 0-10
                        arousal_0_10 = 5.0  # Default arousal
                        
                        result.append({
                            'date': date.strftime('%b %d'),
                            'valence': round(valence_0_10, 1),
                            'arousal': round(arousal_0_10, 1),
                            'avgScore': round(avg_score, 0)
                        })
                    else:
                        # No emotion data - use neutral
                        result.append({
                            'date': date.strftime('%b %d'),
                            'valence': 5.0,
                            'arousal': 5.0,
                            'avgScore': 50.0
                        })
                else:
                    # No entries for this day
                    result.append({
                        'date': date.strftime('%b %d'),
                        'valence': 5.0,
                        'arousal': 5.0,
                        'avgScore': 50.0
                    })
        
        return ok_response(result)
        
    except Exception as e:
        logger.error(f"Error in insights_mood_timeline: {e}")
        # Return empty/default data
        result = []
        for i in range(days):
            date = (timezone.now() - timedelta(days=days - 1 - i)).date()
            result.append({
                'date': date.strftime('%b %d'),
                'valence': 5.0,
                'arousal': 5.0,
                'avgScore': 50.0
            })
        return ok_response(result)

