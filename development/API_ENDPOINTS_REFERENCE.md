# Emotion Detection Microservice - API Endpoints Reference

Complete list of all URLs/endpoints available in the microservice for your Next.js + Django emotion-aware assistant.

## Base URL

```
http://localhost:8001
```

(Change host/port if microservice is deployed elsewhere)

---

## Available Endpoints

### 1. Health Check
**Purpose:** Verify microservice is running and healthy

**URL:**
```
GET http://localhost:8001/health
```

**Response:** Service status, model info, device, emotion labels

**Use Case:** Check if service is available before making predictions

---

### 2. Predict from Uploaded Image
**Purpose:** Detect emotion from an uploaded image file

**URL:**
```
POST http://localhost:8001/predict/upload
```

**Content-Type:** `multipart/form-data`

**Body:**
- `file`: Image file (JPG, PNG, etc.)

**Response:**
```json
{
  "success": true,
  "predicted_emotion": "Happy",
  "confidence": 0.85,
  "all_scores": {
    "Neutral": 0.05,
    "Happy": 0.85,
    "Sad": 0.02,
    "Surprise": 0.03,
    "Fear": 0.01,
    "Disgust": 0.01,
    "Anger": 0.02,
    "Contempt": 0.01
  },
  "top_3": [
    {"emotion": "Happy", "score": 0.85},
    {"emotion": "Neutral", "score": 0.05},
    {"emotion": "Surprise", "score": 0.03}
  ],
  "processing_time_ms": 45.2,
  "timestamp": "2024-01-01T12:00:00"
}
```

**Use Case:** 
- User uploads image in Next.js frontend
- Next.js sends to Django backend
- Django calls this endpoint
- Django stores result in database
- Django returns to Next.js

---

### 3. Predict from Image URL
**Purpose:** Detect emotion from an image accessible via URL

**URL:**
```
POST http://localhost:8001/predict/url
```

**Content-Type:** `application/json`

**Body:**
```json
{
  "image_url": "https://example.com/image.jpg"
}
```

**Response:** Same format as `/predict/upload`

**Use Case:**
- Analyze images from external URLs
- Process images already stored in cloud/CDN

---

### 4. Predict from Base64 Image
**Purpose:** Detect emotion from base64 encoded image

**URL:**
```
POST http://localhost:8001/predict/base64
```

**Content-Type:** `application/json`

**Body:**
```json
{
  "image_data": "base64_encoded_image_string"
}
```

**Response:** Same format as `/predict/upload`

**Use Case:**
- Webcam frames (convert to base64)
- Images already in memory
- Real-time processing

---

### 5. Webcam WebSocket Stream
**Purpose:** Real-time emotion detection from webcam video stream

**URL:**
```
WebSocket ws://localhost:8001/webcam/stream
```

**Protocol:** WebSocket (not HTTP)

**Message Format (Client → Server):**
```json
{
  "type": "frame",
  "data": "base64_encoded_jpeg_frame"
}
```

**Message Format (Server → Client):**
```json
{
  "type": "prediction",
  "predicted_emotion": "Happy",
  "confidence": 0.85,
  "all_scores": {...},
  "top_3": [...],
  "face_box": [x, y, w, h]
}
```

**Use Case:**
- Real-time webcam emotion detection in Next.js
- Continuous emotion monitoring
- Live emotion tracking

---

## Architecture Flow

### For Image Upload:
```
Next.js Frontend
    ↓ (POST /api/emotion/predict)
Django Backend
    ↓ (POST http://localhost:8001/predict/upload)
Microservice
    ↓ (Returns prediction)
Django Backend
    ↓ (Store in database)
    ↓ (Return to frontend)
Next.js Frontend
```

### For Webcam:
```
Next.js Frontend
    ↓ (WebSocket connection)
    ↓ (Send frames)
Microservice
    ↓ (Returns predictions)
Next.js Frontend
    ↓ (Display results)
    ↓ (Optionally send to Django)
Django Backend
    ↓ (Store in database)
```

---

## Data to Store in Database

When storing microservice responses in Django database, save:

1. **Prediction Results:**
   - `predicted_emotion` (string)
   - `confidence` (float)
   - `timestamp` (datetime)

2. **All Scores:**
   - Store all 8 emotion scores for analysis

3. **Metadata:**
   - `processing_time_ms` (for performance tracking)
   - `user_id` (if applicable)
   - `session_id` (for webcam sessions)
   - `source` (upload/url/webcam)

4. **Top 3 Predictions:**
   - Store top 3 for quick reference

---

## Recommended Django Model Fields

```
- id (auto)
- user_id (ForeignKey, optional)
- session_id (CharField, for webcam sessions)
- predicted_emotion (CharField)
- confidence (FloatField)
- all_scores (JSONField) - Store all 8 emotions
- top_3 (JSONField) - Store top 3 predictions
- processing_time_ms (FloatField)
- source (CharField) - 'upload', 'url', 'webcam'
- created_at (DateTimeField)
- image_url (URLField, optional) - If from URL
```

---

## Endpoint Summary Table

| Endpoint | Method | Purpose | Use Case |
|----------|--------|---------|----------|
| `/health` | GET | Health check | Verify service availability |
| `/predict/upload` | POST | Image file upload | User uploads image |
| `/predict/url` | POST | Image from URL | External image analysis |
| `/predict/base64` | POST | Base64 image | Webcam frames, in-memory images |
| `/webcam/stream` | WebSocket | Real-time webcam | Live emotion detection |

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message",
  "error_type": "ExceptionType",
  "timestamp": "2024-01-01T12:00:00"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid input)
- `500` - Internal Server Error
- `503` - Service Unavailable (service not initialized)

---

## Integration Points

### Next.js → Django
- Next.js makes API calls to Django endpoints
- Django handles authentication, validation, database operations

### Django → Microservice
- Django calls microservice endpoints
- Django stores results in database
- Django returns formatted response to Next.js

### Next.js → Microservice (Direct)
- For webcam: Next.js connects directly via WebSocket
- For real-time: Can send frames directly, then save to Django

---

## Production Considerations

**Change URLs for production:**
- Development: `http://localhost:8001`
- Production: `http://your-production-server:8001` or `https://emotion-api.yourdomain.com`

**WebSocket URLs:**
- Development: `ws://localhost:8001`
- Production: `wss://your-production-server:8001` (WSS for HTTPS)

---

## Quick Reference

**Health Check:**
```
GET http://localhost:8001/health
```

**Upload Image:**
```
POST http://localhost:8001/predict/upload
Content-Type: multipart/form-data
Body: file=<image_file>
```

**From URL:**
```
POST http://localhost:8001/predict/url
Content-Type: application/json
Body: {"image_url": "https://..."}
```

**From Base64:**
```
POST http://localhost:8001/predict/base64
Content-Type: application/json
Body: {"image_data": "base64_string"}
```

**Webcam Stream:**
```
WebSocket ws://localhost:8001/webcam/stream
```

---

**That's all the URLs you need!** Your Next.js + Django app will call these endpoints from the microservice.
