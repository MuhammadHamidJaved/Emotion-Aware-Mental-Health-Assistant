# Emotion Detection Microservice

A scalable, secure microservice for real-time facial emotion detection from video streams using deep learning models.

## Features

- 🎯 **Real-time Emotion Detection**: Detect 7 emotions (angry, disgust, fear, happy, neutral, sad, surprise)
- 🔒 **Security First**: Input validation, file size limits, secure headers
- 🚀 **High Performance**: GPU support, optimized inference pipeline
- 📊 **Multiple Models**: Custom CNN and EfficientNet-B0 support
- 🌐 **RESTful API**: Easy integration with FastAPI
- 📹 **Flexible Input**: Support for file upload and base64 encoded images
- 🔍 **Face Detection**: Automatic face detection using Haar Cascades

## Architecture

```
emotion_microservice/
├── main.py              # FastAPI application
├── config.py            # Configuration settings
├── models.py            # Model architectures
├── inference.py         # Prediction logic
├── utils.py             # Security & validation utilities
├── requirements.txt     # Python dependencies
├── .env.example         # Environment variables template
├── models/              # Model weights directory
│   ├── custom_cnn_best.pth
│   └── efficientnet-b0_best.pth
└── README.md
```

## Installation

### Prerequisites

- Python 3.8 or higher
- pip package manager
- (Optional) CUDA-capable GPU for faster inference

### Setup Steps

1. **Navigate to the microservice directory**:
   ```bash
   cd emotion_microservice
   ```

2. **Create a virtual environment** (recommended):
   ```bash
   python -m venv venv
   # Windows
   .\venv\Scripts\activate
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   ```bash
   copy .env.example .env
   # Edit .env with your preferred settings
   ```

5. **Ensure model files are in the models directory**:
   - `models/custom_cnn_best.pth`
   - `models/efficientnet-b0_best.pth`

## Usage

### Starting the Server

```bash
# Development mode (with auto-reload)
python main.py

# Production mode with uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

The API will be available at `http://localhost:8000`

### API Documentation

Interactive API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Health Check
```bash
GET /health
```
Returns service health status and model information.

### Predict from File Upload
```bash
POST /predict/upload
Content-Type: multipart/form-data

Parameters:
- file: Image file (JPEG, PNG)

Response:
{
  "num_faces": 1,
  "faces": [
    {
      "face_id": 0,
      "bbox": {"x": 100, "y": 50, "width": 150, "height": 150},
      "emotion": "happy",
      "confidence": 0.95,
      "all_emotions": {
        "angry": 0.01,
        "disgust": 0.00,
        "fear": 0.01,
        "happy": 0.95,
        "neutral": 0.02,
        "sad": 0.00,
        "surprise": 0.01
      }
    }
  ],
  "processing_time_ms": 45.23
}
```

### Predict from Base64 Image
```bash
POST /predict/base64
Content-Type: application/json

Body:
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "model_type": "custom_cnn"
}

Response: Same as /predict/upload
```

### Get Model Information
```bash
GET /models/info

Response:
{
  "current_model": "custom_cnn",
  "available_models": ["custom_cnn", "efficientnet"],
  "emotion_classes": ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"],
  "num_classes": 7
}
```

### Get Emotion Classes
```bash
GET /emotions

Response:
{
  "emotions": ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"],
  "count": 7
}
```

## Integration Example

### Python Client
```python
import requests
import base64

# Using file upload
with open('frame.jpg', 'rb') as f:
    files = {'file': f}
    response = requests.post('http://localhost:8000/predict/upload', files=files)
    result = response.json()
    print(f"Detected {result['num_faces']} faces")
    for face in result['faces']:
        print(f"Emotion: {face['emotion']} (confidence: {face['confidence']:.2f})")

# Using base64
with open('frame.jpg', 'rb') as f:
    image_data = base64.b64encode(f.read()).decode('utf-8')
    
payload = {
    'image': f'data:image/jpeg;base64,{image_data}',
    'model_type': 'custom_cnn'
}
response = requests.post('http://localhost:8000/predict/base64', json=payload)
result = response.json()
```

### JavaScript/TypeScript Client
```javascript
// Using Fetch API with webcam
const captureAndPredict = async () => {
  const canvas = document.createElement('canvas');
  const video = document.querySelector('video');
  
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  
  const base64Image = canvas.toDataURL('image/jpeg');
  
  const response = await fetch('http://localhost:8000/predict/base64', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: base64Image,
      model_type: 'custom_cnn'
    })
  });
  
  const result = await response.json();
  console.log('Detected emotions:', result);
};
```

## Security Features

- **Input Validation**: File size limits, format validation
- **Security Headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- **CORS Configuration**: Configurable allowed origins
- **Image Validation**: Prevents malformed or malicious images
- **Error Handling**: Secure error messages without exposing internals

## Configuration

Edit `.env` file to configure:

- `DEFAULT_MODEL`: Choose between `custom_cnn` or `efficientnet`
- `API_PORT`: Change server port (default: 8000)
- `ALLOWED_ORIGINS`: Configure CORS for your client applications
- `MAX_CONTENT_LENGTH`: Maximum upload file size
- `DEBUG`: Enable/disable debug mode

## Models

### Custom CNN
- Input: 48x48 grayscale images
- Architecture: 3 convolutional blocks with batch normalization
- Fast inference, optimized for real-time processing

### EfficientNet-B0
- Input: 224x224 RGB images
- Transfer learning from ImageNet
- Higher accuracy, slightly slower inference

## Performance

- **Inference Time**: ~40-50ms per frame (GPU), ~150-200ms (CPU)
- **Throughput**: ~20-25 FPS (GPU), ~5-7 FPS (CPU)
- **Concurrent Requests**: Supports multiple simultaneous clients

## Troubleshooting

### Model Not Loading
- Ensure `.pth` files are in the `models/` directory
- Check file names match configuration
- Verify PyTorch version compatibility

### CUDA Not Available
- Install CUDA toolkit matching PyTorch version
- Verify GPU drivers are up to date
- Check with `torch.cuda.is_available()`

### High Memory Usage
- Reduce `MAX_FRAME_SIZE` in config
- Use Custom CNN instead of EfficientNet
- Limit concurrent requests

## Development

### Running Tests
```bash
pytest tests/
```

### Code Style
```bash
# Format code
black .

# Lint
flake8 .
```

## License

This project is for educational/research purposes.

## Support

For issues and questions, please create an issue in the repository.

## Acknowledgments

- PyTorch team for the deep learning framework
- FastAPI for the excellent web framework
- OpenCV for computer vision utilities
