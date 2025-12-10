# Notification System Documentation

## Overview

Complete notification system for the Emotion Journal app with support for multiple notification types, triggered after predictions and recommendations.

## Features

✅ **Backend:**
- Notification model with encryption support
- Notification service for creating and managing notifications
- RESTful API endpoints for notifications
- Automatic notifications after AI responses and recommendations
- User preference checking before sending notifications

✅ **Frontend:**
- Notification bell with unread count badge
- Notification dropdown with real-time updates
- Mark as read/delete/clear functionality
- Settings UI for notification preferences

## Notification Types

1. **Session Reminders** (`session_reminder`) - Reminders for emotional check-ins
2. **Mood Insights** (`mood_insight`) - Personalized insights about mood patterns
3. **Weekly Reports** (`weekly_report`) - Weekly emotional wellness summary
4. **Streak Alerts** (`streak_alert`) - Journaling streak notifications
5. **AI Suggestions** (`ai_suggestion`) - Recommendations from AI companion
6. **Recommendations** (`recommendation`) - Personalized recommendations
7. **System** (`system`) - System notifications

## Database Schema

### Notification Model

```python
class Notification(models.Model):
    user = ForeignKey(User)                        # User who receives the notification
    type = CharField(max_length=30)                 # Notification type
    title = CharField(max_length=200)               # Notification title
    message = TextField()                           # Notification message
    action_url = CharField(max_length=500)          # Optional: URL to navigate
    related_object_id = IntegerField()              # Optional: Related object ID
    is_read = BooleanField(default=False)           # Read status
    read_at = DateTimeField(null=True)              # When marked as read
    metadata = JSONField(default=dict)              # Additional data
    created_at = DateTimeField(auto_now_add=True)   # Creation timestamp
    updated_at = DateTimeField(auto_now=True)       # Update timestamp
```

## API Endpoints

### 1. Get Notifications
```
GET /api/notifications/?limit=50&unread_only=false
Authorization: Bearer <token>

Response:
{
  "notifications": [
    {
      "id": 1,
      "type": "ai_suggestion",
      "title": "Your AI companion has a suggestion",
      "message": "Try a 5-minute breathing exercise...",
      "action_url": "/chat",
      "related_object_id": null,
      "is_read": false,
      "read_at": null,
      "metadata": {},
      "created_at": "2025-01-06T12:00:00Z",
      "updated_at": "2025-01-06T12:00:00Z"
    }
  ],
  "count": 1,
  "unread_count": 1
}
```

### 2. Get Unread Count
```
GET /api/notifications/unread-count/
Authorization: Bearer <token>

Response:
{
  "unread_count": 5
}
```

### 3. Mark as Read
```
POST /api/notifications/mark-read/
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "notification_id": 1  // Optional: specific notification
  "mark_all": false      // Optional: mark all as read
}

Response:
{
  "message": "Notification marked as read"
}
```

### 4. Delete Notification
```
DELETE /api/notifications/<id>/
Authorization: Bearer <token>

Response:
{
  "message": "Notification deleted"
}
```

### 5. Clear All Notifications
```
DELETE /api/notifications/clear/
Authorization: Bearer <token>

Response:
{
  "message": "Deleted 10 notifications",
  "count": 10
}
```

### 6. Test Notification (Development)
```
POST /api/notifications/test/
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "type": "session_reminder"  // or mood_insight, streak_alert, ai_suggestion
}

Response:
{
  "message": "Test notification created",
  "notification": {...}
}
```

## Backend Usage

### Creating Notifications

```python
from recommendations.notification_service import NotificationService

# Session reminder
NotificationService.create_session_reminder(user)

# Mood insight
NotificationService.create_mood_insight(
    user=user,
    insight_text="You seem to be experiencing more positive emotions this week!",
    mood_data={'score': 85}
)

# Weekly report
NotificationService.create_weekly_report(
    user=user,
    stats={'total_entries': 7, 'avg_mood': 75}
)

# Streak alert
NotificationService.create_streak_alert(user, streak_count=7)

# AI suggestion
NotificationService.create_ai_suggestion(
    user=user,
    suggestion_text="Try a 5-minute breathing exercise to help manage stress.",
    context={'emotion': 'anxious'}
)

# Recommendation
NotificationService.create_recommendation_notification(
    user=user,
    recommendation_title="Try meditation today",
    recommendation_id=123
)
```

### Checking User Preferences

```python
# Check if notification should be sent
should_send = NotificationService.should_send_notification(
    user=user,
    notification_type='ai_suggestion'
)

if should_send:
    NotificationService.create_ai_suggestion(user, "...")
```

### Automatic Notifications

Notifications are automatically created:

1. **After AI Chat Response** (`views.py` - `send_message`)
   - Creates `ai_suggestion` notification after each AI response
   - Only if user has `ai_suggestions` enabled in settings

2. **After Emotion Prediction** (To be implemented)
   - When emotion is detected from image/video/text
   - Creates `mood_insight` notification

3. **After Recommendation** (To be implemented)
   - When new recommendation is generated
   - Creates `recommendation` notification

## Frontend Usage

### Notification Bell Component

```tsx
import NotificationBell from '@/components/NotificationBell';

// In your header/nav:
<NotificationBell />
```

### Notification Dropdown Component

```tsx
import NotificationDropdown from '@/components/NotificationDropdown';

// In your header/nav:
<NotificationDropdown />
```

### API Functions

```typescript
import {
  apiGetNotifications,
  apiGetUnreadCount,
  apiMarkNotificationAsRead,
  apiDeleteNotification,
  apiClearAllNotifications,
} from '@/lib/api';

// Get notifications
const data = await apiGetNotifications(accessToken, 50, false);

// Get unread count
const { unread_count } = await apiGetUnreadCount(accessToken);

// Mark as read
await apiMarkNotificationAsRead(accessToken, notificationId);

// Mark all as read
await apiMarkNotificationAsRead(accessToken, undefined, true);

// Delete notification
await apiDeleteNotification(accessToken, notificationId);

// Clear all
await apiClearAllNotifications(accessToken);
```

## User Preferences

Users can control notifications in Settings:

```typescript
{
  session_reminders: true,      // Reminders for emotional check-ins
  mood_insights: true,           // Personalized mood insights
  weekly_reports: false,         // Weekly summaries
  streak_alerts: true,           // Streak notifications
  ai_suggestions: true,          // AI companion suggestions
  email_notifications: true,     // Email delivery
  push_notifications: false      // Browser push notifications
}
```

## Migration

Run migrations to create the Notification model:

```bash
cd backend
python manage.py makemigrations recommendations
python manage.py migrate
```

## Testing

### Test Notification Creation

```bash
curl -X POST http://localhost:8000/api/notifications/test/ \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"type": "session_reminder"}'
```

### Test Get Notifications

```bash
curl -X GET "http://localhost:8000/api/notifications/?limit=10" \
  -H "Authorization: Bearer <your-token>"
```

## Future Enhancements

1. **Email Notifications**
   - Integrate with SendGrid/AWS SES
   - Send email when `email_notifications` is enabled

2. **Push Notifications**
   - Implement Web Push API
   - Service Worker for background notifications

3. **Scheduled Notifications**
   - Celery/Django-Q for task scheduling
   - Daily session reminders at user's preferred time
   - Weekly reports every Monday

4. **Real-time Updates**
   - WebSocket integration for instant notifications
   - Server-sent events as alternative

5. **Notification Templates**
   - Customizable notification messages
   - Multi-language support

## Security

- All notifications are user-scoped (only user can see their own)
- Authentication required for all endpoints
- Notification preferences stored encrypted (AES-256-GCM)
- Rate limiting recommended for production

## Performance

- Database indexes on `user` and `is_read` fields
- Pagination supported (default limit: 50)
- Automatic cleanup of old notifications (to be implemented)

---

**Last Updated:** December 6, 2025
**Version:** 1.0.0

