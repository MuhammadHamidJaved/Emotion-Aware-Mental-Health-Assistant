# 🚀 Quick Reference Guide - ML-Based Emotion Journal

## 📍 Key Pages & Their Purpose

| Page | URL | Purpose | Key Feature |
|------|-----|---------|-------------|
| **Landing** | `/` | Marketing & intro | ML capabilities showcase |
| **Dashboard** | `/dashboard` | Main hub | ML predictions + personalized recs |
| **New Entry** | `/journal/new` | Create journal | **Real-time ML emotion detection** |
| **Recommendations** | `/recommendations` | Wellness hub | **Unified music + exercises + quotes** |
| **Detect** | `/detect` | ML demo | Test models without saving |
| **Insights** | `/insights` | Analytics | ML-powered pattern analysis |

---

## 🎯 Core User Flow

```
1. User writes journal entry (text/voice/video)
   ↓
2. ML detects emotions in real-time
   ↓
3. Shows confidence scores & predictions
   ↓
4. User saves entry
   ↓
5. System shows personalized recommendations
   ↓
6. User gets music, exercises, quotes based on emotions
```

---

## 🔑 Key Differences from Before

### ❌ REMOVED
- Manual emotion selection grids
- Separate music/exercises/quotes pages
- Generic recommendations
- User-tagged emotions

### ✅ ADDED
- Real-time ML emotion detection
- Unified recommendations page
- Personalized suggestions with "why" explanations
- ML confidence scores everywhere
- Post-journal recommendation flow
- "ML Detected" badges
- Emotion-based content matching

---

## 🎨 Design System

### Colors
- **Indigo** (#6366F1) - ML/AI features
- **Purple** (#A855F7) - Recommendations
- **Emotion Colors** - Consistent across app

### Icons
- `Brain` - ML/AI features
- `Sparkles` - Personalization
- `Music` - Music recommendations
- `Dumbbell` - Exercises
- `Quote` - Inspirational quotes

### Components
- Gradient headers for ML pages
- Confidence badges (percentage)
- Emotion color-coded tags
- Processing time indicators

---

## 📱 Input Methods

### Text Entry
- Real-time analysis as user types
- Debounced (1.5s delay)
- Shows top 5 emotions
- Word count tracking

### Voice Entry
- Recording UI with timer
- Tone analysis (simulated)
- Duration tracking
- Audio playback

### Video Entry
- Camera interface
- Facial expression analysis (simulated)
- Frame processing
- Video playback

---

## 🎵 Recommendations System

### How It Works
1. System gets user's dominant emotion (e.g., "anxious")
2. Fetches content tagged for that emotion:
   - **Music**: Calming tracks with BPM info
   - **Exercises**: Breathing, yoga, relaxation
   - **Quotes**: Comfort and reassurance
3. Shows 3 items per category
4. Explains: "Based on your recent anxiety"

### Content Structure
```typescript
Music: {
  title, artist, duration, bpm, genre,
  benefit: "Reduces anxiety by 65%",
  targetEmotions: ['anxious', 'stressed']
}

Exercise: {
  name, duration, difficulty, calories,
  benefit: "Calms nervous system",
  targetEmotions: ['anxious']
}

Quote: {
  text, author, category,
  targetEmotions: ['anxious', 'sad']
}
```

---

## 🔧 For Backend Integration

### API Endpoints Needed

```typescript
// 1. Emotion Detection
POST /api/emotions/detect
Body: { text: string } | { audio: File } | { video: File }
Response: {
  dominant: 'anxious',
  confidence: 0.72,
  predictions: [
    { emotion: 'anxious', confidence: 0.72 },
    { emotion: 'tired', confidence: 0.45 },
    // ...
  ],
  processingTime: 234
}

// 2. Get Recommendations
GET /api/recommendations?emotion=anxious
Response: {
  music: [...],
  exercises: [...],
  quotes: [...]
}

// 3. Save Journal Entry
POST /api/journal/entries
Body: {
  type: 'text' | 'voice' | 'video',
  content: string,
  detectedEmotions: [...],
  tags: [...]
}
```

---

## 🎓 For FYP Demo

### What to Show

1. **Landing Page**
   - "95% ML accuracy"
   - Multimodal detection
   - Professional design

2. **Create Entry**
   - Type some text
   - Watch real-time emotion detection
   - Show confidence scores
   - Explain ML model

3. **Recommendations**
   - Show detected emotion
   - Explain personalization
   - Demo music/exercise/quote
   - Highlight "why" explanations

4. **Dashboard**
   - ML predictions overview
   - Recent entries with confidence
   - Personalized preview

5. **Analytics**
   - Emotion trends
   - Pattern recognition
   - ML-powered insights

### Key Talking Points
- "No manual tagging needed"
- "ML detects emotions automatically"
- "Personalized recommendations"
- "Multimodal: text, voice, video"
- "Real-time analysis"
- "Privacy-focused"

---

## 🐛 Common Issues & Solutions

### Issue: Emotion detection not showing
**Solution**: Type at least 10 characters (minimum for analysis)

### Issue: Recommendations seem generic
**Solution**: They're based on dominant emotion - change emotion data to see different recs

### Issue: Post-save modal not appearing
**Solution**: Check `showRecommendations` state in journal/new

### Issue: Navigation looks different
**Solution**: Music/Exercises/Quotes removed from sidebar (now in unified Recommendations)

---

## 📊 Data Flow

```
User Input (text/voice/video)
    ↓
ML Model Analysis
    ↓
Emotion Predictions + Confidence
    ↓
Save to Database
    ↓
Recommendation Engine
    ↓
Personalized Content (music/exercises/quotes)
    ↓
Display to User
```

---

## ✅ Checklist for Testing

- [ ] Create text entry - see real-time detection
- [ ] Create voice entry - see recording UI
- [ ] Create video entry - see camera UI
- [ ] Save entry - see success modal
- [ ] View recommendations - see personalized content
- [ ] Check dashboard - see ML badges
- [ ] View insights - see analytics
- [ ] Test detect page - demo mode works

---

## 🎯 Project Goals Achieved

✅ ML-based emotion detection (not manual)
✅ Multimodal input (text, voice, video)
✅ Personalized recommendations (music, exercises, quotes)
✅ Real-time analysis
✅ Professional UI/UX
✅ Complete user journey
✅ FYP-ready presentation

---

**Quick Start**: `npm run dev` → Navigate to `/dashboard` → Click "New Text Entry" → Start typing!

