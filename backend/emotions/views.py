"""
API views for emotions and mood tracking
"""
import logging
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import QuickMoodLog
from .serializers import DaysQuerySerializer, QuickMoodLogCreateSerializer
from datetime import timedelta

logger = logging.getLogger(__name__)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def quick_mood_logs(request):
    """
    List quick mood logs or create a new one
    GET /api/emotions/quick-moods/ - List mood logs
    POST /api/emotions/quick-moods/ - Create mood log
    """
    if request.method == 'GET':
        params_serializer = DaysQuerySerializer(data=request.query_params)
        if not params_serializer.is_valid():
            return Response(params_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        days = params_serializer.validated_data['days']
        
        start_date = timezone.now() - timedelta(days=days)
        mood_logs = QuickMoodLog.objects.filter(
            user=request.user,
            checked_in_at__gte=start_date
        ).order_by('-checked_in_at')
        
        data = [{
            'id': log.id,
            'mood': log.mood,
            'intensity': log.intensity,
            'note': log.note,
            'checked_in_at': log.checked_in_at
        } for log in mood_logs]
        
        return Response(data, status=status.HTTP_200_OK)
    
    elif request.method == 'POST':
        request_serializer = QuickMoodLogCreateSerializer(data=request.data)
        if not request_serializer.is_valid():
            return Response(request_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        mood = request_serializer.validated_data['mood']
        intensity = request_serializer.validated_data['intensity']
        note = request_serializer.validated_data.get('note', '')
        
        # Create mood log
        mood_log = QuickMoodLog.objects.create(
            user=request.user,
            mood=mood,
            intensity=intensity,
            note=note
        )
        
        logger.info(f"Created quick mood log for user {request.user.id}: {mood} (intensity {intensity})")
        
        return Response({
            'id': mood_log.id,
            'mood': mood_log.mood,
            'intensity': mood_log.intensity,
            'note': mood_log.note,
            'checked_in_at': mood_log.checked_in_at,
            'message': 'Mood logged successfully'
        }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mood_statistics(request):
    """
    Get mood statistics for the user
    GET /api/emotions/mood-stats/ - Get stats
    """
    params_serializer = DaysQuerySerializer(data=request.query_params)
    if not params_serializer.is_valid():
        return Response(params_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    days = params_serializer.validated_data['days']
    
    start_date = timezone.now() - timedelta(days=days)
    mood_logs = QuickMoodLog.objects.filter(
        user=request.user,
        checked_in_at__gte=start_date
    )
    
    # Calculate statistics
    total_count = mood_logs.count()
    if total_count == 0:
        return Response({
            'total_logs': 0,
            'average_intensity': 0,
            'mood_distribution': {},
            'message': 'No mood logs found for this period'
        })
    
    # Mood distribution
    mood_counts = {}
    total_intensity = 0
    for log in mood_logs:
        mood_counts[log.mood] = mood_counts.get(log.mood, 0) + 1
        total_intensity += log.intensity
    
    return Response({
        'total_logs': total_count,
        'average_intensity': round(total_intensity / total_count, 2),
        'mood_distribution': mood_counts,
        'period_days': days
    }, status=status.HTTP_200_OK)

