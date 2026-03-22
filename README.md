# Emotion-Aware Mental Health Assistanting System

A comprehensive mental health Assistanting platform with multimodal emotion recognition (text, voice, video), AI companion chat, and personalized wellness recommendations.

## 📁 Project Structure

```
emotion-Assistant-system/
├── frontend/          # Next.js 14 web application (React.js)
├── backend/           # Django REST API
└── docs/             # Documentation and design files
```

## 🚀 Quick Start

### Prerequisites

- **Frontend**: Node.js 18+ and npm/pnpm
- **Backend**: Python 3.10+ and pip
- Git

### Frontend Setup (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:3000`

### Backend Setup (Django)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
venv\Scripts\python.exe manage.py runserver

Backend will run on `http://localhost:8000`

## 📱 Features

### Web Application (React.js/Next.js)
- ✅ Landing page with marketing content
- ✅ User authentication (Sign up, Login, Password reset)
- ✅ Dashboard with emotion tracking and insights
- ✅ Multimodal Assistanting (text, voice, video)
- ✅ AI companion chat interface
- ✅ Analytics and insights visualization
- ✅ Personalized recommendations
- ✅ Calendar view and tag management
- ✅ Profile and settings management

### Backend (Django REST Framework)
- ✅ RESTful API endpoints
- ✅ JWT authentication
- ✅ User management
- ✅ Assistant entry CRUD operations
- ✅ Emotion detection integration (future)
- ✅ AI chat integration (future)

## 🎨 Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **Charts**: Recharts, Chart.js
- **Forms**: React Hook Form + Zod
- **State**: React Context API / Zustand
- **HTTP Client**: Axios / Fetch API

### Backend
- **Framework**: Django 5.0
- **API**: Django REST Framework
- **Authentication**: JWT (Simple JWT)
- **Database**: PostgreSQL (production) / SQLite (development)
- **File Storage**: Local / AWS S3 (future)
- **Task Queue**: Celery (future for ML processing)

## 📊 Current Status

**Phase 1: Frontend Interface Design (CURRENT)**
- Building all web application interfaces with dummy data
- Creating reusable components
- Implementing navigation and routing
- Setting up state management

**Phase 2: Backend API Development (UPCOMING)**
- Django models for users, entries, emotions
- REST API endpoints
- Authentication system

**Phase 3: ML Model Integration (FUTURE)**
- Facial expression recognition
- Speech emotion recognition
- Text sentiment analysis
- Multimodal fusion

## 📝 Documentation

Detailed interface specifications are available in:
- `../report/web_app_interfaces.md` - Complete web app design specs
- `../report/mobile_app_interfaces.md` - Mobile app design specs
- `../report/approach_and_methodology.md` - Technical approach
- `../report/models_training_plan.md` - ML models training plan

## 👥 Team

FYP-1 Project - Semester 7

## 📄 License

This is an academic project for Final Year Project.

---

**Note**: This project uses dummy data for initial development and demonstration purposes. Real emotion detection and AI features will be integrated in later phases.
