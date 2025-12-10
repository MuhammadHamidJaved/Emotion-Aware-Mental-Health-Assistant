"""
Notification service for creating and managing notifications
"""
from django.utils import timezone
from .models import Notification
import logging

logger = logging.getLogger(__name__)


class NotificationService:
    """
    Service for creating and managing user notifications
    """
    
    @staticmethod
    def create_notification(
        user,
        notification_type: str,
        title: str,
        message: str,
        action_url: str = '',
        related_object_id: int = None,
        metadata: dict = None
    ) -> Notification:
        """
        Create a new notification for a user
        
        Args:
            user: User object
            notification_type: Type of notification (session_reminder, mood_insight, etc.)
            title: Notification title
            message: Notification message
            action_url: Optional URL to navigate when clicked
            related_object_id: Optional ID of related object
            metadata: Optional additional data
        
        Returns:
            Notification object
        """
        try:
            notification = Notification.objects.create(
                user=user,
                type=notification_type,
                title=title,
                message=message,
                action_url=action_url or '',
                related_object_id=related_object_id,
                metadata=metadata or {}
            )
            logger.info(f"Created notification for user {user.username}: {title}")
            return notification
        except Exception as e:
            logger.error(f"Failed to create notification: {e}")
            return None
    
    @staticmethod
    def create_session_reminder(user):
        """Create a session reminder notification"""
        return NotificationService.create_notification(
            user=user,
            notification_type='session_reminder',
            title='Time for your emotional check-in',
            message='Take a moment to reflect on how you\'re feeling today.',
            action_url='/journal/new'
        )
    
    @staticmethod
    def create_mood_insight(user, insight_text: str, mood_data: dict = None):
        """Create a mood insight notification"""
        return NotificationService.create_notification(
            user=user,
            notification_type='mood_insight',
            title='New mood insight available',
            message=insight_text,
            action_url='/insights',
            metadata=mood_data or {}
        )
    
    @staticmethod
    def create_weekly_report(user, stats: dict = None):
        """Create a weekly report notification"""
        return NotificationService.create_notification(
            user=user,
            notification_type='weekly_report',
            title='Your weekly emotional wellness report',
            message='Check out your progress and insights from this week.',
            action_url='/insights',
            metadata=stats or {}
        )
    
    @staticmethod
    def create_streak_alert(user, streak_count: int):
        """Create a streak alert notification"""
        return NotificationService.create_notification(
            user=user,
            notification_type='streak_alert',
            title=f'🔥 {streak_count} day streak!',
            message=f'Amazing! You\'ve logged your emotions for {streak_count} days in a row. Keep it up!',
            action_url='/dashboard',
            metadata={'streak_count': streak_count}
        )
    
    @staticmethod
    def create_ai_suggestion(user, suggestion_text: str, context: dict = None):
        """Create an AI suggestion notification"""
        return NotificationService.create_notification(
            user=user,
            notification_type='ai_suggestion',
            title='Your AI companion has a suggestion',
            message=suggestion_text,
            action_url='/chat',
            metadata=context or {}
        )
    
    @staticmethod
    def create_recommendation_notification(user, recommendation_title: str, recommendation_id: int = None):
        """Create a recommendation notification"""
        return NotificationService.create_notification(
            user=user,
            notification_type='recommendation',
            title='New personalized recommendation',
            message=f'Based on your recent emotions, we recommend: {recommendation_title}',
            action_url='/recommendations',
            related_object_id=recommendation_id
        )
    
    @staticmethod
    def get_unread_count(user) -> int:
        """Get count of unread notifications for a user"""
        return Notification.objects.filter(user=user, is_read=False).count()
    
    @staticmethod
    def get_user_notifications(user, limit: int = 50, unread_only: bool = False):
        """Get notifications for a user"""
        queryset = Notification.objects.filter(user=user)
        if unread_only:
            queryset = queryset.filter(is_read=False)
        return queryset[:limit]
    
    @staticmethod
    def mark_as_read(notification_id: int, user) -> bool:
        """Mark a notification as read"""
        try:
            notification = Notification.objects.get(id=notification_id, user=user)
            notification.mark_as_read()
            return True
        except Notification.DoesNotExist:
            logger.error(f"Notification {notification_id} not found for user {user.username}")
            return False
    
    @staticmethod
    def mark_all_as_read(user) -> int:
        """Mark all notifications as read for a user"""
        count = Notification.objects.filter(user=user, is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )
        logger.info(f"Marked {count} notifications as read for user {user.username}")
        return count
    
    @staticmethod
    def delete_notification(notification_id: int, user) -> bool:
        """Delete a notification"""
        try:
            notification = Notification.objects.get(id=notification_id, user=user)
            notification.delete()
            return True
        except Notification.DoesNotExist:
            logger.error(f"Notification {notification_id} not found for user {user.username}")
            return False
    
    @staticmethod
    def clear_all_notifications(user) -> int:
        """Delete all notifications for a user"""
        count, _ = Notification.objects.filter(user=user).delete()
        logger.info(f"Deleted {count} notifications for user {user.username}")
        return count
    
    @staticmethod
    def should_send_notification(user, notification_type: str) -> bool:
        """
        Check if notification should be sent based on user preferences
        
        Args:
            user: User object
            notification_type: Type of notification to check
        
        Returns:
            bool: True if notification should be sent
        """
        try:
            preferences = user.preferences
            settings = preferences.get_notification_settings()
            
            # Map notification types to settings keys
            type_mapping = {
                'session_reminder': 'session_reminders',
                'mood_insight': 'mood_insights',
                'weekly_report': 'weekly_reports',
                'streak_alert': 'streak_alerts',
                'ai_suggestion': 'ai_suggestions',
                'recommendation': 'ai_suggestions',
                'system': True  # Always send system notifications
            }
            
            setting_key = type_mapping.get(notification_type, True)
            if isinstance(setting_key, bool):
                return setting_key
            
            return settings.get(setting_key, True)
        except Exception as e:
            logger.error(f"Error checking notification preferences: {e}")
            return True  # Default to sending notifications if check fails

