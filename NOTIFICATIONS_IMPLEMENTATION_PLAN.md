# Notifications – Complete Implementation Plan (In‑App + Email + Web Push)

**Repo:** emotion-assistant-system  
**Date:** 2026‑03‑23  

## 0) What you already have (baseline)

### In‑app notifications (✅ exists)
- DB model: `backend/recommendations/models.py` → `Notification`
- Service: `backend/recommendations/notification_service.py` → `NotificationService.create_*` helpers
- APIs: `backend/recommendations/notification_views.py` (list, unread count, mark-read, delete, clear, test)

### Notification preferences (✅ exists, but only toggles)
- Stored encrypted per-user JSON: `backend/users/settings_models.py` → `UserPreferences.notification_settings`
- Settings endpoint returns these defaults: `backend/users/settings_views.py` → `settings_notifications`
  - `session_reminders`, `mood_insights`, `weekly_reports`, `streak_alerts`, `ai_suggestions`, `email_notifications`, `push_notifications`

### What’s missing (❌ to implement)
- **Scheduling engine** to automatically generate reminders/reports/insights.
- **Email delivery**: SMTP config + send logic + templates + async execution.
- **Web Push delivery**: VAPID keys + subscription storage + service worker push handlers + sending.
- **Delivery logging + retries** (recommended): so failures don’t disappear.

---

## 1) Target behavior (what “done” looks like)

### Notification types
You already have these `type` values; the plan makes them fully functional:
- `session_reminder` (scheduled)
- `mood_insight` (scheduled or event-driven)
- `weekly_report` (scheduled)
- `streak_alert` (event-driven)
- `ai_suggestion` (event-driven)
- `recommendation` (event-driven)
- `system` (admin/manual)

### Channels
For each notification event, you will support:
- **In‑app**: always stored in DB (what you already do)
- **Email**: optional, based on user preference + availability of email
- **Push (Web Push)**: optional, based on user preference + active subscription(s)

### Key rule
**Create the in‑app notification first**, then deliver via email/push **asynchronously** (so API requests stay fast and reliable).

---

## 2) Design decisions (recommended defaults)

### Scheduling stack
Use **Celery + Redis + Celery Beat**.
- Celery Worker: executes asynchronous delivery tasks.
- Celery Beat: triggers periodic scheduling tasks.

Why this stack:
- Standard in Django projects.
- Works for periodic jobs.
- Gives retries, backoff, monitoring, and a clear deployment story.

> Windows note: Celery on Windows requires `-P solo` (details in Deployment section).

### Timezone handling
You currently have `User.preferred_checkin_time` but no timezone.
Recommended: add a timezone field.

**Option A (recommended):** Add to user model:
- `users.User.timezone` → `CharField(max_length=64, default='UTC')`

**Option B (minimal migrations):** Store timezone inside `notification_settings` JSON.

Pick one and standardize everywhere.

---

## 3) Environment variables (add these to your `.env`)

### Backend (`backend/.env` or your environment)
**Celery / Redis**
- `REDIS_URL=redis://localhost:6379/0`
- `CELERY_BROKER_URL=${REDIS_URL}`
- `CELERY_RESULT_BACKEND=${REDIS_URL}`

**Site / links (used inside emails + push click actions)**
- `BACKEND_BASE_URL=http://localhost:8000` (or production URL)
- `FRONTEND_BASE_URL=http://localhost:3000` (or production URL)

**Email (SMTP)**
- `EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend`
- `EMAIL_HOST=smtp.gmail.com` (or SendGrid/Mailgun SMTP)
- `EMAIL_PORT=587`
- `EMAIL_USE_TLS=true`
- `EMAIL_HOST_USER=your_email@domain.com`
- `EMAIL_HOST_PASSWORD=your_app_password_or_smtp_key`
- `DEFAULT_FROM_EMAIL=Emotion Assistant <no-reply@domain.com>`

**Web Push (VAPID)**
- `VAPID_SUBJECT=mailto:admin@domain.com` (or URL like `https://yourdomain.com`)
- `VAPID_PUBLIC_KEY=...`
- `VAPID_PRIVATE_KEY=...`

**Security / rate limits (optional but recommended)**
- `PUSH_MAX_SUBSCRIPTIONS_PER_USER=5`

### Frontend (`frontend/.env.local`)
- `NEXT_PUBLIC_API_URL=http://localhost:8000` (if you use this pattern)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY=...` (same as backend VAPID public key)

> If your frontend already centralizes API URL in code, keep using it—but still put a runtime env var in place for deployments.

---

## 4) Dependencies to add

### Backend (`backend/requirements.txt`)
Add:
- `celery`
- `redis`
- `django-celery-beat`
- `django-celery-results` (optional, but helpful)
- `pywebpush`

(Keep your existing encryption dependencies as-is.)

---

## 5) Database changes (models/migrations)

### 5.1 Push subscriptions (required for web push)
Create a model, e.g. `backend/recommendations/push_models.py` or `backend/users/push_models.py`:

**Model: `PushSubscription`**
- `user` (FK)
- `endpoint` (URL) — unique per subscription
- `p256dh` (string)
- `auth` (string)
- `user_agent` (string, optional)
- `is_active` (bool)
- `created_at`, `updated_at`

**Uniqueness**
- Unique constraint on `endpoint`

**Security note**
- `p256dh`/`auth` are not “passwords”, but still treat them as sensitive.
- Storing encrypted is optional; storing plaintext is typical.

### 5.2 Delivery attempts log (highly recommended)
This prevents “silent failures” and makes debugging/analytics possible.

**Model: `NotificationDeliveryAttempt`**
- `notification` (FK to `Notification`)
- `channel` (choices: `email`, `push`)
- `status` (choices: `queued`, `sent`, `failed`)
- `attempt_count` (int)
- `last_error` (text)
- `last_attempt_at` (datetime)
- `provider_message_id` (text, optional)

### 5.3 Optional: Scheduled jobs per user
You can implement scheduling in two ways:

**Approach 1 (simpler to start):**
- Celery Beat runs frequently (e.g., every 5–15 minutes)
- It scans users and decides who is “due”

**Approach 2 (scales better):**
- Store per-user next run timestamps in a table
- Update `next_run_at` each time you schedule

If your user base is small/medium, Approach 1 is fine for FYP.

### 5.4 Timezone field (if you choose Option A)
Add to `backend/users/models.py`:
- `timezone = models.CharField(max_length=64, default='UTC')`

---

## 6) Backend architecture to implement

### 6.1 Keep your current `NotificationService` as the “source of truth”
Enhance it to:
1) Create in‑app `Notification` (already does)
2) If allowed by preferences:
   - enqueue email task
   - enqueue push task

Do **not** send emails/push directly in the request thread.

### 6.2 Add a dispatcher layer (recommended)
Create a new module, for example:
- `backend/recommendations/notification_dispatcher.py`

Responsibilities:
- Read user notification settings (already available)
- Decide which channels to deliver
- Create `NotificationDeliveryAttempt` rows (queued)
- Enqueue Celery tasks with the notification id

### 6.3 Add Celery configuration
Create:
- `backend/config/celery.py`
- Update `backend/config/__init__.py` to load celery app
- Add Celery settings to `backend/config/settings.py`

Typical Celery config:
- broker + backend
- JSON serializer
- timezone (use UTC or your project timezone)
- task retries

### 6.4 Implement Celery tasks
Create e.g. `backend/recommendations/tasks.py`:
- `deliver_notification_email(notification_id)`
- `deliver_notification_push(notification_id)`
- `schedule_session_reminders()`
- `schedule_weekly_reports()`
- `schedule_mood_insights()`

Each delivery task should:
- Load `Notification` + user
- Re-check preferences (preference could change after enqueue)
- Attempt delivery
- Update `NotificationDeliveryAttempt`
- Use retries with exponential backoff

---

## 7) Email notifications – implementation steps

### 7.1 Backend settings
In `backend/config/settings.py`:
- Add Django email settings reading env vars
- Ensure `DEFAULT_FROM_EMAIL` is set

### 7.2 Email content
Create templates (recommended):
- `backend/templates/emails/notification.html`
- `backend/templates/emails/notification.txt`

Email should include:
- Title
- Message
- A “View in app” link to `FRONTEND_BASE_URL + notification.action_url`

### 7.3 Sending logic
In `deliver_notification_email` task:
- Use `EmailMultiAlternatives` or `send_mail`
- Set subject = notification title
- Include HTML + text version

### 7.4 Preference rules
Deliver email only if:
- `email_notifications == true`
- specific type flag is enabled (`session_reminders`, etc.)
- user has a valid email

### 7.5 Weekly report email content
If you want “real” weekly reports (not just “go check insights”), compute stats:
- count of check-ins
- mood averages/trends
- streak changes
- top tags/emotions

Store stats into `Notification.metadata` so:
- in-app view can show details
- email template can render meaningful content

---

## 8) Web Push notifications – implementation steps

### 8.1 Generate VAPID keys
Generate once per environment:
- Save private key only on server
- Publish public key to frontend env var

### 8.2 Backend subscription endpoints
Add authenticated endpoints, for example:
- `POST /api/push/subscribe/`
- `POST /api/push/unsubscribe/`
- `GET /api/push/subscriptions/` (optional for debugging)

**Subscribe payload** (from browser `PushSubscription.toJSON()`):
- `endpoint`
- `keys.p256dh`
- `keys.auth`
- optional: `user_agent`

Server should:
- upsert by `endpoint`
- mark `is_active=True`
- enforce `PUSH_MAX_SUBSCRIPTIONS_PER_USER`

Unsubscribe should:
- mark inactive or delete

### 8.3 Sending push messages
In `deliver_notification_push` task:
- Load active subscriptions for user
- Build payload JSON:
  - `title`, `message`, `action_url`, `notification_id`
- Use `pywebpush.webpush(...)` with VAPID keys
- If a subscription is gone (410/404), mark it inactive

### 8.4 Frontend: service worker push handlers
Your current `frontend/public/sw.js` is a stub.
Update it to handle:
- `self.addEventListener('push', ...)` → show notification
- `self.addEventListener('notificationclick', ...)` → open/focus window and navigate to `action_url`

**Secure context requirement**
- Web Push requires a secure context: **HTTPS in production**.
- `http://localhost` is treated as secure by browsers for development, so it’s OK for local testing.

### 8.5 Frontend: permission + subscription flow
In the Settings → Notifications tab:
- When user enables `push_notifications`, request permission:
  - `Notification.requestPermission()`
- If granted, register SW and subscribe:
  - `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY })`
- POST subscription to backend

**UX requirement**
- Permission prompts must be triggered by a user gesture (e.g., clicking an “Enable push” button/toggle), otherwise some browsers will block it.

If the user disables push:
- Unsubscribe client-side
- Call backend unsubscribe

> Important: Always keep the server-side toggle (`push_notifications`) and the browser subscription state in sync.

---

## 9) Scheduling – session reminders / mood insights / weekly reports

### 9.1 Add settings fields (recommended)
Extend `notification_settings` JSON to include schedule configuration.

Suggested schema additions:
- `timezone`: e.g. `"Asia/Karachi"` (if you don’t add a user field)
- `session_reminder_time`: e.g. `"20:00"`
- `session_reminder_days`: array of weekdays
- `weekly_report_day`: e.g. `"sun"`
- `weekly_report_time`: e.g. `"19:00"`
- `mood_insight_frequency`: `"daily" | "weekly"`

### 9.2 Periodic scheduler task strategy
Configure Celery Beat to run a task every 5–15 minutes:
- `tick_scheduled_notifications()`

This task:
- Iterates users with reminders enabled
- Converts “now” into each user’s timezone
- Checks if the user is due for a reminder/report
- Prevents duplicates (see below)
- Creates notification(s) via `NotificationService`

### 9.3 Prevent duplicates
Add a safe dedupe rule, for example:
- For `session_reminder`: only 1 per user per local day
- For `weekly_report`: only 1 per user per ISO week
- For `mood_insight`: 1 per day/week based on frequency

Implementation options:
- Query recent notifications by type + created_at window
- Or store `last_sent_at` per type in a table / settings JSON

### 9.4 How to compute the content
- **Session reminder:** static content + action_url to check-in
- **Mood insight:** compute from recent check-ins
- **Weekly report:** compute weekly aggregates

For mood insight / weekly report, keep the computation in a separate service:
- `backend/assistant/insights_service.py` (or similar)
so tasks stay small.

---

## 10) Update the API reference + front-end integration

### 10.1 Backend endpoints to document
Add to `API_REFERENCE.md` (after implementation):
- Push subscribe/unsubscribe endpoints
- Any new scheduler debug endpoints (optional)

### 10.2 Frontend API helpers
Add/extend `frontend/src/lib/api.ts`:
- `apiPushSubscribe(subscriptionJson)`
- `apiPushUnsubscribe(endpoint)` (or no payload if server clears all)

---

## 11) Deployment / running locally (Windows-friendly)

### 11.1 Redis
Choose one:
- Docker: run `redis` container
- WSL: install redis inside WSL
- Native Windows: third-party redis builds (less recommended)

### 11.2 Start services (local)
You will run three backend processes:
1) Django API: `python manage.py runserver`
2) Celery worker:
   - Windows: `celery -A config worker -l info -P solo`
3) Celery beat:
   - `celery -A config beat -l info`

### 11.3 Production
- Run Celery worker(s) and beat as separate services (systemd, docker-compose, or platform workers)
- Keep `VAPID_PRIVATE_KEY` server-only

---

## 12) Testing & verification checklist

### 12.1 Unit tests (backend)
- Preferences gating: turning off any toggle stops scheduling + delivery
- Email delivery task: success path + failure path logs
- Push delivery task: handles 410/404 by disabling subscription
- Dedupe rules: prevents duplicates

### 12.2 Integration tests
- Subscribe push from browser → stored in DB
- Trigger `test_notification` → in-app record appears
- Delivery logs show email/push attempts (if enabled)

### 12.3 Manual QA
- Settings toggles:
  - Enable push → permission prompt → subscription stored
  - Disable push → subscription removed + no push sends
  - Disable email → no email sends
- Scheduled reminders actually appear at configured time

---

## 13) Implementation order (recommended)

1) Add Celery + Redis + beat wiring (no email/push yet)
2) Implement scheduler tasks to create in-app notifications
3) Add email sending (simpler than push)
4) Add push subscriptions + service worker + push delivery
5) Add delivery logs + retries if not already done

---

## 14) “Minimum Complete” vs “Full” scope

### Minimum complete (for FYP demo)
- In-app + scheduler + at least one channel (email or push)
- Subscription storage (if push)
- Basic templates

### Full scope (production-ready)
- Delivery logs, retries, monitoring
- Rate limiting
- Rich weekly report content
- Multi-device subscriptions

---

## 15) Notes specific to your current codebase

- Your preference keys already exist (`session_reminders`, `weekly_reports`, `email_notifications`, `push_notifications`, etc.). Keep them.
- `NotificationService.should_send_notification` currently maps types to keys; extend it carefully if you add more types.
- `settings_notifications` currently does `request.data.copy()`; that’s OK because it’s not multipart.
- The existing in-app inbox APIs are enough; don’t add UI complexity unless needed.
