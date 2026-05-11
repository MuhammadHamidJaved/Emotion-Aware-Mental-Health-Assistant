"""
API views for notifications
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Notification, PushSubscription
from .notification_dispatcher import NotificationDispatcher
from .notification_service import NotificationService
from . import push_service
from .serializers import NotificationSerializer
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    """
    GET /api/notifications/
    
    Get user's notifications
    Query params:
    - limit: number of notifications to return (default: 50)
    - unread_only: return only unread notifications (default: false)
    """
    limit = int(request.GET.get('limit', 50))
    unread_only = request.GET.get('unread_only', 'false').lower() == 'true'
    
    notifications = NotificationService.get_user_notifications(
        user=request.user,
        limit=limit,
        unread_only=unread_only
    )
    
    serializer = NotificationSerializer(notifications, many=True)
    
    return Response({
        'notifications': serializer.data,
        'count': len(serializer.data),
        'unread_count': NotificationService.get_unread_count(request.user)
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unread_count(request):
    """
    GET /api/notifications/unread-count/
    
    Get count of unread notifications
    """
    count = NotificationService.get_unread_count(request.user)
    
    return Response({
        'unread_count': count
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_as_read(request):
    """
    POST /api/notifications/mark-read/
    
    Mark notification(s) as read
    Body:
    - notification_id: ID of notification to mark as read (optional)
    - mark_all: mark all notifications as read (optional, boolean)
    """
    notification_id = request.data.get('notification_id')
    mark_all = request.data.get('mark_all', False)
    
    if mark_all:
        count = NotificationService.mark_all_as_read(request.user)
        return Response({
            'message': f'Marked {count} notifications as read',
            'count': count
        }, status=status.HTTP_200_OK)
    
    elif notification_id:
        success = NotificationService.mark_as_read(notification_id, request.user)
        if success:
            return Response({
                'message': 'Notification marked as read'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Notification not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    else:
        return Response({
            'error': 'Either notification_id or mark_all must be provided'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_notification(request, notification_id):
    """
    DELETE /api/notifications/{id}/
    
    Delete a specific notification
    """
    success = NotificationService.delete_notification(notification_id, request.user)
    
    if success:
        return Response({
            'message': 'Notification deleted'
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'error': 'Notification not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_all_notifications(request):
    """
    DELETE /api/notifications/clear/
    
    Delete all notifications for the user
    """
    count = NotificationService.clear_all_notifications(request.user)
    
    return Response({
        'message': f'Deleted {count} notifications',
        'count': count
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_notification(request):
    """
    POST /api/notifications/test/
    
    Create a test notification (for development/testing)
    """
    notification_type = request.data.get('type', 'session_reminder')
    force = bool(request.data.get('force'))

    if notification_type == 'session_reminder':
        notification = NotificationDispatcher.dispatch(
            request.user,
            'session_reminder',
            'Time for your emotional check-in',
            'Take a moment to reflect on how you\'re feeling today.',
            '/check-in/new',
            skip_type_check=force,
        )
    elif notification_type == 'mood_insight':
        notification = NotificationDispatcher.dispatch(
            request.user,
            'mood_insight',
            'New mood insight available',
            'You seem to be experiencing more positive emotions this week!',
            '/insights',
            skip_type_check=force,
        )
    elif notification_type == 'weekly_report':
        notification = NotificationDispatcher.dispatch(
            request.user,
            'weekly_report',
            'Your weekly emotional wellness report',
            'Check out your progress and insights from this week.',
            "/insights",
            skip_type_check=force,
        )
    elif notification_type == 'streak_alert':
        notification = NotificationDispatcher.dispatch(
            request.user,
            'streak_alert',
            '🔥 7 day streak!',
            'Amazing! You\'ve logged your emotions for 7 days in a row. Keep it up!',
            '/dashboard',
            metadata={'streak_count': 7},
            skip_type_check=force,
        )
    elif notification_type == 'ai_suggestion':
        notification = NotificationDispatcher.dispatch(
            request.user,
            'ai_suggestion',
            'Your AI companion has a suggestion',
            'Try a 5-minute breathing exercise to help manage stress.',
            '/chat',
            skip_type_check=force,
        )
    else:
        return Response({
            'error': 'Invalid notification type'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if notification:
        serializer = NotificationSerializer(notification)
        return Response({
            'message': 'Test notification created',
            'notification': serializer.data
        }, status=status.HTTP_201_CREATED)
    else:
        return Response({
            'error': 'Failed to create notification'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def push_vapid_public_key(request):
    """Public VAPID key for Web Push subscription (safe to expose)."""
    key = push_service.get_public_vapid_key()
    return Response({
        'enabled': bool(key),
        'publicKey': key or None,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def push_subscribe(request):
    """
    Register a browser push subscription.
    Body: {"endpoint": "...", "keys": {"p256dh": "...", "auth": "..."}}
    """
    endpoint = request.data.get('endpoint')
    keys = request.data.get('keys') or {}
    p256dh = keys.get('p256dh')
    auth = keys.get('auth')
    if not endpoint or not p256dh or not auth:
        return Response({'error': 'endpoint and keys.p256dh, keys.auth required'}, status=status.HTTP_400_BAD_REQUEST)

    ua = (request.META.get('HTTP_USER_AGENT') or '')[:512]
    PushSubscription.objects.update_or_create(
        user=request.user,
        endpoint=endpoint,
        defaults={'p256dh': p256dh, 'auth': auth, 'user_agent': ua},
    )
    return Response({'ok': True}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def push_unsubscribe(request):
    """Remove a subscription (e.g. user disabled push or token expired)."""
    endpoint = request.data.get('endpoint')
    if not endpoint:
        return Response({'error': 'endpoint required'}, status=status.HTTP_400_BAD_REQUEST)
    PushSubscription.objects.filter(user=request.user, endpoint=endpoint).delete()
    return Response({'ok': True}, status=status.HTTP_200_OK)

