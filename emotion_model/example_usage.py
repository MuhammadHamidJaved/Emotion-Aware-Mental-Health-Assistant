"""
Example usage of the emotion detection model.
This script demonstrates various ways to use the model.
"""

from emotion_detector import EmotionDetector
from PIL import Image
import os

def example_1_basic_prediction():
    """Example 1: Basic prediction from image path."""
    print("="*70)
    print("Example 1: Basic Prediction from Image Path")
    print("="*70)
    
    # Initialize detector
    detector = EmotionDetector('ResNet50_best.pth', device='cpu')
    
    # Predict from image path
    image_path = 'test_image.jpg'  # Replace with your image path
    if os.path.exists(image_path):
        result = detector.predict_from_image_path(image_path)
        
        if result['success']:
            print(f"Image: {image_path}")
            print(f"Predicted Emotion: {result['predicted_emotion']}")
            print(f"Confidence: {result['confidence']:.2%}")
            print(f"Class: {result['predicted_class']}")
            print("\nTop 3 Predictions:")
            for item in result['top_3']:
                print(f"  {item['emotion']}: {item['score']:.2%}")
        else:
            print(f"Error: {result.get('error')}")
    else:
        print(f"Image not found: {image_path}")
        print("Please provide a valid image path.")


def example_2_pil_image():
    """Example 2: Prediction from PIL Image."""
    print("\n" + "="*70)
    print("Example 2: Prediction from PIL Image")
    print("="*70)
    
    detector = EmotionDetector('ResNet50_best.pth', device='cpu')
    
    # Load image with PIL
    image_path = 'test_image.jpg'  # Replace with your image path
    if os.path.exists(image_path):
        image = Image.open(image_path)
        result = detector.predict_from_pil_image(image)
        
        if result['success']:
            print(f"Predicted Emotion: {result['predicted_emotion']}")
            print(f"Confidence: {result['confidence']:.2%}")
            print("\nAll Emotion Scores:")
            for emotion, score in sorted(result['all_scores'].items(), 
                                       key=lambda x: x[1], reverse=True):
                print(f"  {emotion}: {score:.2%}")
    else:
        print(f"Image not found: {image_path}")


def example_3_bytes():
    """Example 3: Prediction from image bytes."""
    print("\n" + "="*70)
    print("Example 3: Prediction from Image Bytes")
    print("="*70)
    
    detector = EmotionDetector('ResNet50_best.pth', device='cpu')
    
    # Read image as bytes
    image_path = 'test_image.jpg'  # Replace with your image path
    if os.path.exists(image_path):
        with open(image_path, 'rb') as f:
            image_bytes = f.read()
        
        result = detector.predict_from_bytes(image_bytes)
        
        if result['success']:
            print(f"Predicted Emotion: {result['predicted_emotion']}")
            print(f"Confidence: {result['confidence']:.2%}")
    else:
        print(f"Image not found: {image_path}")


def example_4_batch_prediction():
    """Example 4: Batch prediction on multiple images."""
    print("\n" + "="*70)
    print("Example 4: Batch Prediction")
    print("="*70)
    
    detector = EmotionDetector('ResNet50_best.pth', device='cpu')
    
    # List of image paths
    image_paths = [
        'test_image1.jpg',
        'test_image2.jpg',
        'test_image3.jpg',
    ]
    
    results = []
    for image_path in image_paths:
        if os.path.exists(image_path):
            result = detector.predict_from_image_path(image_path)
            if result['success']:
                results.append({
                    'image': image_path,
                    'emotion': result['predicted_emotion'],
                    'confidence': result['confidence']
                })
    
    print(f"Processed {len(results)} images:")
    for r in results:
        print(f"  {r['image']}: {r['emotion']} ({r['confidence']:.2%})")


def example_5_filter_by_confidence():
    """Example 5: Filter predictions by confidence threshold."""
    print("\n" + "="*70)
    print("Example 5: Filter by Confidence Threshold")
    print("="*70)
    
    detector = EmotionDetector('ResNet50_best.pth', device='cpu')
    
    image_path = 'test_image.jpg'  # Replace with your image path
    confidence_threshold = 0.5  # 50% confidence threshold
    
    if os.path.exists(image_path):
        result = detector.predict_from_image_path(image_path)
        
        if result['success']:
            if result['confidence'] >= confidence_threshold:
                print(f"✓ High confidence prediction: {result['predicted_emotion']}")
                print(f"  Confidence: {result['confidence']:.2%}")
            else:
                print(f"⚠ Low confidence prediction: {result['predicted_emotion']}")
                print(f"  Confidence: {result['confidence']:.2%}")
                print("  Consider this prediction uncertain.")
    else:
        print(f"Image not found: {image_path}")


if __name__ == '__main__':
    print("Emotion Detection Model - Example Usage")
    print("="*70)
    print("\nNote: Replace 'test_image.jpg' with actual image paths in the examples.")
    print("="*70)
    
    # Run examples (uncomment the ones you want to test)
    # example_1_basic_prediction()
    # example_2_pil_image()
    # example_3_bytes()
    # example_4_batch_prediction()
    # example_5_filter_by_confidence()
    
    print("\n" + "="*70)
    print("To run examples, uncomment them in the main section.")
    print("Make sure you have test images available.")
    print("="*70)

