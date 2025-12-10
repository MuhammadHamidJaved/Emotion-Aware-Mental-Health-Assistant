# Notification System Testing Guide

## Overview

This guide explains how to test the notification system without requiring email setup. The system works with in-app notifications by default.

## ✅ No Email Setup Required

**Good news!** You don't need to set up email for basic testing. The notification system works with:
- ✅ **In-app notifications** (stored in database, shown in UI)
- ❌ **Email notifications** (optional, requires SMTP setup)
- ❌ **Push notifications** (optional, requires Web Push API setup)

## Testing Steps

### 1. Run Migrations First

```bash
cd backend
python manage.py makemigrations recommendations
python manage.py migrate
```

This creates the `Notification` table in your database.

### 2. Start the Backend Server

```bash
cd backend
python manage.py runserver
```

### 3. Start the Frontend

```bash
cd frontend
npm run dev
```

### 4. Test Notification Creation via API

#### Option A: Using the Test Endpoint (Easiest)

1. **Login to your app** and get your access token from browser localStorage or network tab
2. **Use the test endpoint** to create notifications:

```bash
# Test Session Reminder
curl -X POST http://localhost:8000/api/notifications/test/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "session_reminder"}'

# Test Mood Insight
curl -X POST http://localhost:8000/api/notifications/test/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "mood_insight"}'

# Test Streak Alert
curl -X POST http://localhost:8000/api/notifications/test/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "streak_alert"}'

# Test AI Suggestion
curl -X POST http://localhost:8000/api/notifications/test/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "ai_suggestion"}'
```

#### Option B: Using Python/Django Shell

```python
# In Django shell: python manage.py shell
from django.contrib.auth import get_user_model
from recommendations.notification_service import NotificationService

User = get_user_model()
user = User.objects.first()  # Get your user

# Create different types of notifications
NotificationService.create_session_reminder(user)
NotificationService.create_mood_insight(user, "You've been feeling more positive this week!")
NotificationService.create_streak_alert(user, 7)
NotificationService.create_ai_suggestion(user, "Try a 5-minute meditation today")
```

#### Option C: Using Postman/Thunder Client

1. Create a POST request to `http://localhost:8000/api/notifications/test/`
2. Add header: `Authorization: Bearer YOUR_ACCESS_TOKEN`
3. Add header: `Content-Type: application/json`
4. Body (JSON):
```json
{
  "type": "session_reminder"
}
```

### 5. Test Automatic Notifications

#### Test AI Chat Notification

1. **Go to the Chat page** in your app (`/chat`)
2. **Send a message** to the AI companion
3. **Check notifications** - A notification should automatically be created after the AI responds

The notification is created in `backend/recommendations/views.py` in the `send_message` function.

### 6. Test Frontend Notification Display

#### Add NotificationDropdown to Header

1. **Find your header component** (likely `frontend/src/components/Header.tsx` or similar)
2. **Import and add the component**:

```tsx
import NotificationDropdown from '@/components/NotificationDropdown';

// In your header JSX:
<NotificationDropdown />
```

#### Test the UI

1. **Create some test notifications** (using methods above)
2. **Click the bell icon** in the header
3. **Verify**:
   - ✅ Notifications appear in dropdown
   - ✅ Unread count badge shows correct number
   - ✅ Can mark as read
   - ✅ Can delete notifications
   - ✅ Can clear all notifications

### 7. Test Notification Settings

1. **Go to Settings** → **Notifications tab**
2. **Toggle notification preferences**:
   - Session Reminders
   - Mood Insights
   - Weekly Reports
   - Streak Alerts
   - AI Suggestions
   - Email Notifications (doesn't send emails yet)
   - Push Notifications (doesn't send push yet)
3. **Click "Save Changes"**
4. **Verify settings persist** by refreshing the page

### 8. Test API Endpoints

#### Get Notifications
```bash
curl -X GET "http://localhost:8000/api/notifications/?limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Get Unread Count
```bash
curl -X GET "http://localhost:8000/api/notifications/unread-count/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Mark as Read
```bash
curl -X POST "http://localhost:8000/api/notifications/mark-read/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notification_id": 1}'
```

#### Mark All as Read
```bash
curl -X POST "http://localhost:8000/api/notifications/mark-read/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mark_all": true}'
```

#### Delete Notification
```bash
curl -X DELETE "http://localhost:8000/api/notifications/1/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Clear All
```bash
curl -X DELETE "http://localhost:8000/api/notifications/clear/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Expected Behavior

### ✅ What Works Now (No Setup Required)

1. **In-app notifications** - Stored in database, displayed in UI
2. **Notification preferences** - User can enable/disable each type
3. **Automatic notifications** - Created after AI chat responses
4. **Notification management** - Mark as read, delete, clear all
5. **Unread count badge** - Shows number of unread notifications

### ❌ What Requires Additional Setup

1. **Email notifications** - Requires SMTP server (SendGrid, AWS SES, etc.)
2. **Push notifications** - Requires Web Push API setup and service worker
3. **Scheduled notifications** - Requires Celery/Django-Q for task scheduling

## Troubleshooting

### Issue: Notifications not appearing

**Check:**
1. ✅ Migrations ran successfully
2. ✅ User is authenticated (has valid JWT token)
3. ✅ Notification preferences allow the notification type
4. ✅ Check browser console for errors
5. ✅ Check backend logs for errors

### Issue: "Notification not found" error

**Check:**
1. ✅ Notification ID exists in database
2. ✅ Notification belongs to the authenticated user
3. ✅ User has permission to access the notification

### Issue: Settings not saving

**Check:**
1. ✅ User is authenticated
2. ✅ Backend server is running
3. ✅ Check browser network tab for API errors
4. ✅ Check backend logs for errors

## Database Verification

### Check Notifications in Database

```python
# Django shell: python manage.py shell
from recommendations.models import Notification
from django.contrib.auth import get_user_model

User = get_user_model()
user = User.objects.first()

# Get all notifications for user
notifications = Notification.objects.filter(user=user)
print(f"Total notifications: {notifications.count()}")
print(f"Unread: {notifications.filter(is_read=False).count()}")

# View notification details
for notif in notifications[:5]:
    print(f"{notif.id}: {notif.title} - Read: {notif.is_read}")
```

## Next Steps (Optional)

### 1. Add Email Notifications (Optional)

If you want email notifications, you'll need:

1. **SMTP Server** (SendGrid, AWS SES, Gmail SMTP, etc.)
2. **Django Email Backend** configuration in `settings.py`
3. **Update NotificationService** to send emails when `email_notifications` is enabled

### 2. Add Push Notifications (Optional)

If you want browser push notifications:

1. **Web Push API** setup
2. **Service Worker** registration
3. **VAPID keys** for push service
4. **Update NotificationService** to send push when `push_notifications` is enabled

### 3. Add Scheduled Notifications (Optional)

For scheduled notifications (daily reminders, weekly reports):

1. **Install Celery** or **Django-Q**
2. **Configure task scheduler**
3. **Create scheduled tasks** for:
   - Daily session reminders at user's preferred time
   - Weekly reports every Monday
   - Streak alerts when streak milestones are reached

## Summary

✅ **You can test the notification system right now without any email setup!**

The system works with:
- In-app notifications (database + UI)
- User preferences (enable/disable types)
- Automatic triggers (after AI responses)
- Full CRUD operations (create, read, update, delete)

Email and push notifications are **optional enhancements** that can be added later if needed.

---

**Happy Testing!** 🎉

