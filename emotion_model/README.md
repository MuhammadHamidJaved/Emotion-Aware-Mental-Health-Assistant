# Emotion Prediction Model

A ResNet50-based emotion classifier trained on AffectNet dataset with 8 emotion classes.

## Model Information

- **Architecture**: ResNet50 with custom emotion classification head
- **Input Size**: 224x224 RGB images
- **Number of Classes**: 8
- **Emotion Classes**: Neutral, Happy, Sad, Surprise, Fear, Disgust, Anger, Contempt
- **Validation Accuracy**: 60.97%

## Installation

1. **Copy your model file:**
   ```bash
   # Copy ResNet50_best.pth to this folder
   # From parent directory:
   copy ResNet50_best.pth emotion_model\
   ```
   Or manually place `ResNet50_best.pth` in the `emotion_model` folder.

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

See `SETUP.md` for detailed setup instructions.

## Quick Start

### Test the Model

```bash
# Test model loading and basic functionality
python test_model.py

# Test with a single image
python predict.py --image path/to/image.jpg

# Test with webcam (real-time)
python predict.py --webcam
```

### Generate Confusion Matrix

```bash
# Using directory structure (each subdirectory is an emotion class)
python confusion_matrix.py --data_dir path/to/test/data

# Using CSV file
python confusion_matrix.py --csv path/to/test_data.csv
```

## Project Structure

```
emotion_model/
├── README.md                 # This file
├── SETUP.md                  # Setup instructions
├── QUICK_START.md            # Quick start guide
├── requirements.txt          # Python dependencies
├── .gitignore               # Git ignore file
├── model.py                  # Model definition and loading
├── predict.py                # Prediction script
├── test_model.py             # Model testing script
├── verify_model.py           # Model verification script
├── confusion_matrix.py       # Confusion matrix generation
├── emotion_detector.py       # Standalone detector class
├── example_usage.py          # Usage examples
└── ResNet50_best.pth         # Trained model weights (copy this file)
```

## Usage Examples

### Python API

```python
from emotion_detector import EmotionDetector

# Initialize detector
detector = EmotionDetector('ResNet50_best.pth', device='cpu')

# Predict from image path
result = detector.predict_from_image_path('image.jpg')
print(f"Emotion: {result['predicted_emotion']}")
print(f"Confidence: {result['confidence']:.2%}")

# Predict from PIL Image
from PIL import Image
image = Image.open('image.jpg')
result = detector.predict_from_pil_image(image)

# Predict from bytes (for file uploads)
with open('image.jpg', 'rb') as f:
    result = detector.predict_from_bytes(f.read())
```

### Command Line

```bash
# Single image prediction
python predict.py --image test_image.jpg

# Webcam prediction
python predict.py --webcam

# Use GPU if available
python predict.py --image test_image.jpg --device cuda
```

## Emotion Classes

The model predicts 8 emotions (AffectNet dataset order):

0. **Neutral** - No particular emotion
1. **Happy** - Joy, happiness
2. **Sad** - Sadness, sorrow
3. **Surprise** - Surprised expression
4. **Fear** - Fearful expression
5. **Disgust** - Disgusted expression
6. **Anger** - Angry expression
7. **Contempt** - Contemptuous expression

## Model Performance

- **Best Validation Accuracy**: 60.97%
- **Best Epoch**: 7
- **Dataset**: AffectNet

## Notes

- The model expects RGB images with faces clearly visible
- For best results, use images with good lighting and frontal face views
- Input images are automatically resized to 224x224 and normalized
- The model uses ImageNet normalization (mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])

## Troubleshooting

### Model not loading
- Check that `ResNet50_best.pth` is in the correct location
- Verify all dependencies are installed
- Run `python test_model.py` to diagnose issues

### Low prediction accuracy
- Ensure images contain clear, frontal faces
- Check image quality and lighting
- Verify preprocessing matches training (224x224, RGB, normalized)

### GPU not working
- Install CUDA-enabled PyTorch: `pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118`
- Check GPU availability: `python -c "import torch; print(torch.cuda.is_available())"`

## License

This model is for research/educational purposes.

