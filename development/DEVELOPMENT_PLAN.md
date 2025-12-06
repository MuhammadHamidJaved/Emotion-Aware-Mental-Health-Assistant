# Emotion Journal System - Development Plan

## Overview
This document outlines the complete development plan for the Emotion-Aware Mental Health Assistant. The plan is organized into phases, with each phase building upon the previous one.

**Core Functionality**: Emotion detection from multiple modalities with priority:
1. **PRIMARY**: Image/Real-time Video (AffectNet dataset model)
2. **SECONDARY**: Text
3. **TERTIARY**: Voice

See `EMOTION_DETECTION_ARCHITECTURE.md` for detailed emotion detection service architecture.

---

## ✅ Phase 0: Completed Features

### Backend
- [x] User authentication (JWT-based)
- [x] User registration and login
- [x] User profile management (CRUD)
- [x] Profile picture upload (Cloudinary)
- [x] RAG Chat Bot integration (Pinecone + Gemini)
- [x] Chat message storage and retrieval
- [x] PostgreSQL database setup (Neon)
- [x] CORS configuration
- [x] **Database Models (already exist but not connected to APIs)**:
  - [x] `JournalEntry` model (missing `emotion` field - needs migration)
  - [x] `EntryTag` model
  - [x] `EntryTagRelation` model
  - [x] `EntryMedia` model
  - [x] `EmotionDetection` model (for future ML)
  - [x] `MoodCheckIn` model
  - [x] `Recommendation` model
  - [x] `UserRecommendation` model
  - [x] `AIChatMessage` model

### Frontend
- [x] Authentication pages (Login, Signup)
- [x] Dashboard with stats (UI only - needs API connection)
- [x] Profile page (view and edit)
- [x] Chat interface (RAG bot - fully functional)
- [x] Recommendations page (UI only - needs API connection)
- [x] Journal entries list (UI only - needs API connection)
- [x] Modern, compact, minimalist UI design
- [x] Auth context and session management
- [x] Protected routes

---

## 📋 Phase 1: Journal Entry Management (Priority: HIGH)

### Backend Implementation

#### 1.1 Database Models - UPDATE EXISTING
**File: `backend/journal/models.py`**
- [x] `JournalEntry` model **EXISTS** but needs:
  - [ ] **Add `emotion` field** (CharField) - **Static selection for now**
    ```python
    emotion = models.CharField(max_length=50, blank=True, help_text='User-selected emotion')
    ```
  - [ ] **Add `emotion_confidence` field** (FloatField, optional) - For future ML integration
    ```python
    emotion_confidence = models.FloatField(null=True, blank=True, help_text='ML confidence score (0-1)')
    ```
  - [x] `user` (ForeignKey) - ✅ EXISTS
  - [x] `title` (CharField) - ✅ EXISTS
  - [x] `text_content` (TextField) - ✅ EXISTS (named `text_content`, not `content`)
  - [x] `entry_type` (CharField) - ✅ EXISTS
  - [x] `word_count` (IntegerField) - ✅ EXISTS
  - [x] `created_at`, `updated_at` - ✅ EXISTS
  - [x] `is_favorite` - ✅ EXISTS (similar to `is_archived`)
  - [x] `is_draft` - ✅ EXISTS
  - [x] Tags support via `EntryTag` and `EntryTagRelation` - ✅ EXISTS
  - [x] Media support via `EntryMedia` - ✅ EXISTS
  - [x] Voice/Video file support - ✅ EXISTS

#### 1.2 API Endpoints - CREATE NEW
**File: `backend/journal/views.py`** (currently empty - needs full implementation)
- [ ] `POST /api/journal/entries/` - Create new entry
  - Accept: `title`, `text_content`, `emotion` (required), `entry_type`, `tags[]`, `entry_date`
  - Handle file uploads: `voice_file`, `video_file`, `media_files[]`
  - Auto-calculate `word_count` from `text_content`
  - Return: Created entry with ID
- [ ] `GET /api/journal/entries/` - List user's entries
  - Query params: `?page=1&limit=20&emotion=happy&type=text&search=keyword&date_from=&date_to=`
  - Filter by tags: `?tags=work,family`
  - Return: Paginated list with entry tags included
- [ ] `GET /api/journal/entries/{id}/` - Get single entry
  - Include: entry data, tags, media files, emotion detections (if any)
- [ ] `PATCH /api/journal/entries/{id}/` - Update entry
  - Allow updating: title, text_content, emotion, tags, is_favorite, is_draft
- [ ] `DELETE /api/journal/entries/{id}/` - Delete entry
  - Hard delete (or implement soft delete with `is_archived` if preferred)
- [ ] `GET /api/journal/entries/stats/` - Get entry statistics
  - Return: `total_entries`, `entries_by_emotion`, `entries_by_type`, `word_count_avg`, `streak_days`, `favorite_count`

#### 1.3 Serializers - CREATE NEW
**File: `backend/journal/serializers.py`** (needs to be created)
- [ ] `JournalEntrySerializer` - Full entry data
  - Include: all fields + nested tags, media files
  - Read-only: `word_count`, `created_at`, `updated_at`
- [ ] `JournalEntryCreateSerializer` - For creation
  - Validate: `emotion` is required and in allowed list
  - Validate: `text_content` required for text entries
  - Validate: `voice_file` or `video_file` for respective types
  - Auto-calculate `word_count`
- [ ] `JournalEntryUpdateSerializer` - For updates
  - Allow partial updates
- [ ] `JournalStatsSerializer` - For statistics
- [ ] `EntryTagSerializer` - For tag data
- [ ] `EntryMediaSerializer` - For media files

#### 1.4 URL Configuration - CREATE NEW
**File: `backend/journal/urls.py`** (needs to be created)
```python
from django.urls import path
from . import views

urlpatterns = [
    path('journal/entries/', views.JournalEntryListCreateView.as_view()),
    path('journal/entries/<int:pk>/', views.JournalEntryDetailView.as_view()),
    path('journal/entries/stats/', views.JournalStatsView.as_view()),
    path('journal/tags/', views.TagListView.as_view()),
]
```

**Update `backend/config/urls.py`**:
```python
path("api/", include("journal.urls")),  # Add this line
```

### Frontend Implementation

#### 1.5 Journal Entry Creation Page
**File: `frontend/src/app/journal/new/page.tsx`**
- [ ] Form with:
  - Title input (optional)
  - Content textarea (required)
  - **Emotion selector** (dropdown/radio buttons) - **STATIC for now**
    - Options: happy, sad, anxious, calm, excited, angry, grateful, confident, etc.
  - Entry type selector (text/voice/video)
  - Tags input (multi-select or comma-separated)
  - Save button
- [ ] Validation and error handling
- [ ] Success redirect to entry detail page

#### 1.6 Journal Entry Detail Page
**File: `frontend/src/app/journal/[id]/page.tsx`**
- [ ] Display full entry content
- [ ] Show emotion badge with color
- [ ] Edit button (links to edit page)
- [ ] Delete button (with confirmation)
- [ ] Tags display
- [ ] Created/updated timestamps

#### 1.7 Journal Entry Edit Page
**File: `frontend/src/app/journal/[id]/edit/page.tsx`**
- [ ] Pre-filled form with existing data
- [ ] Same form structure as create page
- [ ] Update API call
- [ ] Success redirect

#### 1.8 Journal List Page (Enhancement)
**File: `frontend/src/app/journal/page.tsx`**
- [ ] Connect to real API (`GET /api/journal/entries/`)
- [ ] Add filters:
  - Emotion filter dropdown
  - Type filter (text/voice/video)
  - Search input
  - Date range picker
- [ ] Pagination
- [ ] Loading states
- [ ] Empty state

#### 1.9 API Functions
**File: `frontend/src/lib/api.ts`**
- [ ] `apiCreateJournalEntry(payload)` - POST `/api/journal/entries/`
  - Payload: `{title, text_content, emotion, entry_type, tags[], entry_date, voice_file?, video_file?}`
  - Use FormData for file uploads
- [ ] `apiGetJournalEntries(params?)` - GET `/api/journal/entries/`
  - Query params: `page, limit, emotion, type, search, date_from, date_to, tags`
- [ ] `apiGetJournalEntry(id)` - GET `/api/journal/entries/{id}/`
- [ ] `apiUpdateJournalEntry(id, payload)` - PATCH `/api/journal/entries/{id}/`
- [ ] `apiDeleteJournalEntry(id)` - DELETE `/api/journal/entries/{id}/`
- [ ] `apiGetJournalStats()` - GET `/api/journal/entries/stats/`
- [ ] `apiGetTags()` - GET `/api/journal/tags/`
- [ ] `apiCreateTag(name, color?)` - POST `/api/journal/tags/`

---

## 📋 Phase 2: Mood Tracking & Analytics (Priority: HIGH)

### Backend Implementation

#### 2.1 Mood Tracking Models - ALREADY EXISTS
**File: `backend/emotions/models.py`**
- [x] `MoodCheckIn` model **EXISTS**:
  - [x] `user` (ForeignKey)
  - [x] `mood` (CharField with choices)
  - [x] `intensity` (IntegerField, 1-10)
  - [x] `note` (CharField, max 200)
  - [x] `checked_in_at` (DateTimeField)
  - [ ] **Optional Enhancement**: Add `triggers` (JSONField) if needed

- [x] `EmotionDetection` model **EXISTS** (for future ML):
  - Links to `JournalEntry`
  - Stores emotion probabilities
  - **Not used for static mood selection** - keep for future ML integration

#### 2.2 Analytics Endpoints
**File: `backend/journal/views.py` or `backend/insights/views.py`**
- [ ] `GET /api/insights/mood-trend/` - Mood over time
  - Query: `?days=7&group_by=day`
  - Return: Array of `{date, emotion, count, avg_intensity}`
- [ ] `GET /api/insights/emotion-distribution/` - Pie chart data
  - Return: `{emotion: count}` for last N days
- [ ] `GET /api/insights/word-frequency/` - Most used words
  - Return: `[{word, count}]` sorted by count
- [ ] `GET /api/insights/patterns/` - Time-based patterns
  - Return: `{hourly_patterns, weekly_patterns, monthly_patterns}`
- [ ] `GET /api/insights/streak/` - Current and longest streak
  - Return: `{current_streak, longest_streak, streak_start_date}`

### Frontend Implementation

#### 2.3 Insights Page
**File: `frontend/src/app/insights/page.tsx`**
- [ ] Mood trend chart (line chart - last 7/30 days)
- [ ] Emotion distribution (pie chart)
- [ ] Word cloud or frequency list
- [ ] Time patterns visualization
- [ ] Streak display
- [ ] Date range selector
- [ ] Connect to analytics API

#### 2.4 Dashboard Enhancements
**File: `frontend/src/app/dashboard/page.tsx`**
- [ ] Replace mock data with real API calls
- [ ] `apiGetJournalStats()` for stats cards
- [ ] `apiGetMoodTrend()` for mood chart
- [ ] `apiGetEmotionDistribution()` for pie chart
- [ ] Loading states
- [ ] Error handling

---

## 📋 Phase 3: Recommendations System (Priority: MEDIUM)

### Backend Implementation

#### 3.1 Recommendation Models - ALREADY EXISTS
**File: `backend/recommendations/models.py`**
- [x] `Recommendation` model **EXISTS**:
  - [x] `title` (CharField)
  - [x] `description` (TextField)
  - [x] `category` (CharField: 'exercise', 'music', 'article', 'video', 'meditation')
  - [x] `content_url` (URLField)
  - [x] `thumbnail_url` (URLField)
  - [x] `duration` (IntegerField, minutes)
  - [x] `target_emotions` (JSONField) - ✅ Already has this!
  - [x] `difficulty` (CharField)
  - [x] `is_active` (BooleanField)
  - [ ] **Optional**: Add `tags` (JSONField) if needed
  - [ ] **Optional**: Add `effectiveness_score` (FloatField) if needed

- [x] `UserRecommendation` model **EXISTS**:
  - [x] `user` (ForeignKey)
  - [x] `recommendation` (ForeignKey)
  - [x] `is_completed` (BooleanField)
  - [x] `times_completed` (IntegerField)
  - [x] `rating` (IntegerField, 1-5)
  - [x] `is_bookmarked` (BooleanField)
  - [x] `recommended_at` (DateTimeField)
  - [x] `last_accessed` (DateTimeField)
  - [x] `completed_at` (DateTimeField)

#### 3.2 Recommendation Logic
**File: `backend/recommendations/helpers.py`**
- [ ] `get_recommendations_for_emotion(emotion, limit=10)`:
  - Query recommendations where `target_emotions` contains emotion
  - Sort by effectiveness_score or popularity
  - Return list
- [ ] `get_personalized_recommendations(user, limit=10)`:
  - Get user's recent emotions (from journal entries)
  - Get dominant emotion
  - Call `get_recommendations_for_emotion()`
  - Filter out already viewed (optional)
  - Return personalized list

#### 3.3 Recommendation Endpoints - PARTIALLY EXISTS
**File: `backend/recommendations/views.py`** (currently only has chat endpoints)
- [x] Chat endpoints exist (send, history, clear) - ✅ DONE
- [ ] `GET /api/recommendations/` - Get personalized recommendations
  - Query: `?category=music&emotion=anxious&limit=10`
  - Logic: Use `get_personalized_recommendations()` helper
  - Return: List of recommendations with user engagement data
- [ ] `GET /api/recommendations/{id}/` - Get single recommendation
- [ ] `POST /api/recommendations/{id}/access/` - Mark as accessed (updates `last_accessed`)
- [ ] `POST /api/recommendations/{id}/complete/` - Mark as completed
  - Updates `is_completed=True`, `times_completed++`, `completed_at`
- [ ] `POST /api/recommendations/{id}/bookmark/` - Toggle bookmark
  - Updates `is_bookmarked` in `UserRecommendation`
- [ ] `POST /api/recommendations/{id}/rate/` - Rate recommendation
  - Body: `{rating: 1-5}`
  - Updates `rating` in `UserRecommendation`

### Frontend Implementation

#### 3.4 Recommendations Page Enhancement
**File: `frontend/src/app/recommendations/page.tsx`**
- [ ] Connect to real API (`GET /api/recommendations/`)
- [ ] Replace mock data with API response
- [ ] Implement bookmark functionality
- [ ] Implement "Mark as completed" for exercises
- [ ] Implement rating system
- [ ] Filter by type (music/exercise/quote)
- [ ] Filter by emotion

#### 3.5 Music Player Integration
**File: `frontend/src/app/music/page.tsx`**
- [ ] Music player component
- [ ] Playlist from recommendations
- [ ] Play/pause controls
- [ ] Progress bar
- [ ] Volume control

#### 3.6 Exercise Tracker
**File: `frontend/src/app/exercises/page.tsx`**
- [ ] Exercise list from recommendations
- [ ] Start exercise button
- [ ] Timer component (for timed exercises)
- [ ] Mark as completed
- [ ] Progress tracking

---

## 📋 Phase 4: Tags & Categories (Priority: MEDIUM)

### Backend Implementation

#### 4.1 Tag Models - ALREADY EXISTS
**File: `backend/journal/models.py`**
- [x] `EntryTag` model **EXISTS**:
  - [x] `name` (CharField)
  - [x] `color` (CharField, hex color)
  - [x] `user` (ForeignKey) - User-specific tags
  - [x] `usage_count` (IntegerField)
  - [x] `created_at` (DateTimeField)
- [x] `EntryTagRelation` model **EXISTS** - Many-to-many relationship
- [ ] **Optional Enhancement**: Add `category` field to `EntryTag` if needed

#### 4.2 Tag Endpoints - CREATE NEW
**File: `backend/journal/views.py`**
- [ ] `GET /api/journal/tags/` - List user's tags
  - Return: All tags for authenticated user, sorted by usage_count
- [ ] `POST /api/journal/tags/` - Create custom tag
  - Body: `{name, color?}` (color defaults to random)
  - Validate: name is unique for user
- [ ] `GET /api/journal/tags/popular/` - Most used tags
  - Query: `?limit=10`
  - Return: Top N tags by usage_count
- [ ] `PATCH /api/journal/tags/{id}/` - Update tag (color, name)
- [ ] `DELETE /api/journal/tags/{id}/` - Delete tag (if not in use)

### Frontend Implementation

#### 4.3 Tags Page
**File: `frontend/src/app/tags/page.tsx`**
- [ ] Display all tags with colors
- [ ] Tag cloud visualization
- [ ] Filter entries by tag
- [ ] Create new tag
- [ ] Tag usage statistics

#### 4.4 Tag Input Component
**File: `frontend/src/components/TagInput.tsx`**
- [ ] Multi-select tag input
- [ ] Autocomplete from existing tags
- [ ] Create new tag on the fly
- [ ] Visual tag chips

---

## 📋 Phase 5: Calendar View (Priority: LOW)

### Backend Implementation

#### 5.1 Calendar Endpoints
**File: `backend/journal/views.py`**
- [ ] `GET /api/journal/calendar/` - Get entries for calendar view
  - Query: `?year=2025&month=1`
  - Return: `{date: [entries]}` mapping

### Frontend Implementation

#### 5.2 Calendar Page
**File: `frontend/src/app/calendar/page.tsx`**
- [ ] Full calendar component
- [ ] Month/year navigation
- [ ] Days with entries highlighted
- [ ] Click day to see entries
- [ ] Emotion color coding on days
- [ ] Entry count per day

---

## 📋 Phase 6: Settings & Preferences (Priority: LOW)

### Backend Implementation

#### 6.1 User Preferences
**File: `backend/users/models.py`** (extend existing User model)
- [ ] Already has: `preferred_journal_time`, `enable_notifications`, `enable_biometric`
- [ ] Add if needed:
  - `theme_preference` (CharField)
  - `language` (CharField)
  - `timezone` (CharField)
  - `notification_settings` (JSONField)

#### 6.2 Settings Endpoints
**File: `backend/users/views.py`**
- [ ] `PATCH /api/auth/me/` - Already exists, extend to handle all preferences

### Frontend Implementation

#### 6.3 Settings Page Enhancement
**File: `frontend/src/app/settings/page.tsx`**
- [ ] Account settings tab
- [ ] Notification preferences
- [ ] Privacy settings
- [ ] Theme selector
- [ ] Language selector
- [ ] Export data option
- [ ] Delete account option

---

## 📋 Phase 7: Voice & Video Entry Support (Priority: LOW)

### Backend Implementation

#### 7.1 Media Upload
**File: `backend/journal/views.py`**
- [ ] Extend `POST /api/journal/entries/` to accept:
  - `audio_file` (FileField) for voice entries
  - `video_file` (FileField) for video entries
- [ ] Upload to Cloudinary
- [ ] Store media URL in `JournalEntry.media_url`
- [ ] Transcribe audio (future: use speech-to-text API)

### Frontend Implementation

#### 7.2 Voice Recording
**File: `frontend/src/components/VoiceRecorder.tsx`**
- [ ] Record audio using Web Audio API
- [ ] Playback preview
- [ ] Upload to backend
- [ ] Show recording duration

#### 7.3 Video Recording
**File: `frontend/src/components/VideoRecorder.tsx`**
- [ ] Record video using MediaRecorder API
- [ ] Playback preview
- [ ] Upload to backend
- [ ] Show recording duration

---

## 📋 Phase 8: Search & Filtering (Priority: MEDIUM)

### Backend Implementation

#### 8.1 Search Endpoints
**File: `backend/journal/views.py`**
- [ ] Enhance `GET /api/journal/entries/` with:
  - Full-text search on `content` and `title`
  - Filter by date range
  - Filter by emotion
  - Filter by tags
  - Sort options (date, emotion, word_count)

### Frontend Implementation

#### 8.2 Advanced Search Component
**File: `frontend/src/components/SearchBar.tsx`**
- [ ] Search input with autocomplete
- [ ] Filter panel (emotion, date, tags, type)
- [ ] Sort dropdown
- [ ] Search results highlighting
- [ ] Clear filters button

---

## 📋 Phase 9: Export & Backup (Priority: LOW)

### Backend Implementation

#### 9.1 Export Endpoints
**File: `backend/journal/views.py`**
- [ ] `GET /api/journal/export/` - Export entries
  - Query: `?format=json|csv|pdf&start_date=&end_date=`
  - Return: File download

### Frontend Implementation

#### 9.2 Export UI
**File: `frontend/src/app/settings/page.tsx`**
- [ ] Export data button
- [ ] Format selector (JSON/CSV/PDF)
- [ ] Date range picker
- [ ] Download file

---

## 📋 Phase 10: Social Features (Optional - Future)

### Backend Implementation
- [ ] Share entries (anonymized)
- [ ] Community insights
- [ ] Support groups

### Frontend Implementation
- [ ] Share modal
- [ ] Community page
- [ ] Support group finder

---

## 🔧 Technical Requirements

### Backend Dependencies (Already Installed)
- Django 5.1.3
- Django REST Framework
- djangorestframework-simplejwt
- django-cors-headers
- psycopg2-binary
- dj-database-url
- cloudinary
- python-decouple

### Frontend Dependencies (Already Installed)
- Next.js 15.5.4
- React
- Tailwind CSS
- Lucide React (icons)
- Recharts (charts)

### Additional Dependencies Needed
- [ ] `django-filter` - For advanced filtering
- [ ] `Pillow` - Already installed
- [ ] `python-dateutil` - For date parsing
- [ ] `reportlab` - For PDF export (if needed)

---

## 📝 Database Migration Checklist

Before starting each phase, run:
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

### Phase 1 Migrations
- [ ] **Add emotion fields to JournalEntry**:
  ```bash
  python manage.py makemigrations journal
  python manage.py migrate journal
  ```
  This will create a migration to add `emotion` and `emotion_confidence` fields.

### Phase 2 Migrations
- [ ] `python manage.py makemigrations emotions` (if separate app)
- [ ] `python manage.py migrate emotions`

### Phase 3 Migrations
- [ ] `python manage.py makemigrations recommendations`
- [ ] `python manage.py migrate recommendations`

### Phase 4 Migrations
- [ ] `python manage.py makemigrations journal` (Tag model)
- [ ] `python manage.py migrate journal`

---

## 🧪 Testing Checklist

For each phase, test:
- [ ] API endpoints with Postman/Thunder Client
- [ ] Frontend forms and validation
- [ ] Error handling (network errors, validation errors)
- [ ] Loading states
- [ ] Empty states
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Authentication (protected routes)

---

## 📚 API Documentation Template

For each endpoint, document:
- **Method**: GET/POST/PATCH/DELETE
- **URL**: `/api/...`
- **Auth**: Required/Not required
- **Request Body**: (if applicable)
- **Query Parameters**: (if applicable)
- **Response**: JSON structure
- **Status Codes**: 200, 400, 401, 404, 500

---

## 🎯 Implementation Order Recommendation

1. **Phase 1** (Journal Entries) - Core functionality
2. **Phase 2** (Analytics) - Builds on Phase 1
3. **Phase 8** (Search) - Enhances Phase 1
4. **Phase 3** (Recommendations) - Standalone but useful
5. **Phase 4** (Tags) - Enhances organization
6. **Phase 5** (Calendar) - Nice to have
7. **Phase 6** (Settings) - Polish
8. **Phase 7** (Voice/Video) - Advanced feature
9. **Phase 9** (Export) - Utility feature

---

## 📌 Important Notes

### Static Mood Selection
- For now, use a **dropdown/radio button** for emotion selection
- Store selected emotion in `JournalEntry.emotion`
- Keep `emotion_confidence` field for future ML integration
- When ML is ready, you can:
  1. Add ML prediction on backend
  2. Show both user-selected and ML-predicted emotion
  3. Let user choose which one to use

### No Hardcoding
- All data should come from database
- Use API calls for all data fetching
- Mock data only for development/testing
- Remove all mock data before production

### Error Handling
- Always handle API errors gracefully
- Show user-friendly error messages
- Log errors for debugging
- Provide fallback UI states

### Performance
- Use pagination for large lists
- Implement lazy loading where appropriate
- Cache frequently accessed data
- Optimize database queries

---

## 🚀 Getting Started

1. **Review this plan** and prioritize phases
2. **Start with Phase 1** (Journal Entries)
3. **Create database models** first
4. **Run migrations**
5. **Build API endpoints**
6. **Test with Postman**
7. **Build frontend components**
8. **Connect frontend to API**
9. **Test end-to-end**
10. **Move to next phase**

---

## 📞 Support

If you encounter issues:
1. Check Django logs (`python manage.py runserver`)
2. Check browser console for frontend errors
3. Check Network tab for API errors
4. Verify database migrations are applied
5. Verify environment variables are set

---

**Last Updated**: 2025-01-22
**Version**: 1.0.0

