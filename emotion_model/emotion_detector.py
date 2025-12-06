"""
Standalone emotion detection module for Django integration.
This module can be imported in Django views to predict emotions from images.
"""

import torch
import torch.nn.functional as F
from PIL import Image
import torchvision.transforms as transforms
import numpy as np
import os
from model import load_model

# AffectNet emotion classes (8 classes) - correct order
AFFECTNET_LABELS = ['Neutral', 'Happy', 'Sad', 'Surprise', 'Fear', 'Disgust', 'Anger', 'Contempt']

class EmotionDetector:
    """Emotion detection class for Django integration."""
    
    def __init__(self, model_path='ResNet50_best.pth', device='cpu'):
        """
        Initialize the emotion detector.
        
        Args:
            model_path (str): Path to the .pth model file
            device (str): Device to run inference on ('cpu' or 'cuda')
        """
        self.device = torch.device(device if torch.cuda.is_available() and device == 'cuda' else 'cpu')
        self.model = load_model(model_path, num_classes=8, device=self.device)
        self.model.eval()
        
        # Preprocessing transform (must match training)
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                               std=[0.229, 0.224, 0.225])
        ])
        
        self.emotion_labels = AFFECTNET_LABELS
    
    def predict_from_image_path(self, image_path):
        """
        Predict emotion from an image file path.
        
        Args:
            image_path (str): Path to the image file
            
        Returns:
            dict: Dictionary with prediction results
        """
        try:
            # Load and preprocess image
            image = Image.open(image_path).convert('RGB')
            image_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            # Make prediction
            with torch.no_grad():
                outputs = self.model(image_tensor)
                probabilities = F.softmax(outputs, dim=1)
                confidence, predicted = torch.max(probabilities, 1)
            
            predicted_idx = predicted.item()
            probs = probabilities[0].cpu().numpy()
            
            # Get all emotion scores
            emotion_scores = {
                self.emotion_labels[i]: float(probs[i]) 
                for i in range(len(self.emotion_labels))
            }
            
            return {
                'success': True,
                'predicted_emotion': self.emotion_labels[predicted_idx],
                'predicted_class': predicted_idx,
                'confidence': float(confidence.item()),
                'all_scores': emotion_scores,
                'top_3': self._get_top_n(emotion_scores, 3)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def predict_from_pil_image(self, pil_image):
        """
        Predict emotion from a PIL Image object.
        
        Args:
            pil_image (PIL.Image): PIL Image object
            
        Returns:
            dict: Dictionary with prediction results
        """
        try:
            # Convert to RGB if needed
            if pil_image.mode != 'RGB':
                pil_image = pil_image.convert('RGB')
            
            # Preprocess
            image_tensor = self.transform(pil_image).unsqueeze(0).to(self.device)
            
            # Make prediction
            with torch.no_grad():
                outputs = self.model(image_tensor)
                probabilities = F.softmax(outputs, dim=1)
                confidence, predicted = torch.max(probabilities, 1)
            
            predicted_idx = predicted.item()
            probs = probabilities[0].cpu().numpy()
            
            # Get all emotion scores
            emotion_scores = {
                self.emotion_labels[i]: float(probs[i]) 
                for i in range(len(self.emotion_labels))
            }
            
            return {
                'success': True,
                'predicted_emotion': self.emotion_labels[predicted_idx],
                'predicted_class': predicted_idx,
                'confidence': float(confidence.item()),
                'all_scores': emotion_scores,
                'top_3': self._get_top_n(emotion_scores, 3)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def predict_from_bytes(self, image_bytes):
        """
        Predict emotion from image bytes (useful for Django file uploads).
        
        Args:
            image_bytes (bytes): Image file bytes
            
        Returns:
            dict: Dictionary with prediction results
        """
        try:
            from io import BytesIO
            image = Image.open(BytesIO(image_bytes)).convert('RGB')
            return self.predict_from_pil_image(image)
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _get_top_n(self, emotion_scores, n=3):
        """Get top N emotions by score."""
        sorted_emotions = sorted(emotion_scores.items(), key=lambda x: x[1], reverse=True)
        return [{'emotion': emotion, 'score': score} for emotion, score in sorted_emotions[:n]]


# Global detector instance (lazy loading)
_detector = None

def get_detector(model_path='ResNet50_best.pth', device='cpu'):
    """
    Get or create the global emotion detector instance.
    Use this in Django to avoid reloading the model on every request.
    
    Args:
        model_path (str): Path to the .pth model file
        device (str): Device to run inference on
        
    Returns:
        EmotionDetector: The emotion detector instance
    """
    global _detector
    if _detector is None:
        _detector = EmotionDetector(model_path, device)
    return _detector

