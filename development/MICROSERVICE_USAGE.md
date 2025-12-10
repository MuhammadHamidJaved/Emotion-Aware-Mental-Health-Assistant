# Using the Mood Recommendation Microservice

This document explains how to integrate and use the Mood Recommendation Microservice in your main application.

## Overview

This microservice provides mood-based recommendations including:
- **Music**: Spotify playlists and tracks
- **Activities**: Suggestions from Bored API
- **Quotes**: Motivational quotes from ZenQuotes
- **Exercises**: Fitness recommendations from WGER API
- **Meditation**: Placeholder for future meditation content

## Service Configuration

**Base URL**: `http://localhost:5000/api`  
**Port**: 5000 (configured to avoid conflict with your main server on port 8000)

## Starting the Microservice

### Method 1: Using uvicorn (Recommended)
```powershell
# Navigate to the microservice directory
cd "H:\Semester 7\FYP\recomendation_module"

# Activate virtual environment
.\venv\Scripts\activate

# Run the service on port 5000
uvicorn app.main:app --reload --port 5000
```

### Method 2: Using the run script
```powershell
cd "H:\Semester 7\FYP\recomendation_module"
.\venv\Scripts\activate
python run.py
```

## API Endpoint

### POST `/api/recommend`

**Request Body:**
```json
{
  "user_id": "string",
  "emotion": "string",
  "context": {
    "time_of_day": "string",
    "additional_key": "value"
  }
}
```

**Supported Emotions:**
- `happy`
- `sad`
- `angry`
- `anxious`
- `calm`
- `neutral`

**Response:**
```json
{
  "emotion": "sad",
  "recommendations": {
    "music": {
      "playlist_url": "https://open.spotify.com/playlist/...",
      "tracks": [
        {
          "title": "Song Name",
          "artist": "Artist Name",
          "url": "https://open.spotify.com/track/...",
          "preview_url": "https://p.scdn.co/mp3-preview/..."
        }
      ]
    },
    "exercise": [
      {
        "name": "Exercise Name",
        "category": "Cardio",
        "description": "Exercise description..."
      }
    ],
    "meditation": [],
    "quote": "Inspirational quote text",
    "activity": "Try learning a new skill"
  }
}
```

## Integration Examples

### Python (using requests)

```python
import requests

# Microservice endpoint
RECOMMENDATION_URL = "http://localhost:5000/api/recommend"

def get_mood_recommendations(user_id: str, emotion: str, context: dict = None):
    """
    Fetch mood-based recommendations from the microservice.
    
    Args:
        user_id: Unique identifier for the user
        emotion: Detected emotion (happy, sad, angry, anxious, calm, neutral)
        context: Additional context dictionary (optional)
    
    Returns:
        Dictionary containing recommendations or None if request fails
    """
    payload = {
        "user_id": user_id,
        "emotion": emotion,
        "context": context or {}
    }
    
    try:
        response = requests.post(RECOMMENDATION_URL, json=payload, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error calling recommendation service: {e}")
        return None

# Usage example
recommendations = get_mood_recommendations(
    user_id="user123",
    emotion="sad",
    context={"time_of_day": "evening"}
)

if recommendations:
    print(f"Emotion: {recommendations['emotion']}")
    print(f"Playlist: {recommendations['recommendations']['music']['playlist_url']}")
    print(f"Quote: {recommendations['recommendations']['quote']}")
```

### JavaScript/Node.js (using fetch)

```javascript
const RECOMMENDATION_URL = "http://localhost:5000/api/recommend";

async function getMoodRecommendations(userId, emotion, context = {}) {
    try {
        const response = await fetch(RECOMMENDATION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                emotion: emotion,
                context: context
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error calling recommendation service:', error);
        return null;
    }
}

// Usage example
getMoodRecommendations('user123', 'happy', { time_of_day: 'morning' })
    .then(recommendations => {
        if (recommendations) {
            console.log('Emotion:', recommendations.emotion);
            console.log('Playlist:', recommendations.recommendations.music.playlist_url);
            console.log('Quote:', recommendations.recommendations.quote);
        }
    });
```

### cURL (for testing)

```bash
curl -X POST http://localhost:5000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "emotion": "anxious",
    "context": {
      "time_of_day": "afternoon"
    }
  }'
```

### PowerShell (for testing)

```powershell
$body = @{
    user_id = "test_user"
    emotion = "calm"
    context = @{
        time_of_day = "night"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/recommend" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

## Integration Architecture

```
┌─────────────────────┐
│   Main Application  │
│   (Port 8000)       │
└──────────┬──────────┘
           │
           │ HTTP POST
           ▼
┌─────────────────────┐
│  Recommendation     │
│  Microservice       │
│  (Port 5000)        │
└──────────┬──────────┘
           │
           ├──► Spotify API
           ├──► Bored API
           ├──► ZenQuotes API
           └──► WGER Exercise API
```

## Error Handling

The microservice returns standard HTTP status codes:

- **200**: Success
- **400**: Bad request (invalid emotion or malformed request)
- **500**: Internal server error (external API failure, etc.)

Always handle potential errors in your integration:

```python
response = requests.post(RECOMMENDATION_URL, json=payload)

if response.status_code == 200:
    data = response.json()
    # Process recommendations
elif response.status_code == 400:
    # Handle validation error
    print("Invalid request:", response.json()["detail"])
elif response.status_code == 500:
    # Handle server error
    print("Service temporarily unavailable")
```

## Configuration

### Environment Variables

The microservice requires Spotify credentials. Ensure `.env` file exists with:

```env
SPOTIFY_CLIENT_ID="your_spotify_client_id"
SPOTIFY_CLIENT_SECRET="your_spotify_client_secret"
```

### CORS Configuration

By default, the microservice allows all origins (`*`). For production, update `app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000"],  # Your main app URL
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Best Practices

1. **Timeouts**: Set appropriate timeouts when calling the microservice (recommended: 10-15 seconds)
2. **Retries**: Implement retry logic for transient failures
3. **Caching**: Consider caching recommendations for the same emotion to reduce API calls
4. **Fallbacks**: Have fallback content if the microservice is unavailable
5. **Monitoring**: Log all microservice calls for debugging and analytics

## Deployment Considerations

### Running in Production

For production deployment, use a production-grade server:

```powershell
# Install production server
pip install gunicorn

# Run with gunicorn (Linux/macOS)
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:5000

# Or use uvicorn in production mode (Windows)
uvicorn app.main:app --host 0.0.0.0 --port 5000 --workers 4
```

### Docker Deployment (Optional)

Create a `Dockerfile`:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY .env .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5000"]
```

Build and run:
```bash
docker build -t mood-recommendation-service .
docker run -p 5000:5000 mood-recommendation-service
```

## Troubleshooting

### Service won't start
- Ensure port 5000 is not in use: `netstat -ano | findstr :5000`
- Check virtual environment is activated
- Verify all dependencies are installed

### No recommendations returned
- Verify Spotify credentials in `.env`
- Check internet connectivity for external APIs
- Review service logs for specific errors

### CORS errors
- Update `allow_origins` in `app/main.py` to include your main app's URL

## Support

For issues specific to the recommendation logic, check:
- `app/domain/services.py` - Business logic
- `app/infrastructure/recommendation_repository.py` - External API integrations
- Service logs for detailed error messages
