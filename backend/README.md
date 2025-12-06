# Backend - Django REST API

Emotion-Aware Mental Health Journaling System - Backend API

## 📋 Setup Instructions

### 1. Create Virtual Environment (Optional but recommended)

```bash
python -m venv venv
```

### 2. Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Create Superuser (Admin)

```bash
python manage.py createsuperuser
```

### 6. Run Development Server

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000`

## 📁 Project Structure

```
backend/
├── config/              # Django project settings
│   ├── settings.py      # Main settings file
│   ├── urls.py          # Main URL configuration
│   └── wsgi.py          # WSGI configuration
├── users/               # User management app
│   ├── models.py        # Custom User model
│   ├── views.py         # User API views
│   └── serializers.py   # User serializers
├── journal/             # Journal entries app
│   ├── models.py        # Entry, Media, Tag models
│   ├── views.py         # Journal API views
│   └── serializers.py   # Entry serializers
├── emotions/            # Emotion detection app
│   ├── models.py        # Emotion & Mood models
│   ├── views.py         # Emotion API views
│   └── serializers.py   # Emotion serializers
├── recommendations/     # Recommendations app
│   ├── models.py        # Recommendation models
│   ├── views.py         # Recommendation API views
│   └── serializers.py   # Recommendation serializers
├── media/               # User uploaded files
├── db.sqlite3           # SQLite database (dev)
└── manage.py            # Django management script
```

## 🗃️ Database Models

### Users App
- **User**: Custom user model with profile and preferences

### Journal App
- **JournalEntry**: Main journal entry (text/voice/video)
- **EntryMedia**: Photo attachments for entries
- **EntryTag**: User-defined tags
- **EntryTagRelation**: Many-to-many relationship

### Emotions App
- **EmotionDetection**: AI-detected emotions per entry
- **MoodCheckIn**: Quick mood check-ins

### Recommendations App
- **Recommendation**: Wellness recommendations content
- **UserRecommendation**: Personalized recommendations
- **AIChatMessage**: AI companion chat history

## 🔌 API Endpoints (To be implemented)

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login user
- `POST /api/auth/token/refresh/` - Refresh JWT token
- `POST /api/auth/logout/` - Logout user

### Journal Entries
- `GET /api/journal/entries/` - List all entries
- `POST /api/journal/entries/` - Create new entry
- `GET /api/journal/entries/{id}/` - Get entry detail
- `PUT /api/journal/entries/{id}/` - Update entry
- `DELETE /api/journal/entries/{id}/` - Delete entry

### Emotions
- `GET /api/emotions/detections/` - List emotion detections
- `POST /api/emotions/checkin/` - Quick mood check-in
- `GET /api/emotions/analytics/` - Emotion analytics

### Recommendations
- `GET /api/recommendations/` - Get personalized recommendations
- `POST /api/recommendations/{id}/complete/` - Mark as completed
- `POST /api/recommendations/{id}/rate/` - Rate recommendation

### AI Chat
- `GET /api/chat/messages/` - Get chat history
- `POST /api/chat/send/` - Send message to AI

## 🛠️ Tech Stack

- **Framework**: Django 5.1.3
- **API**: Django REST Framework 3.15.2
- **Authentication**: JWT (Simple JWT)
- **Database**: SQLite (dev), PostgreSQL (production)
- **CORS**: django-cors-headers
- **Image Processing**: Pillow

## 📝 Notes

- This is currently set up for development with SQLite database
- For production, switch to PostgreSQL in `settings.py`
- Media files are stored locally in `media/` directory
- API documentation will be added using drf-spectacular

## 🔜 Next Steps

1. Implement serializers for all models
2. Create API views (ViewSets)
3. Set up URL routing
4. Add authentication endpoints
5. Integrate emotion detection ML models
6. Add API documentation (Swagger/OpenAPI)
