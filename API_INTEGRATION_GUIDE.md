# Audio Emotion Recognition Microservice Integration Guide

This document outlines the available REST API endpoints for the Audio Emotion Recognition microservice, including their expected payload formats and response structures. It acts as a reference for seamlessly integrating this microservice into your main application.

---

## Base URL
By default, the microservice runs locally. Assuming you started it with `uvicorn main:app --port 5003`, your base URL will be:
`http://127.0.0.1:5003`

---

## 1. Predict Emotion
Evaluates an audio clip using the Wav2Vec2 model and returns probabilities of detected emotions, sorted from most confident to least confident.

- **URL:** `/predict`
- **Method:** `POST`
- **Content-Type:** `multipart/form-data`

### Input Payload (Form Data)
| Field Name | Type   | Required | Description                                                                                                            |
| :--------- | :----- | :------- | :--------------------------------------------------------------------------------------------------------------------- |
| `file`     | Binary | **Yes**  | The raw audio file or blob blob. Strongly supports common web recordings: `.webm`, `.wav`, `.mp3`, `.mp4` etc. |

### Example Client Request (JavaScript / Fetch)
```javascript
// Example using standard Fetch API
const formData = new FormData();
// Appending a file blob (e.g., from an input element or MediaRecorder)
formData.append('file', audioBlob, 'recording.webm');

try {
    const response = await fetch('http://127.0.0.1:5003/predict', {
        method: 'POST',
        body: formData
    });
    
    if (response.ok) {
        const data = await response.json();
        console.log(data.predictions); // Array of emotions
    }
} catch (error) {
    console.error("Failed to connect to microservice", error);
}
```

### Success Response
- **Status Code:** `200 OK`
- **Content-Type:** `application/json`

**Response Body:**
```json
{
  "predictions": [
    {
      "emotion": "happy",
      "score": 0.85231
    },
    {
      "emotion": "neutral",
      "score": 0.10444
    },
    {
      "emotion": "angry",
      "score": 0.04325
    }
  ]
}
```

### Potential Error Responses
- **`422 Unprocessable Entity`**: Missing or incorrectly named `file` form-data parameter.
- **`503 Service Unavailable`**: The Python environment launched, but the model weights were not properly loaded into memory.
- **`500 Internal Server Error`**: The server failed to process the audio (Can occur if `ffmpeg` is missing from the system path or if the file contains zero readable audio).

---

## 2. Health Status
Diagnostic endpoint to verify that the microservice is operational and the model has successfully mounted. Highly useful for orchestrated startups (ensuring the main app waits for this microservice to be "healthy").

- **URL:** `/health`
- **Method:** `GET`

### Success Response
- **Status Code:** `200 OK`

**Response Body:**
```json
{
  "status": "healthy"
}
```
*(Note: Returns `"degraded"` if model weights are missing or failed to initialize).*

---

## 3. Retrieve Model Metrics
Fetches offline evaluation statistics of the loaded Wav2Vec2 model (e.g., Accuracy, F1 scores) read directly from data generated during training.

- **URL:** `/metrics`
- **Method:** `GET`

### Success Response
- **Status Code:** `200 OK`

**Response Body (Example):**
```json
{
  "accuracy": 0.88,
  "macro_f1": 0.86,
  "weighted_f1": 0.87
}
```

### Potential Error Responses
- **`404 Not Found`**: The metrics file (`model/metrics.json`) does not exist on disk.
---
