# Emotion Detection Service Architecture

## Overview
This document outlines the architecture for the Emotion Detection service, which is the **core functionality** of the Emotion-Aware Mental Health Assistant. The service will detect emotions from multiple modalities with the following priority:

1. **Primary**: Image/Real-time Video (AffectNet dataset model)
2. **Secondary**: Text
3. **Tertiary**: Voice

The architecture follows the same pattern as the RAG chatbot service (`backend/recommendations/rag_service.py`), using singleton instances and lazy loading.

---

## Architecture Pattern

### Integrated Service Approach (Recommended for MVP)
Similar to RAG chatbot, all models live in the same Django app but are managed as separate services.

**Structure:**
```
backend/
├── emotions/
│   ├── __init__.py
│   ├── models.py (Django models - already exists)
│   ├── emotion_service.py (Main service orchestrator)
│   ├── image_video_service.py (AffectNet model)
│   ├── text_service.py (Text emotion detection)
│   ├── voice_service.py (Voice emotion detection)
│   ├── views.py (API endpoints)
│   └── serializers.py
```

### Microservice Approach (For Production Scaling)
Each model can run as a separate microservice with REST/gRPC APIs.

**Structure:**
```
emotion-detection-services/
├── image-video-service/  (FastAPI/Flask)
│   ├── app.py
│   ├── model_loader.py
│   └── requirements.txt
├── text-service/
│   ├── app.py
│   ├── model_loader.py
│   └── requirements.txt
└── voice-service/
    ├── app.py
    ├── model_loader.py
    └── requirements.txt
```

**Django Integration:**
```python
# backend/emotions/emotion_service.py
import requests

class EmotionMicroserviceClient:
    def __init__(self, image_service_url, text_service_url, voice_service_url):
        self.image_service_url = image_service_url
        self.text_service_url = text_service_url
        self.voice_service_url = voice_service_url
    
    def detect_from_image(self, image_file):
        response = requests.post(
            f"{self.image_service_url}/detect",
            files={"image": image_file}
        )
        return response.json()
```

---

## Primary Design: Integrated Service (Following RAG Pattern)

### 1. Main Emotion Detection Service (`emotion_service.py`)

```python
"""
Unified Emotion Detection Service
Orchestrates detection across multiple modalities with priority:
1. Image/Video (AffectNet) - PRIMARY
2. Text - SECONDARY  
3. Voice - TERTIARY
"""
import os
import time
from typing import Optional, Dict, Any, Union
from decouple import config
import logging

from .image_video_service import ImageVideoEmotionService
from .text_service import TextEmotionService
from .voice_service import VoiceEmotionService

logger = logging.getLogger(__name__)


class EmotionDetectionService:
    """Unified service for emotion detection across modalities"""
    
    def __init__(
        self,
        affectnet_model_path: str = None,
        text_model_path: str = None,
        voice_model_path: str = None,
        device: str = 'cpu'
    ):
        """
        Initialize emotion detection service
        
        Args:
            affectnet_model_path: Path to AffectNet trained model (.pkl, .pt, .h5, etc.)
            text_model_path: Path to text emotion model
            voice_model_path: Path to voice emotion model
            device: 'cpu' or 'cuda'
        """
        self.device = device
        self.affectnet_model_path = affectnet_model_path or config('AFFECTNET_MODEL_PATH', default=None)
        self.text_model_path = text_model_path or config('TEXT_MODEL_PATH', default=None)
        self.voice_model_path = voice_model_path or config('VOICE_MODEL_PATH', default=None)
        
        # Initialize services (lazy loading)
        self.image_video_service = None
        self.text_service = None
        self.voice_service = None
        
        self._initialize_services()
    
    def _initialize_services(self):
        """Initialize all emotion detection services"""
        try:
            logger.info("🔧 Initializing Emotion Detection Services...")
            start_time = time.time()
            
            # 1. Initialize Image/Video service (PRIMARY - AffectNet)
            if self.affectnet_model_path and os.path.exists(self.affectnet_model_path):
                logger.info(f"   📸 Loading AffectNet model from {self.affectnet_model_path}...")
                self.image_video_service = ImageVideoEmotionService(
                    model_path=self.affectnet_model_path,
                    device=self.device
                )
                logger.info(f"   ✅ AffectNet model loaded ({time.time() - start_time:.2f}s)")
            else:
                logger.warning("   ⚠️ AffectNet model path not found - image/video detection disabled")
            
            # 2. Initialize Text service (SECONDARY)
            if self.text_model_path and os.path.exists(self.text_model_path):
                logger.info(f"   📝 Loading Text emotion model from {self.text_model_path}...")
                self.text_service = TextEmotionService(
                    model_path=self.text_model_path,
                    device=self.device
                )
                logger.info(f"   ✅ Text model loaded ({time.time() - start_time:.2f}s)")
            else:
                logger.warning("   ⚠️ Text model path not found - text detection disabled")
            
            # 3. Initialize Voice service (TERTIARY)
            if self.voice_model_path and os.path.exists(self.voice_model_path):
                logger.info(f"   🎤 Loading Voice emotion model from {self.voice_model_path}...")
                self.voice_service = VoiceEmotionService(
                    model_path=self.voice_model_path,
                    device=self.device
                )
                logger.info(f"   ✅ Voice model loaded ({time.time() - start_time:.2f}s)")
            else:
                logger.warning("   ⚠️ Voice model path not found - voice detection disabled")
            
            logger.info(f"✅ Emotion Detection Services initialized! (Total time: {time.time() - start_time:.2f}s)\n")
            
        except Exception as e:
            logger.error(f"❌ Error initializing emotion services: {str(e)}")
            raise
    
    def detect(
        self,
        image_file: Optional[Any] = None,
        video_file: Optional[Any] = None,
        video_frame: Optional[Any] = None,  # For real-time video frames
        text: Optional[str] = None,
        voice_file: Optional[Any] = None,
        modality_priority: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Detect emotion from available modalities with priority handling
        
        Priority order (if multiple modalities provided):
        1. Image/Video (PRIMARY)
        2. Text (SECONDARY)
        3. Voice (TERTIARY)
        
        Args:
            image_file: Image file (PIL, numpy, file path)
            video_file: Video file path
            video_frame: Single video frame (for real-time)
            text: Text content
            voice_file: Audio file
            modality_priority: Override priority order [list of 'image', 'text', 'voice']
            
        Returns:
            dict with keys:
                - dominant_emotion: str
                - confidence: float (0-1)
                - all_emotions: dict {emotion: confidence}
                - modality_used: str ('image', 'video', 'text', 'voice')
                - valence: float (-1 to 1)
                - arousal: float (0 to 1)
                - processing_time_ms: int
        """
        start_time = time.time()
        priority = modality_priority or ['image', 'video', 'text', 'voice']
        
        # Try each modality in priority order
        for modality in priority:
            try:
                if modality == 'image' and (image_file or video_frame):
                    if not self.image_video_service:
                        continue
                    
                    logger.info("   📸 Detecting emotion from image/video frame...")
                    result = self.image_video_service.detect_from_image(
                        image_file or video_frame
                    )
                    result['modality_used'] = 'image'
                    result['processing_time_ms'] = int((time.time() - start_time) * 1000)
                    logger.info(f"   ✅ Emotion detected: {result['dominant_emotion']} ({result['confidence']:.2%})")
                    return result
                
                elif modality == 'video' and video_file:
                    if not self.image_video_service:
                        continue
                    
                    logger.info("   🎥 Detecting emotion from video...")
                    result = self.image_video_service.detect_from_video(video_file)
                    result['modality_used'] = 'video'
                    result['processing_time_ms'] = int((time.time() - start_time) * 1000)
                    logger.info(f"   ✅ Emotion detected: {result['dominant_emotion']} ({result['confidence']:.2%})")
                    return result
                
                elif modality == 'text' and text:
                    if not self.text_service:
                        continue
                    
                    logger.info("   📝 Detecting emotion from text...")
                    result = self.text_service.detect_from_text(text)
                    result['modality_used'] = 'text'
                    result['processing_time_ms'] = int((time.time() - start_time) * 1000)
                    logger.info(f"   ✅ Emotion detected: {result['dominant_emotion']} ({result['confidence']:.2%})")
                    return result
                
                elif modality == 'voice' and voice_file:
                    if not self.voice_service:
                        continue
                    
                    logger.info("   🎤 Detecting emotion from voice...")
                    result = self.voice_service.detect_from_voice(voice_file)
                    result['modality_used'] = 'voice'
                    result['processing_time_ms'] = int((time.time() - start_time) * 1000)
                    logger.info(f"   ✅ Emotion detected: {result['dominant_emotion']} ({result['confidence']:.2%})")
                    return result
                    
            except Exception as e:
                logger.warning(f"   ⚠️ Error detecting from {modality}: {str(e)}, trying next modality...")
                continue
        
        # No modality succeeded
        return {
            'dominant_emotion': 'neutral',
            'confidence': 0.0,
            'all_emotions': {'neutral': 0.5},
            'modality_used': 'none',
            'valence': 0.0,
            'arousal': 0.5,
            'processing_time_ms': int((time.time() - start_time) * 1000),
            'error': 'No valid input modality provided or all services unavailable'
        }
    
    def detect_real_time_video(self, video_stream_url: str = None, camera_index: int = 0):
        """
        Real-time emotion detection from video stream
        
        Args:
            video_stream_url: URL to video stream (optional)
            camera_index: Webcam index (default 0)
            
        Yields:
            dict: Emotion detection results for each frame
        """
        if not self.image_video_service:
            raise ValueError("Image/Video service not initialized")
        
        return self.image_video_service.detect_real_time(
            video_stream_url=video_stream_url,
            camera_index=camera_index
        )


# Singleton instance
_emotion_service_instance = None

def get_emotion_service(**kwargs):
    """Get or create singleton emotion detection service instance"""
    global _emotion_service_instance
    if _emotion_service_instance is None:
        logger.info("\n🚀 Creating new Emotion Detection Service (first time initialization)...")
        try:
            _emotion_service_instance = EmotionDetectionService(**kwargs)
        except Exception as e:
            logger.error(f"❌ Failed to initialize Emotion Detection Service: {str(e)}")
            _emotion_service_instance = None
            raise
    else:
        logger.info("♻️ Using existing Emotion Detection Service instance")
    return _emotion_service_instance
```

---

### 2. Image/Video Service (AffectNet - PRIMARY)

```python
"""
Image/Video Emotion Detection Service using AffectNet model
PRIMARY modality for emotion detection
"""
import cv2
import numpy as np
from PIL import Image
import pickle
import torch
import logging
from typing import Dict, Any, Optional, Union, Iterator

logger = logging.getLogger(__name__)


class ImageVideoEmotionService:
    """Emotion detection from images and videos using AffectNet-trained model"""
    
    # AffectNet emotion labels (standard 8 emotions)
    AFFECTNET_EMOTIONS = [
        'neutral', 'happy', 'sad', 'angry', 'surprised',
        'fearful', 'disgusted', 'contempt'
    ]
    
    def __init__(self, model_path: str, device: str = 'cpu'):
        """
        Initialize image/video emotion detection service
        
        Args:
            model_path: Path to trained model (.pkl, .pt, .h5, etc.)
            device: 'cpu' or 'cuda'
        """
        self.model_path = model_path
        self.device = device
        self.model = None
        self.preprocessor = None
        self._load_model()
    
    def _load_model(self):
        """Load the trained AffectNet model"""
        try:
            logger.info(f"   Loading AffectNet model from {self.model_path}...")
            
            # Determine model type from extension
            if self.model_path.endswith('.pkl'):
                with open(self.model_path, 'rb') as f:
                    model_data = pickle.load(f)
                    self.model = model_data.get('model')
                    self.preprocessor = model_data.get('preprocessor')
            elif self.model_path.endswith('.pt') or self.model_path.endswith('.pth'):
                # PyTorch model
                self.model = torch.load(self.model_path, map_location=self.device)
                self.model.eval()
                # Load preprocessor separately if needed
            elif self.model_path.endswith('.h5'):
                # Keras/TensorFlow model
                import tensorflow as tf
                self.model = tf.keras.models.load_model(self.model_path)
            
            logger.info("   ✅ AffectNet model loaded successfully")
        except Exception as e:
            logger.error(f"   ❌ Error loading model: {str(e)}")
            raise
    
    def _preprocess_image(self, image: Union[np.ndarray, Image.Image, str]) -> np.ndarray:
        """
        Preprocess image for model input
        
        Args:
            image: PIL Image, numpy array, or file path
            
        Returns:
            Preprocessed numpy array
        """
        # Convert to numpy array
        if isinstance(image, str):
            image = cv2.imread(image)
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        elif isinstance(image, Image.Image):
            image = np.array(image)
        elif isinstance(image, np.ndarray):
            if len(image.shape) == 3 and image.shape[2] == 3:
                # BGR to RGB if needed
                image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB) if image.shape[2] == 3 else image
        
        # Resize to model input size (typically 224x224 for AffectNet)
        image = cv2.resize(image, (224, 224))
        
        # Normalize
        image = image.astype(np.float32) / 255.0
        
        # Apply custom preprocessor if available
        if self.preprocessor:
            image = self.preprocessor(image)
        else:
            # Default preprocessing: normalize to [-1, 1]
            image = (image - 0.5) / 0.5
        
        return image
    
    def detect_from_image(self, image: Union[np.ndarray, Image.Image, str]) -> Dict[str, Any]:
        """
        Detect emotion from a single image
        
        Args:
            image: PIL Image, numpy array, or file path
            
        Returns:
            dict with emotion predictions
        """
        # Preprocess
        processed_image = self._preprocess_image(image)
        
        # Add batch dimension
        if len(processed_image.shape) == 3:
            processed_image = np.expand_dims(processed_image, axis=0)
        
        # Predict
        predictions = self._predict(processed_image)
        
        # Get dominant emotion
        dominant_idx = np.argmax(predictions)
        dominant_emotion = self.AFFECTNET_EMOTIONS[dominant_idx]
        confidence = float(predictions[dominant_idx])
        
        # Create emotion dict
        all_emotions = {
            self.AFFECTNET_EMOTIONS[i]: float(pred)
            for i, pred in enumerate(predictions)
        }
        
        # Calculate valence and arousal (map from emotion categories)
        valence, arousal = self._emotion_to_valence_arousal(dominant_emotion, confidence)
        
        return {
            'dominant_emotion': dominant_emotion,
            'confidence': confidence,
            'all_emotions': all_emotions,
            'valence': valence,
            'arousal': arousal
        }
    
    def detect_from_video(self, video_path: str, sample_frames: int = 30) -> Dict[str, Any]:
        """
        Detect emotion from video (process multiple frames)
        
        Args:
            video_path: Path to video file
            sample_frames: Number of frames to sample
            
        Returns:
            Aggregated emotion predictions across frames
        """
        cap = cv2.VideoCapture(video_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        frame_indices = np.linspace(0, total_frames - 1, sample_frames, dtype=int)
        
        all_predictions = []
        for idx in frame_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ret, frame = cap.read()
            if ret:
                result = self.detect_from_image(frame)
                all_predictions.append(result)
        
        cap.release()
        
        # Aggregate predictions (average)
        return self._aggregate_predictions(all_predictions)
    
    def detect_real_time(self, video_stream_url: str = None, camera_index: int = 0) -> Iterator[Dict[str, Any]]:
        """
        Real-time emotion detection from video stream
        
        Args:
            video_stream_url: URL to video stream (optional)
            camera_index: Webcam index (default 0)
            
        Yields:
            dict: Emotion detection for each frame
        """
        # Open video stream
        if video_stream_url:
            cap = cv2.VideoCapture(video_stream_url)
        else:
            cap = cv2.VideoCapture(camera_index)
        
        if not cap.isOpened():
            raise ValueError("Cannot open video stream")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Detect emotion
            result = self.detect_from_image(frame)
            result['frame'] = frame  # Include frame for visualization
            
            yield result
        
        cap.release()
    
    def _predict(self, image_array: np.ndarray) -> np.ndarray:
        """Run model prediction"""
        # Convert to tensor if PyTorch
        if isinstance(self.model, torch.nn.Module):
            with torch.no_grad():
                tensor = torch.from_numpy(image_array).to(self.device)
                if tensor.dtype != torch.float32:
                    tensor = tensor.float()
                output = self.model(tensor)
                predictions = torch.softmax(output, dim=1).cpu().numpy()[0]
        else:
            # Keras/TensorFlow or sklearn
            predictions = self.model.predict(image_array, verbose=0)[0]
            if predictions.sum() > 1.1:  # Not normalized
                predictions = predictions / predictions.sum()
        
        return predictions
    
    def _emotion_to_valence_arousal(self, emotion: str, confidence: float) -> tuple:
        """Map emotion to valence-arousal space"""
        # Valence: -1 (negative) to +1 (positive)
        # Arousal: 0 (calm) to 1 (excited)
        mapping = {
            'happy': (0.8, 0.7),
            'sad': (-0.6, 0.3),
            'angry': (-0.4, 0.9),
            'surprised': (0.3, 0.9),
            'fearful': (-0.7, 0.9),
            'disgusted': (-0.5, 0.6),
            'contempt': (-0.3, 0.4),
            'neutral': (0.0, 0.3)
        }
        base_valence, base_arousal = mapping.get(emotion, (0.0, 0.5))
        return float(base_valence * confidence), float(base_arousal * confidence)
    
    def _aggregate_predictions(self, predictions: list) -> Dict[str, Any]:
        """Aggregate multiple predictions (average)"""
        if not predictions:
            return {
                'dominant_emotion': 'neutral',
                'confidence': 0.0,
                'all_emotions': {}
            }
        
        # Average all emotion scores
        avg_emotions = {}
        for emotion in self.AFFECTNET_EMOTIONS:
            scores = [p['all_emotions'].get(emotion, 0.0) for p in predictions]
            avg_emotions[emotion] = float(np.mean(scores))
        
        # Get dominant
        dominant_emotion = max(avg_emotions, key=avg_emotions.get)
        confidence = avg_emotions[dominant_emotion]
        
        return {
            'dominant_emotion': dominant_emotion,
            'confidence': confidence,
            'all_emotions': avg_emotions,
            'valence': float(np.mean([p.get('valence', 0.0) for p in predictions])),
            'arousal': float(np.mean([p.get('arousal', 0.5) for p in predictions]))
        }
```

---

### 3. Text Service (SECONDARY)

```python
"""
Text Emotion Detection Service
SECONDARY modality for emotion detection
"""
import pickle
import numpy as np
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class TextEmotionService:
    """Emotion detection from text"""
    
    TEXT_EMOTIONS = [
        'happy', 'sad', 'angry', 'anxious', 'calm',
        'excited', 'grateful', 'frustrated', 'neutral'
    ]
    
    def __init__(self, model_path: str, device: str = 'cpu'):
        self.model_path = model_path
        self.device = device
        self.model = None
        self.tokenizer = None
        self._load_model()
    
    def _load_model(self):
        """Load trained text emotion model"""
        try:
            logger.info(f"   Loading Text emotion model from {self.model_path}...")
            with open(self.model_path, 'rb') as f:
                model_data = pickle.load(f)
                self.model = model_data.get('model')
                self.tokenizer = model_data.get('tokenizer')
                self.vectorizer = model_data.get('vectorizer')  # For sklearn models
            logger.info("   ✅ Text model loaded successfully")
        except Exception as e:
            logger.error(f"   ❌ Error loading text model: {str(e)}")
            raise
    
    def detect_from_text(self, text: str) -> Dict[str, Any]:
        """Detect emotion from text"""
        # Preprocess
        if self.vectorizer:
            features = self.vectorizer.transform([text])
            predictions = self.model.predict_proba(features)[0]
        else:
            # For neural models
            # Implement tokenization and prediction
            predictions = self.model.predict([text])[0]
        
        # Map to emotions
        emotion_scores = dict(zip(self.TEXT_EMOTIONS, predictions))
        dominant_emotion = max(emotion_scores, key=emotion_scores.get)
        confidence = emotion_scores[dominant_emotion]
        
        return {
            'dominant_emotion': dominant_emotion,
            'confidence': float(confidence),
            'all_emotions': {k: float(v) for k, v in emotion_scores.items()},
            'valence': self._text_to_valence(dominant_emotion),
            'arousal': self._text_to_arousal(dominant_emotion)
        }
    
    def _text_to_valence(self, emotion: str) -> float:
        mapping = {'happy': 0.8, 'sad': -0.6, 'angry': -0.4, 'anxious': -0.5,
                  'calm': 0.2, 'excited': 0.7, 'grateful': 0.6, 'frustrated': -0.3, 'neutral': 0.0}
        return mapping.get(emotion, 0.0)
    
    def _text_to_arousal(self, emotion: str) -> float:
        mapping = {'happy': 0.6, 'sad': 0.3, 'angry': 0.9, 'anxious': 0.8,
                  'calm': 0.2, 'excited': 0.9, 'grateful': 0.4, 'frustrated': 0.7, 'neutral': 0.3}
        return mapping.get(emotion, 0.5)
```

---

### 4. Voice Service (TERTIARY)

```python
"""
Voice Emotion Detection Service
TERTIARY modality for emotion detection
"""
import pickle
import librosa
import numpy as np
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class VoiceEmotionService:
    """Emotion detection from voice/audio"""
    
    VOICE_EMOTIONS = [
        'happy', 'sad', 'angry', 'anxious', 'calm',
        'excited', 'neutral', 'surprised'
    ]
    
    def __init__(self, model_path: str, device: str = 'cpu'):
        self.model_path = model_path
        self.device = device
        self.model = None
        self._load_model()
    
    def _load_model(self):
        """Load trained voice emotion model"""
        try:
            logger.info(f"   Loading Voice emotion model from {self.model_path}...")
            with open(self.model_path, 'rb') as f:
                model_data = pickle.load(f)
                self.model = model_data.get('model')
                self.feature_extractor = model_data.get('feature_extractor')
            logger.info("   ✅ Voice model loaded successfully")
        except Exception as e:
            logger.error(f"   ❌ Error loading voice model: {str(e)}")
            raise
    
    def detect_from_voice(self, audio_file) -> Dict[str, Any]:
        """Extract features and detect emotion"""
        # Extract audio features (MFCC, spectral features, etc.)
        features = self._extract_features(audio_file)
        
        # Predict
        predictions = self.model.predict_proba([features])[0]
        
        # Map to emotions
        emotion_scores = dict(zip(self.VOICE_EMOTIONS, predictions))
        dominant_emotion = max(emotion_scores, key=emotion_scores.get)
        confidence = emotion_scores[dominant_emotion]
        
        return {
            'dominant_emotion': dominant_emotion,
            'confidence': float(confidence),
            'all_emotions': {k: float(v) for k, v in emotion_scores.items()},
            'valence': self._voice_to_valence(dominant_emotion),
            'arousal': self._voice_to_arousal(dominant_emotion)
        }
    
    def _extract_features(self, audio_file) -> np.ndarray:
        """Extract audio features (MFCC, pitch, etc.)"""
        y, sr = librosa.load(audio_file)
        
        # Extract features
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        chroma = librosa.feature.chroma(y=y, sr=sr)
        mel = librosa.feature.melspectrogram(y=y, sr=sr)
        
        # Aggregate (mean)
        features = np.concatenate([
            np.mean(mfccs, axis=1),
            np.mean(chroma, axis=1),
            np.mean(mel, axis=1)
        ])
        
        return features
    
    def _voice_to_valence(self, emotion: str) -> float:
        mapping = {'happy': 0.8, 'sad': -0.6, 'angry': -0.4, 'anxious': -0.5,
                  'calm': 0.2, 'excited': 0.7, 'neutral': 0.0, 'surprised': 0.3}
        return mapping.get(emotion, 0.0)
    
    def _voice_to_arousal(self, emotion: str) -> float:
        mapping = {'happy': 0.6, 'sad': 0.3, 'angry': 0.9, 'anxious': 0.8,
                  'calm': 0.2, 'excited': 0.9, 'neutral': 0.3, 'surprised': 0.8}
        return mapping.get(emotion, 0.5)
```

---

## API Endpoints

### Views (`backend/emotions/views.py`)

```python
"""
API endpoints for emotion detection
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
import logging

from .emotion_service import get_emotion_service
from .models import EmotionDetection
from journal.models import JournalEntry

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def detect_emotion(request):
    """
    Detect emotion from image, video, text, or voice
    POST /api/emotions/detect/
    
    Body (multipart/form-data):
    - image_file: Image file (optional)
    - video_file: Video file (optional)
    - text: Text string (optional)
    - voice_file: Audio file (optional)
    - entry_id: Journal entry ID to associate with (optional)
    """
    try:
        service = get_emotion_service()
        
        # Get inputs
        image_file = request.FILES.get('image_file')
        video_file = request.FILES.get('video_file')
        text = request.data.get('text')
        voice_file = request.FILES.get('voice_file')
        entry_id = request.data.get('entry_id')
        
        # Detect emotion
        result = service.detect(
            image_file=image_file,
            video_file=video_file,
            text=text,
            voice_file=voice_file
        )
        
        # Save to database if entry_id provided
        if entry_id:
            try:
                entry = JournalEntry.objects.get(id=entry_id, user=request.user)
                
                EmotionDetection.objects.create(
                    entry=entry,
                    modality=result['modality_used'],
                    happy=result['all_emotions'].get('happy', 0.0),
                    sad=result['all_emotions'].get('sad', 0.0),
                    angry=result['all_emotions'].get('angry', 0.0),
                    anxious=result['all_emotions'].get('anxious', 0.0),
                    neutral=result['all_emotions'].get('neutral', 0.0),
                    surprised=result['all_emotions'].get('surprised', 0.0),
                    disgusted=result['all_emotions'].get('disgusted', 0.0),
                    fearful=result['all_emotions'].get('fearful', 0.0),
                    valence=result.get('valence', 0.0),
                    arousal=result.get('arousal', 0.5),
                    confidence=result['confidence']
                )
            except JournalEntry.DoesNotExist:
                pass
        
        return Response(result, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in emotion detection: {str(e)}")
        return Response({
            'error': str(e),
            'dominant_emotion': 'neutral',
            'confidence': 0.0
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def detect_realtime_video(request):
    """
    Start real-time video emotion detection
    POST /api/emotions/detect/realtime/
    
    Body:
    - camera_index: Webcam index (default 0)
    - video_stream_url: Stream URL (optional)
    """
    try:
        service = get_emotion_service()
        camera_index = int(request.data.get('camera_index', 0))
        stream_url = request.data.get('video_stream_url')
        
        # Return WebSocket URL or SSE endpoint for real-time streaming
        # Implementation depends on WebSocket/SSE setup
        
        return Response({
            'message': 'Real-time detection started',
            'stream_url': '/api/emotions/stream/'  # WebSocket endpoint
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

---

## Environment Variables

```bash
# .env
AFFECTNET_MODEL_PATH=models/affectnet_model.pkl
TEXT_MODEL_PATH=models/text_emotion_model.pkl
VOICE_MODEL_PATH=models/voice_emotion_model.pkl
EMOTION_DEVICE=cpu  # or 'cuda' for GPU
```

---

## Usage Example

```python
# In Django view or service
from emotions.emotion_service import get_emotion_service

# Get service instance (singleton)
service = get_emotion_service()

# Detect from image (PRIMARY)
result = service.detect(image_file=uploaded_image)
# Returns: {'dominant_emotion': 'happy', 'confidence': 0.92, ...}

# Detect from text (if no image)
result = service.detect(text="I'm feeling great today!")

# Real-time video
for frame_result in service.detect_real_time_video(camera_index=0):
    emotion = frame_result['dominant_emotion']
    confidence = frame_result['confidence']
    # Process frame...
```

---

## Migration to Microservices (Future)

1. **Deploy each service separately:**
   - `image-video-service`: FastAPI app on port 8001
   - `text-service`: FastAPI app on port 8002
   - `voice-service`: FastAPI app on port 8003

2. **Update Django service:**
   ```python
   class EmotionMicroserviceClient:
       def detect(self, ...):
           # Try image service first
           if image_file:
               return requests.post('http://image-service:8001/detect', ...)
           # Fallback to text, then voice
   ```

3. **Benefits:**
   - Independent scaling
   - Separate deployments
   - Different tech stacks if needed
   - Load balancing

---

## Next Steps

1. **Train models separately** (outside Django)
2. **Save models** as `.pkl`, `.pt`, or `.h5` files
3. **Place models** in `backend/models/` directory
4. **Set environment variables** with model paths
5. **Implement services** following the architecture above
6. **Test** with sample inputs
7. **Integrate** with journal entry creation flow




