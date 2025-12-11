# Notification Frontend Setup Guide

## ✅ What Was Done

1. **Replaced static notification bell** with `NotificationDropdown` component in:
   - `frontend/src/components/Header.tsx`
   - `frontend/src/components/layout/header.tsx`

2. **Added automatic polling** - Unread count updates every 30 seconds

3. **Component features:**
   - Shows unread count badge
   - Dropdown with notification list
   - Mark as read functionality
   - Delete notifications
   - Clear all notifications
   - Click to navigate to related pages

## 🎯 How to See Notifications

### Step 1: Verify Component is Added

The `NotificationDropdown` component is now integrated into your header. You should see:
- A bell icon in the top-right of your header
- A red badge showing unread count (if you have unread notifications)

### Step 2: Create a Test Notification

**Option A: Via Django Shell** (Easiest)
```bash
cd backend
python manage.py shell
```

```python
from django.contrib.auth import get_user_model
from recommendations.notification_service import NotificationService

User = get_user_model()
user = User.objects.first()  # Your user

# Create a test notification
NotificationService.create_ai_suggestion(
    user=user,
    suggestion_text="Test notification! This is working!"
)
```

**Option B: Via API** (Using curl or Postman)
```bash
curl -X POST http://localhost:8000/api/notifications/test/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "ai_suggestion"}'
```

**Option C: Automatic** (After AI Chat)
- Go to `/chat` page
- Send a message to AI companion
- Notification is automatically created after AI responds

### Step 3: View Notifications

1. **Look at the header** - You should see a bell icon with a red badge showing the unread count
2. **Click the bell icon** - A dropdown will open showing your notifications
3. **Interact with notifications:**
   - Click a notification to mark it as read and navigate (if it has an action_url)
   - Click the X button to delete a notification
   - Click "Mark all read" to mark all as read
   - Click "Clear all" to delete all notifications

## 🔍 Troubleshooting

### Issue: No notifications showing

**Check:**
1. ✅ Are notifications being created? Check backend logs or database
2. ✅ Is the user authenticated? Check browser console for auth errors
3. ✅ Check browser console for API errors
4. ✅ Verify the NotificationDropdown component is imported correctly

### Issue: Badge not updating

**Check:**
1. ✅ Wait 30 seconds - polling happens every 30 seconds
2. ✅ Check browser console for API errors
3. ✅ Verify `apiGetUnreadCount` is working (check Network tab)

### Issue: Dropdown not opening

**Check:**
1. ✅ Check browser console for JavaScript errors
2. ✅ Verify the component is properly imported
3. ✅ Check if there are any CSS/z-index issues

## 📊 Testing Checklist

- [ ] Bell icon appears in header
- [ ] Badge shows correct unread count
- [ ] Clicking bell opens dropdown
- [ ] Notifications appear in dropdown
- [ ] Can mark notification as read
- [ ] Can delete notification
- [ ] Can clear all notifications
- [ ] Badge updates after marking as read
- [ ] Badge updates after deleting
- [ ] Clicking notification navigates (if action_url exists)
- [ ] Polling updates badge every 30 seconds

## 🎨 Customization

### Change Polling Interval

In `NotificationDropdown.tsx`, change:
```typescript
const interval = setInterval(fetchUnreadCountOnly, 30000); // 30 seconds
```
To:
```typescript
const interval = setInterval(fetchUnreadCountOnly, 10000); // 10 seconds
```

### Change Notification Limit

In `NotificationDropdown.tsx`, change:
```typescript
const data = await apiGetNotifications(token, 10); // 10 notifications
```
To:
```typescript
const data = await apiGetNotifications(token, 20); // 20 notifications
```

## 📝 Next Steps

1. **Test the notification system** - Create some test notifications and verify they appear
2. **Check automatic notifications** - Send a message in chat and verify notification is created
3. **Test all features** - Mark as read, delete, clear all
4. **Verify badge updates** - Check that badge count updates correctly

---

**The notification system is now fully integrated!** 🎉

You should be able to see notifications in the header bell icon after creating them.


