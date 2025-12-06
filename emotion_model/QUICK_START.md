# Quick Start Guide

## Setup

1. **Copy your model file:**
   ```bash
   # Copy ResNet50_best.pth to the emotion_model folder
   cp ResNet50_best.pth emotion_model/
   ```

2. **Install dependencies:**
   ```bash
   cd emotion_model
   pip install -r requirements.txt
   ```

## Testing the Model

### 1. Basic Model Test
```bash
python test_model.py
```
This will:
- Test model loading
- Test forward pass
- Show class probabilities
- Check for consistent predictions

### 2. Verify Model Weights
```bash
python verify_model.py
```
This will:
- Verify all ResNet layers are loaded
- Check classifier weights
- Test feature extraction
- Verify features vary between inputs

### 3. Test with Single Image
```bash
python predict.py --image path/to/your/image.jpg
```

### 4. Test with Webcam
```bash
python predict.py --webcam
```
Press 'q' to quit.

## Generate Confusion Matrix

### Option 1: Directory Structure
Organize test images in folders:
```
test_data/
    Neutral/
        img1.jpg
        ...
    Happy/
        img1.jpg
        ...
    ...
```

Then run:
```bash
python confusion_matrix.py --data_dir test_data
```

### Option 2: CSV File
Create a CSV with image paths and labels:
```csv
image_path,label
path/to/img1.jpg,Neutral
path/to/img2.jpg,Happy
...
```

Then run:
```bash
python confusion_matrix.py --csv test_data.csv
```

## Using the Python API

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

# Predict from bytes
with open('image.jpg', 'rb') as f:
    result = detector.predict_from_bytes(f.read())
```

## Emotion Classes

The model predicts 8 emotions (AffectNet order):
- 0: Neutral
- 1: Happy
- 2: Sad
- 3: Surprise
- 4: Fear
- 5: Disgust
- 6: Anger
- 7: Contempt

## Troubleshooting

### Model file not found
- Make sure `ResNet50_best.pth` is in the `emotion_model` folder
- Or specify path: `python predict.py --model path/to/ResNet50_best.pth`

### Import errors
- Make sure you're in the `emotion_model` directory
- Or add it to Python path

### GPU not working
- Install CUDA-enabled PyTorch if you have GPU
- Or use `--device cpu` flag

