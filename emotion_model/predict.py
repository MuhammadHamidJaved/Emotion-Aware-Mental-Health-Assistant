import torch
import torch.nn.functional as F
from PIL import Image
import torchvision.transforms as transforms
import argparse
import os
from model import load_model

# Default emotion classes (FER2013 standard - 7 classes)
EMOTION_LABELS_7 = ['Angry', 'Disgust', 'Fear', 'Happy', 'Neutral', 'Sad', 'Surprise']
# AffectNet emotion classes (8 classes) - correct order
AFFECTNET_LABELS = ['Neutral', 'Happy', 'Sad', 'Surprise', 'Fear', 'Disgust', 'Anger', 'Contempt']

def preprocess_image(image_path, image_size=(224, 224)):
    """
    Preprocess an image for model input.
    
    Args:
        image_path (str): Path to the image file
        image_size (tuple): Target size for the image (width, height)
    
    Returns:
        tensor: Preprocessed image tensor
    """
    # Define the same transforms used during training
    transform = transforms.Compose([
        transforms.Resize(image_size),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                           std=[0.229, 0.224, 0.225])
    ])
    
    # Load and preprocess image
    image = Image.open(image_path).convert('RGB')
    image_tensor = transform(image).unsqueeze(0)  # Add batch dimension
    return image_tensor

def predict_emotion(model, image_path, device='cpu', emotion_labels=None):
    """
    Predict emotion from a facial expression image.
    
    Args:
        model: Loaded PyTorch model
        image_path (str): Path to the image file
        device (str): Device to run inference on ('cpu' or 'cuda')
        emotion_labels (list): List of emotion class names
    
    Returns:
        dict: Dictionary containing predicted emotion and confidence scores
    """
    if emotion_labels is None:
        # Auto-detect number of classes from model
        num_classes = model.classifier[-1].out_features
        if num_classes == 8:
            emotion_labels = AFFECTNET_LABELS  # Use AffectNet labels for 8 classes
        else:
            emotion_labels = EMOTION_LABELS_7[:num_classes] if num_classes <= len(EMOTION_LABELS_7) else EMOTION_LABELS_7
    
    # Preprocess image
    image_tensor = preprocess_image(image_path)
    image_tensor = image_tensor.to(device)
    
    # Make prediction
    with torch.no_grad():
        outputs = model(image_tensor)
        probabilities = F.softmax(outputs, dim=1)
        confidence, predicted = torch.max(probabilities, 1)
    
    # Get all class probabilities
    probs = probabilities[0].cpu().numpy()
    emotion_scores = {emotion_labels[i]: float(probs[i]) for i in range(len(emotion_labels))}
    
    # Get top prediction
    predicted_emotion = emotion_labels[predicted.item()]
    confidence_score = confidence.item()
    
    return {
        'predicted_emotion': predicted_emotion,
        'confidence': confidence_score,
        'all_scores': emotion_scores
    }

def predict_from_webcam(model, device='cpu', emotion_labels=None):
    """
    Predict emotion from webcam feed in real-time.
    
    Args:
        model: Loaded PyTorch model
        device (str): Device to run inference on ('cpu' or 'cuda')
        emotion_labels (list): List of emotion class names
    """
    try:
        import cv2
    except ImportError:
        print("OpenCV is required for webcam prediction. Install it with: pip install opencv-python")
        return
    
    if emotion_labels is None:
        # Auto-detect number of classes from model
        num_classes = model.classifier[-1].out_features
        if num_classes == 8:
            emotion_labels = AFFECTNET_LABELS  # Use AffectNet labels for 8 classes
        else:
            emotion_labels = EMOTION_LABELS_7[:num_classes] if num_classes <= len(EMOTION_LABELS_7) else EMOTION_LABELS_7
    
    # Load face detector (Haar Cascade)
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    
    # Initialize webcam
    cap = cv2.VideoCapture(0)
    
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                           std=[0.229, 0.224, 0.225])
    ])
    
    print("Press 'q' to quit webcam prediction")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)
        
        for (x, y, w, h) in faces:
            # Ensure minimum face size
            if w < 50 or h < 50:
                continue
                
            # Extract face region with padding
            padding = 20
            x1 = max(0, x - padding)
            y1 = max(0, y - padding)
            x2 = min(frame.shape[1], x + w + padding)
            y2 = min(frame.shape[0], y + h + padding)
            face_roi = frame[y1:y2, x1:x2]
            
            if face_roi.size == 0:
                continue
            
            try:
                # Convert to PIL Image and preprocess
                face_pil = Image.fromarray(cv2.cvtColor(face_roi, cv2.COLOR_BGR2RGB))
                face_tensor = transform(face_pil).unsqueeze(0).to(device)
                
                # Predict emotion
                model.eval()
                with torch.no_grad():
                    outputs = model(face_tensor)
                    probabilities = F.softmax(outputs, dim=1)
                    confidence, predicted = torch.max(probabilities, 1)
                
                predicted_idx = predicted.item()
                predicted_emotion = emotion_labels[predicted_idx]
                confidence_score = confidence.item()
                
                # Get top 3 predictions for debugging
                probs = probabilities[0].cpu().numpy()
                top3_indices = probs.argsort()[-3:][::-1]
                
                # Draw rectangle and label
                cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                label = f"{predicted_emotion}: {confidence_score:.2%}"
                cv2.putText(frame, label, (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 
                           0.7, (0, 255, 0), 2)
                
                # Show top 3 predictions in console (for debugging)
                if confidence_score < 0.5:  # Low confidence warning
                    print(f"Low confidence prediction: {predicted_emotion} ({confidence_score:.2%})")
                    print(f"  Top 3: {[(emotion_labels[i], f'{probs[i]:.2%}') for i in top3_indices]}")
                    
            except Exception as e:
                print(f"Error processing face: {e}")
                continue
        
        cv2.imshow('Emotion Prediction', frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()

def main():
    parser = argparse.ArgumentParser(description='Predict emotion from facial expression')
    parser.add_argument('--model', type=str, default='ResNet50_best.pth',
                       help='Path to the model file')
    parser.add_argument('--image', type=str, default=None,
                       help='Path to the image file for prediction')
    parser.add_argument('--webcam', action='store_true',
                       help='Use webcam for real-time prediction')
    parser.add_argument('--device', type=str, default='cpu',
                       choices=['cpu', 'cuda'],
                       help='Device to run inference on')
    parser.add_argument('--num_classes', type=int, default=7,
                       help='Number of emotion classes')
    
    args = parser.parse_args()
    
    # Check if model file exists
    if not os.path.exists(args.model):
        print(f"Error: Model file '{args.model}' not found!")
        return
    
    # Set device
    device = torch.device(args.device if torch.cuda.is_available() and args.device == 'cuda' else 'cpu')
    print(f"Using device: {device}")
    
    # Load model
    print(f"Loading model from {args.model}...")
    model = load_model(args.model, num_classes=args.num_classes, device=device)
    print("Model loaded successfully!")
    
    # Make predictions
    if args.webcam:
        predict_from_webcam(model, device=device)
    elif args.image:
        if not os.path.exists(args.image):
            print(f"Error: Image file '{args.image}' not found!")
            return
        
        result = predict_emotion(model, args.image, device=device)
        
        print("\n" + "="*50)
        print("EMOTION PREDICTION RESULTS")
        print("="*50)
        print(f"Predicted Emotion: {result['predicted_emotion']}")
        print(f"Confidence: {result['confidence']:.2%}")
        print("\nAll Emotion Scores:")
        for emotion, score in sorted(result['all_scores'].items(), 
                                   key=lambda x: x[1], reverse=True):
            print(f"  {emotion}: {score:.2%}")
        print("="*50)
    else:
        print("Please provide either --image <path> or --webcam flag")
        parser.print_help()

if __name__ == '__main__':
    main()

