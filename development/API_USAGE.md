# Text Emotion Detection Microservice - API Usage Guide

## Overview

This microservice provides emotion detection capabilities for text input using state-of-the-art machine learning models. It's built with FastAPI and offers RESTful API endpoints for integration into your projects.

**Base URL:** `http://localhost:5001`  
**API Version:** v1  
**API Prefix:** `/v1`

---

## Quick Start

### Starting the Microservice

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the service:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 5001
   ```

3. **Access interactive documentation:**
   - Swagger UI: `http://localhost:5001/docs`
   - ReDoc: `http://localhost:5001/redoc`
   - OpenAPI JSON: `http://localhost:5001/openapi.json`

---

## API Endpoints

### 1. Health Check

**Endpoint:** `GET /health`

**Description:** Check if the service is running and healthy.

**Request:**
```bash
curl http://localhost:5001/health
```

**Response:**
```json
{
  "status": "ok"
}
```

**Status Code:** `200 OK`

---

### 2. Emotion Prediction

**Endpoint:** `POST /v1/predict`

**Description:** Predict emotion from input text using available models.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body (JSON):**
```json
{
  "text": "I am so happy today!",
  "model": "goemotions-distilbert"
}
```

**Request Body Schema:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `text` | string | Yes | Input text to classify (minimum 1 character) |
| `model` | string | No | Model name to use (defaults to service default model) |

**Response:**
```json
{
  "label": "joy",
  "score": 0.89,
  "model": "goemotions-distilbert",
  "metadata": {
    "all_scores": {
      "joy": 0.89,
      "optimism": 0.12,
      "excitement": 0.08
    }
  }
}
```

**Response Schema:**
| Field | Type | Description |
|-------|------|-------------|
| `label` | string | Predicted emotion label |
| `score` | float | Confidence score (0-1) |
| `model` | string | Name of the model used |
| `metadata` | object | Additional information (model-specific) |

**Status Codes:**
- `200 OK` - Successful prediction
- `404 NOT FOUND` - Requested model not available
- `422 UNPROCESSABLE ENTITY` - Invalid request payload

**Example with cURL:**
```bash
curl -X POST http://localhost:5001/v1/predict \
  -H "Content-Type: application/json" \
  -d '{"text": "I am so happy today!", "model": "goemotions-distilbert"}'
```

**Example using default model:**
```bash
curl -X POST http://localhost:5001/v1/predict \
  -H "Content-Type: application/json" \
  -d '{"text": "This is frustrating"}'
```

---

### 3. List Available Models

**Endpoint:** `GET /v1/models`

**Description:** Get a list of all registered and available emotion detection models.

**Request:**
```bash
curl http://localhost:5001/v1/models
```

**Response:**
```json
{
  "models": [
    "rule-based",
    "goemotions-distilbert"
  ]
}
```

**Response Schema:**
| Field | Type | Description |
|-------|------|-------------|
| `models` | array[string] | List of available model names |

**Status Code:** `200 OK`

---

## Integration Examples

### Python with `requests`

```python
import requests

BASE_URL = "http://localhost:5001"

# Check health
response = requests.get(f"{BASE_URL}/health")
print(response.json())  # {'status': 'ok'}

# Get available models
response = requests.get(f"{BASE_URL}/v1/models")
models = response.json()
print(models)  # {'models': ['rule-based', 'goemotions-distilbert']}

# Predict emotion
payload = {
    "text": "I'm extremely excited about this!",
    "model": "goemotions-distilbert"  # Optional
}
response = requests.post(f"{BASE_URL}/v1/predict", json=payload)
result = response.json()

print(f"Emotion: {result['label']}")
print(f"Confidence: {result['score']}")
print(f"Model: {result['model']}")
```

### JavaScript/Node.js with `fetch`

```javascript
const BASE_URL = 'http://localhost:5001';

// Check health
async function checkHealth() {
  const response = await fetch(`${BASE_URL}/health`);
  const data = await response.json();
  console.log(data);  // {status: 'ok'}
}

// Predict emotion
async function predictEmotion(text, model = null) {
  const payload = { text };
  if (model) payload.model = model;
  
  const response = await fetch(`${BASE_URL}/v1/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  
  const result = await response.json();
  console.log(`Emotion: ${result.label}`);
  console.log(`Confidence: ${result.score}`);
  return result;
}

// Usage
predictEmotion("I love this project!");
```

### JavaScript/React Integration

```jsx
import { useState } from 'react';

function EmotionDetector() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyzeEmotion = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/v1/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to analyze..."
      />
      <button onClick={analyzeEmotion} disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze Emotion'}
      </button>
      {result && (
        <div>
          <p>Emotion: {result.label}</p>
          <p>Confidence: {(result.score * 100).toFixed(2)}%</p>
          <p>Model: {result.model}</p>
        </div>
      )}
    </div>
  );
}
```

### Python with `httpx` (async)

```python
import httpx
import asyncio

async def analyze_emotions(texts: list[str]):
    async with httpx.AsyncClient() as client:
        base_url = "http://localhost:5001"
        
        # Concurrent requests
        tasks = [
            client.post(
                f"{base_url}/v1/predict",
                json={"text": text}
            )
            for text in texts
        ]
        
        responses = await asyncio.gather(*tasks)
        results = [r.json() for r in responses]
        
        for text, result in zip(texts, results):
            print(f"Text: {text}")
            print(f"Emotion: {result['label']} ({result['score']:.2f})")
            print()

# Usage
texts = [
    "I'm so excited!",
    "This is really frustrating",
    "I feel calm and peaceful"
]
asyncio.run(analyze_emotions(texts))
```

---

## Available Models

### 1. **rule-based**
- Simple rule-based emotion detection
- Always available as fallback
- Fast but less accurate
- Good for testing and development

### 2. **goemotions-distilbert**
- Advanced transformer-based model
- Trained on Google's GoEmotions dataset
- Supports 28 emotion categories
- Configurable threshold and device (CPU/GPU)
- Requires model file: `final_weighted_model_v2.pkl`

---

## Configuration

### Environment Variables

Create a `.env` file in the root directory or set environment variables:

```env
# Application Settings
APP_NAME=Text Emotion Service
ENVIRONMENT=local
VERSION=0.1.0
LOG_LEVEL=INFO
API_V1_PREFIX=/v1

# Model Settings
DEFAULT_MODEL=goemotions-distilbert
GOEMOTIONS_MODEL_PATH=./final_weighted_model_v2.pkl
GOEMOTIONS_BASE_MODEL=distilbert-base-uncased
GOEMOTIONS_THRESHOLD=0.5
GOEMOTIONS_DEVICE=cuda  # or 'cpu', or leave empty for auto-select
```

### Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_NAME` | Text Emotion Service | Application name |
| `ENVIRONMENT` | local | Environment identifier |
| `VERSION` | 0.1.0 | API version |
| `DEFAULT_MODEL` | goemotions-distilbert | Default model for predictions |
| `LOG_LEVEL` | INFO | Logging level (DEBUG, INFO, WARNING, ERROR) |
| `API_V1_PREFIX` | /v1 | API version prefix |
| `GOEMOTIONS_MODEL_PATH` | ./final_weighted_model_v2.pkl | Path to model file |
| `GOEMOTIONS_BASE_MODEL` | distilbert-base-uncased | Base model architecture |
| `GOEMOTIONS_THRESHOLD` | 0.5 | Confidence threshold |
| `GOEMOTIONS_DEVICE` | None (auto) | Device for inference (cuda/cpu) |

---

## Error Handling

### Common Error Responses

**404 NOT FOUND - Model Not Available:**
```json
{
  "detail": "Model 'invalid-model' not found"
}
```

**422 UNPROCESSABLE ENTITY - Invalid Request:**
```json
{
  "detail": [
    {
      "loc": ["body", "text"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**Example Error Handling (Python):**
```python
import requests

try:
    response = requests.post(
        "http://localhost:5001/v1/predict",
        json={"text": "Hello world", "model": "non-existent"}
    )
    response.raise_for_status()
    result = response.json()
except requests.exceptions.HTTPError as e:
    if response.status_code == 404:
        print("Model not found. Use /v1/models to see available models.")
    elif response.status_code == 422:
        print("Invalid request:", response.json())
    else:
        print(f"Error: {e}")
```

---

## Best Practices

1. **Check service health** before making prediction requests
2. **List available models** first to ensure your desired model is loaded
3. **Use the default model** (omit `model` field) for simplicity unless you need a specific model
4. **Handle errors gracefully** - the service may fall back to rule-based if GoEmotions fails to load
5. **Batch requests** when processing multiple texts for better performance
6. **Monitor response times** and consider caching for frequently analyzed texts
7. **Use HTTPS** in production environments
8. **Implement rate limiting** in production to prevent abuse

---

## Performance Considerations

- **Model Loading:** Models are loaded during service startup (lifespan event)
- **Inference:** Synchronous model inference runs in threadpool to avoid blocking
- **Concurrency:** FastAPI handles multiple concurrent requests efficiently
- **Device:** Use GPU (`GOEMOTIONS_DEVICE=cuda`) for faster inference with large batches

---

## Troubleshooting

### Service won't start
- Check if port 5001 is already in use
- Verify Python version (3.10+ required)
- Ensure all dependencies are installed

### GoEmotions model not loading
- Verify `GOEMOTIONS_MODEL_PATH` points to valid model file
- Check if model file exists and has correct permissions
- Service will fall back to `rule-based` model automatically

### Getting 404 errors for predictions
- Ensure the requested model is in the available models list (`GET /v1/models`)
- Check default model configuration if not specifying model explicitly

---

## Support & Documentation

- **Interactive API Docs:** `http://localhost:5001/docs`
- **Alternative Docs:** `http://localhost:5001/redoc`
- **OpenAPI Schema:** `http://localhost:5001/openapi.json`

---

## License

Refer to the project's main LICENSE file for licensing information.
