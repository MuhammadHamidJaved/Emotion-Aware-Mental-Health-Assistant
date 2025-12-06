# Emotion Detection Service - Quick Implementation Guide

## Overview
This guide provides step-by-step instructions for implementing the emotion detection service following the architecture in `EMOTION_DETECTION_ARCHITECTURE.md`.

---

## Priority Order
1. **PRIMARY**: Image/Video (AffectNet) - Real-time video detection
2. **SECONDARY**: Text
3. **TERTIARY**: Voice

---

## Step 1: Prepare Model Files

### Train Models Separately
Train your models outside Django and save them:

**AffectNet Model (Image/Video):**
```python
# training_script.py
import pickle
import torch  # or tensorflow/keras

# Train your model...
model = YourAffectNetModel()
# ... training code ...

# Save model
with open('affectnet_model.pkl', 'wb') as f:
    pickle.dump({
        'model': model,
        'preprocessor': preprocessor,  # if you have custom preprocessing
        'version': '1.0.0',
        'trained_on': 'AffectNet',
        'emotions': ['neutral', 'happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'contempt']
    }, f)
```

**Text Model:**
```python
# Save text emotion model
with open('text_emotion_model.pkl', 'wb') as f:
    pickle.dump({
        'model': text_model,
        'tokenizer': tokenizer,  # if using transformers
        'vectorizer': vectorizer,  # if using sklearn
        'version': '1.0.0'
    }, f)
```

**Voice Model:**
```python
# Save voice emotion model
with open('voice_emotion_model.pkl', 'wb') as f:
    pickle.dump({
        'model': voice_model,
        'feature_extractor': feature_extractor,
        'version': '1.0.0'
    }, f)
```

### Place Models in Project
```
backend/
├── models/
│   ├── affectnet_model.pkl
│   ├── text_emotion_model.pkl
│   └── voice_emotion_model.pkl
├── emotions/
│   └── ...
```

---

## Step 2: Create Service Files

### 2.1 Main Emotion Service
Create `backend/emotions/emotion_service.py` following the architecture document.

### 2.2 Image/Video Service
Create `backend/emotions/image_video_service.py` for AffectNet model.

**Key Features:**
- Real-time video frame processing
- Support for single images
- Video file processing (sample frames)
- Webcam integration

### 2.3 Text Service
Create `backend/emotions/text_service.py` for text emotion detection.

### 2.4 Voice Service
Create `backend/emotions/voice_service.py` for voice emotion detection.

---

## Step 3: Set Environment Variables

Add to `.env`:
```bash
# Emotion Detection Models
AFFECTNET_MODEL_PATH=models/affectnet_model.pkl
TEXT_MODEL_PATH=models/text_emotion_model.pkl
VOICE_MODEL_PATH=models/voice_emotion_model.pkl
EMOTION_DEVICE=cpu  # Change to 'cuda' if GPU available
```

---

## Step 4: Create API Endpoints

Create `backend/emotions/views.py`:
- `POST /api/emotions/detect/` - Multi-modal detection
- `POST /api/emotions/detect/realtime/` - Real-time video
- `GET /api/emotions/detect/{id}/` - Get detection history

Add to `backend/emotions/urls.py`:
```python
from django.urls import path
from . import views

app_name = 'emotions'

urlpatterns = [
    path('detect/', views.detect_emotion, name='detect-emotion'),
    path('detect/realtime/', views.detect_realtime_video, name='detect-realtime'),
]
```

Update `backend/config/urls.py`:
```python
path('api/emotions/', include('emotions.urls')),
```

---

## Step 5: Install Dependencies

Add to `backend/requirements.txt`:
```txt
# For image/video processing
opencv-python>=4.8.0
Pillow>=10.0.0

# For voice processing
librosa>=0.10.0
soundfile>=0.12.0

# For ML models (if using PyTorch)
torch>=2.0.0
torchvision>=0.15.0

# Or TensorFlow (if using Keras)
# tensorflow>=2.13.0

# For audio processing
numpy>=1.24.0
scipy>=1.11.0
```

Install:
```bash
cd backend
pip install -r requirements.txt
```

---

## Step 6: Integrate with Journal Entry Creation

Update `backend/journal/views.py` to use emotion detection when creating entries:

```python
from emotions.emotion_service import get_emotion_service

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_entry(request):
    # ... existing code ...
    
    # Detect emotion if image/video/text/voice provided
    service = get_emotion_service()
    emotion_result = service.detect(
        image_file=request.FILES.get('image_file'),
        video_file=request.FILES.get('video_file'),
        text=request.data.get('text_content'),
        voice_file=request.FILES.get('voice_file')
    )
    
    # Create entry with detected emotion
    entry = JournalEntry.objects.create(
        user=request.user,
        text_content=request.data.get('text_content'),
        emotion=emotion_result['dominant_emotion'],  # PRIMARY: AffectNet result
        emotion_confidence=emotion_result['confidence'],
        # ... other fields ...
    )
    
    # Save detailed detection to EmotionDetection model
    EmotionDetection.objects.create(
        entry=entry,
        modality=emotion_result['modality_used'],
        confidence=emotion_result['confidence'],
        # ... emotion scores ...
    )
```

---

## Step 7: Frontend Integration

### Real-time Video Detection
Update `frontend/src/app/detect/page.tsx`:

```typescript
// Real-time video emotion detection
const startVideoDetection = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  const video = document.createElement('video');
  video.srcObject = stream;
  video.play();
  
  // Capture frames and send to backend
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  const captureFrame = async () => {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve));
    
    const formData = new FormData();
    formData.append('image_file', blob, 'frame.jpg');
    
    const response = await fetch('/api/emotions/detect/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: formData
    });
    
    const result = await response.json();
    setPredictions(result.all_emotions);
    setDominantEmotion(result.dominant_emotion);
    
    requestAnimationFrame(captureFrame);
  };
  
  captureFrame();
};
```

---

## Step 8: Testing

### Test Image Detection
```python
# test_emotion_service.py
from emotions.emotion_service import get_emotion_service
from PIL import Image

service = get_emotion_service()
image = Image.open('test_image.jpg')
result = service.detect(image_file=image)
print(f"Emotion: {result['dominant_emotion']}, Confidence: {result['confidence']}")
```

### Test API Endpoint
```bash
curl -X POST http://localhost:8000/api/emotions/detect/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image_file=@test_image.jpg"
```

---

## Microservice Option (Future)

If you want to separate models into microservices:

### 1. Create Separate Services

**Image-Video Service (FastAPI):**
```python
# image_video_service/app.py
from fastapi import FastAPI, UploadFile
from emotion_service import ImageVideoEmotionService

app = FastAPI()
service = ImageVideoEmotionService(model_path='affectnet_model.pkl')

@app.post("/detect")
async def detect(image: UploadFile):
    result = service.detect_from_image(await image.read())
    return result
```

**Deploy separately:**
```bash
# Run on different ports
uvicorn image_video_service.app:app --port 8001
uvicorn text_service.app:app --port 8002
uvicorn voice_service.app:app --port 8003
```

### 2. Update Django Client

```python
# emotions/microservice_client.py
import requests

class EmotionMicroserviceClient:
    def __init__(self):
        self.image_service_url = 'http://localhost:8001'
        self.text_service_url = 'http://localhost:8002'
        self.voice_service_url = 'http://localhost:8003'
    
    def detect(self, image_file=None, text=None, voice_file=None):
        # Try image first (PRIMARY)
        if image_file:
            response = requests.post(
                f"{self.image_service_url}/detect",
                files={"image": image_file}
            )
            return response.json()
        
        # Fallback to text (SECONDARY)
        if text:
            response = requests.post(
                f"{self.text_service_url}/detect",
                json={"text": text}
            )
            return response.json()
        
        # Fallback to voice (TERTIARY)
        if voice_file:
            response = requests.post(
                f"{self.voice_service_url}/detect",
                files={"audio": voice_file}
            )
            return response.json()
```

---

## Model Training Checklist

- [ ] Train AffectNet model on image/video data
- [ ] Train text emotion model on text data
- [ ] Train voice emotion model on audio data
- [ ] Save models as `.pkl`, `.pt`, or `.h5` files
- [ ] Include preprocessors/tokenizers in saved files
- [ ] Document model input/output formats
- [ ] Test models independently before integration

---

## Integration Checklist

- [ ] Create `emotion_service.py` (main orchestrator)
- [ ] Create `image_video_service.py` (AffectNet - PRIMARY)
- [ ] Create `text_service.py` (SECONDARY)
- [ ] Create `voice_service.py` (TERTIARY)
- [ ] Add environment variables
- [ ] Create API endpoints
- [ ] Integrate with journal entry creation
- [ ] Add real-time video detection UI
- [ ] Test all modalities
- [ ] Update frontend to use real emotion detection

---

## Notes

- **Start with PRIMARY (Image/Video)**: Focus on getting AffectNet working first
- **Fallback chain**: Always try image/video → text → voice in that order
- **Real-time video**: Use WebRTC or WebSocket for live streaming
- **Model versions**: Track model versions for A/B testing
- **Error handling**: Gracefully fallback if one modality fails
- **Performance**: Cache model loading, use GPU if available

---

## Next Steps After Implementation

1. **Test with real data**: Use actual user images/videos
2. **Monitor performance**: Track detection accuracy and latency
3. **Optimize**: Improve preprocessing, use batch inference
4. **Scale**: Consider microservices if traffic increases
5. **A/B test**: Compare different model versions




