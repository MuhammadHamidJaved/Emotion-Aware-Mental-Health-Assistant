# Facial Recognition Microservice Integration

## Overview

This document describes the integration of the facial image recognition microservice with the emotion journal system. The integration allows users to record video via webcam, detect emotions in real-time, and store the predicted emotions in the database for future movie recommendations.

## Architecture

```
Frontend (Next.js)
    ↓ (Webcam frames → Base64)
    ↓ (POST /api/journal/emotion/detect/)
Django Backend
    ↓ (POST http://localhost:8001/predict/base64)
Facial Recognition Microservice
    ↓ (Returns emotion prediction)
Django Backend
    ↓ (Stores in database)
    ↓ (Returns to frontend)
Frontend (Next.js)
```

## Components

### 1. Backend API Endpoints

#### Emotion Detection Endpoint
- **URL**: `POST /api/journal/emotion/detect/`
- **Purpose**: Accept base64 image and call microservice
- **Request Body**:
  ```json
  {
    "image_data": "base64_encoded_image_string"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "predicted_emotion": "Happy",
    "confidence": 0.85,
    "all_scores": {...},
    "top_3": [...],
    "processing_time_ms": 45.2
  }
  ```

#### Journal Entry Endpoints
- **Create**: `POST /api/journal/entries/`
- **List**: `GET /api/journal/entries/`
- **Get**: `GET /api/journal/entries/{id}/`
- **Update**: `PUT/PATCH /api/journal/entries/{id}/`
- **Delete**: `DELETE /api/journal/entries/{id}/`

### 2. Frontend Implementation

#### Webcam Integration
- Uses `getUserMedia` API to access webcam
- Captures frames every 2 seconds
- Converts frames to base64 format
- Sends to backend for emotion detection

#### Real-time Emotion Display
- Shows dominant emotion with confidence score
- Displays top 5 emotion predictions
- Updates in real-time as user records

#### Save Functionality
- Stores entry with:
  - Predicted emotion
  - Confidence score
  - Entry type (video)
  - Duration
  - Optional title and tags

### 3. Database Schema

The `JournalEntry` model stores:
- `emotion`: Predicted emotion (string)
- `emotion_confidence`: Confidence score (float, 0-1)
- `entry_type`: 'video' for video entries
- `duration`: Recording duration in seconds
- `transcription`: Optional text notes

## Configuration

### Microservice URL
Set in `backend/config/settings.py`:
```python
EMOTION_MICROSERVICE_URL = config('EMOTION_MICROSERVICE_URL', default='http://localhost:8001')
```

Or set environment variable:
```bash
EMOTION_MICROSERVICE_URL=http://localhost:8001
```

## Usage Flow

1. User navigates to `/check-in/new?type=video`
2. User clicks "Enable Camera"
3. Frontend requests webcam access
4. Webcam stream starts
5. Every 2 seconds:
   - Frame is captured
   - Converted to base64
   - Sent to backend
   - Backend calls microservice
   - Emotion result displayed
6. User clicks "Stop Recording"
7. User clicks "Save Check-In"
8. Entry saved with predicted emotion
9. Emotion stored in database for recommendations

## Error Handling

- **Camera Access Denied**: Shows error message to user
- **Microservice Unavailable**: Logs error, shows user-friendly message
- **Network Errors**: Handles gracefully with retry option

## Future Enhancements

1. **WebSocket Integration**: For real-time streaming (as per API reference)
2. **Video File Storage**: Store actual video files
3. **Batch Processing**: Process multiple frames for better accuracy
4. **Emotion History**: Track emotion changes over time
5. **Movie Recommendations**: Use stored emotions to recommend movies

## Testing

1. Start microservice on `http://localhost:8001`
2. Start Django backend on `http://localhost:8000`
3. Start Next.js frontend on `http://localhost:3000`
4. Navigate to video check-in page
5. Enable camera and verify emotion detection
6. Save entry and verify database storage

## API Reference

See `development/API_ENDPOINTS_REFERENCE.md` for complete microservice API documentation.
