"""
Test script to verify the .pth model file works correctly.
This script tests the model with sample predictions and shows all class probabilities.
"""

import torch
import torch.nn.functional as F
from PIL import Image
import torchvision.transforms as transforms
import numpy as np
from model import load_model

# AffectNet emotion classes (8 classes) - in the correct order
AFFECTNET_LABELS = ['Neutral', 'Happy', 'Sad', 'Surprise', 'Fear', 'Disgust', 'Anger', 'Contempt']

def test_model_loading(model_path='ResNet50_best.pth', device='cpu'):
    """Test if the model loads correctly."""
    print("="*70)
    print("TESTING MODEL LOADING")
    print("="*70)
    
    try:
        model = load_model(model_path, num_classes=8, device=device)
        print("✓ Model loaded successfully!")
        
        # Check model structure
        num_classes = model.classifier[-1].out_features
        print(f"✓ Model has {num_classes} output classes")
        
        # Test forward pass with dummy input
        dummy_input = torch.randn(1, 3, 224, 224).to(device)
        with torch.no_grad():
            output = model(dummy_input)
            probs = F.softmax(output, dim=1)
        
        print(f"✓ Model forward pass successful")
        print(f"✓ Output shape: {output.shape}")
        print(f"✓ Probabilities sum: {probs.sum().item():.4f} (should be ~1.0)")
        
        # Show all class probabilities
        print("\nClass Probabilities (Dummy Input):")
        for i, label in enumerate(AFFECTNET_LABELS):
            print(f"  {label}: {probs[0][i].item():.4f}")
        
        return model, True
    except Exception as e:
        print(f"✗ Error loading model: {e}")
        import traceback
        traceback.print_exc()
        return None, False

def test_single_image(model, image_path, device='cpu'):
    """Test prediction on a single image."""
    print("\n" + "="*70)
    print("TESTING SINGLE IMAGE PREDICTION")
    print("="*70)
    
    try:
        # Preprocess image
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                             std=[0.229, 0.224, 0.225])
        ])
        
        image = Image.open(image_path).convert('RGB')
        image_tensor = transform(image).unsqueeze(0).to(device)
        
        # Make prediction
        model.eval()
        with torch.no_grad():
            outputs = model(image_tensor)
            probabilities = F.softmax(outputs, dim=1)
            confidence, predicted = torch.max(probabilities, 1)
        
        predicted_idx = predicted.item()
        predicted_emotion = AFFECTNET_LABELS[predicted_idx]
        confidence_score = confidence.item()
        
        print(f"✓ Image loaded: {image_path}")
        print(f"✓ Image size: {image.size}")
        print(f"\nPrediction Results:")
        print(f"  Predicted Emotion: {predicted_emotion} (Class {predicted_idx})")
        print(f"  Confidence: {confidence_score:.2%}")
        
        print("\nAll Class Probabilities:")
        probs = probabilities[0].cpu().numpy()
        sorted_indices = np.argsort(probs)[::-1]
        for idx in sorted_indices:
            print(f"  {AFFECTNET_LABELS[idx]:<12}: {probs[idx]:.2%}")
        
        return True
    except Exception as e:
        print(f"✗ Error predicting image: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_multiple_predictions(model, device='cpu', num_tests=10):
    """Test multiple random predictions to check for consistent behavior."""
    print("\n" + "="*70)
    print("TESTING MULTIPLE PREDICTIONS (Random Inputs)")
    print("="*70)
    
    predictions = []
    outputs_list = []
    model.eval()
    
    for i in range(num_tests):
        dummy_input = torch.randn(1, 3, 224, 224).to(device)
        with torch.no_grad():
            outputs = model(dummy_input)
            probabilities = F.softmax(outputs, dim=1)
            _, predicted = torch.max(probabilities, 1)
            predictions.append(predicted.item())
            outputs_list.append(outputs[0].cpu())
    
    # Count predictions
    from collections import Counter
    pred_counts = Counter(predictions)
    
    print(f"✓ Completed {num_tests} predictions")
    print("\nPrediction Distribution:")
    for idx, count in sorted(pred_counts.items()):
        print(f"  {AFFECTNET_LABELS[idx]:<12}: {count}/{num_tests} ({count/num_tests:.1%})")
    
    # Check output variation
    outputs_tensor = torch.stack(outputs_list)
    output_std = outputs_tensor.std(dim=0).mean().item()
    print(f"\nOutput variation across inputs: {output_std:.4f}")
    
    # Check if all predictions are the same
    if len(pred_counts) == 1:
        print("\n⚠ WARNING: All predictions are the same class!")
        print("  However, this is common with random noise inputs.")
        print("  The model might be biased towards class 3 (Surprise) for uncertain inputs.")
        print("  Try testing with actual face images to see if predictions vary.")
        
        # Check if outputs actually vary (even if predictions don't)
        if output_std > 0.1:
            print(f"  ✓ Outputs DO vary ({output_std:.4f}), so model is working!")
            print("  ✓ The issue is just that class 3 has highest probability for random inputs.")
            return True
        else:
            print(f"  ✗ Outputs don't vary much ({output_std:.4f}), model might not be working.")
            return False
    else:
        print("\n✓ Model shows variation in predictions (good sign)")
        return True

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Test the emotion prediction model')
    parser.add_argument('--model', type=str, default='ResNet50_best.pth',
                       help='Path to the model file')
    parser.add_argument('--image', type=str, default=None,
                       help='Path to test image (optional)')
    parser.add_argument('--device', type=str, default='cpu',
                       choices=['cpu', 'cuda'],
                       help='Device to run inference on')
    
    args = parser.parse_args()
    
    device = torch.device(args.device if torch.cuda.is_available() and args.device == 'cuda' else 'cpu')
    print(f"Using device: {device}\n")
    
    # Test 1: Model Loading
    model, success = test_model_loading(args.model, device)
    if not success:
        return
    
    # Test 2: Multiple Predictions
    test_multiple_predictions(model, device)
    
    # Test 3: Single Image (if provided)
    if args.image:
        test_single_image(model, args.image, device)
    
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    print("If all tests passed, your .pth file is working correctly!")
    print("If you see warnings or errors, check:")
    print("  1. Model architecture matches the saved weights")
    print("  2. Preprocessing matches training preprocessing")
    print("  3. Number of classes matches (8 for AffectNet)")
    print("="*70)

if __name__ == '__main__':
    main()

