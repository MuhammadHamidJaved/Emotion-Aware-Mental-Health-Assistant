"""
Verify that all model weights are loading correctly, especially ResNet feature extractor.
"""

import torch
from model import load_model

def verify_model_loading(model_path='ResNet50_best.pth', device='cpu'):
    """Verify all model components are loading correctly."""
    print("="*70)
    print("VERIFYING MODEL WEIGHTS LOADING")
    print("="*70)
    
    # Load model
    model = load_model(model_path, num_classes=8, device=device)
    
    # Check feature extractor (ResNet layers)
    print("\n1. Checking Feature Extractor (ResNet layers):")
    feature_layers = [
        ('features.0', 'conv1'),
        ('features.1', 'bn1'),
        ('features.4', 'layer1'),
        ('features.5', 'layer2'),
        ('features.6', 'layer3'),
        ('features.7', 'layer4'),
    ]
    
    all_loaded = True
    for layer_name, description in feature_layers:
        try:
            layer = dict(model.named_modules())[layer_name]
            if hasattr(layer, 'weight'):
                weight = layer.weight.data
                if weight.abs().sum() < 1e-6:
                    print(f"   ✗ {layer_name} ({description}): weights are all zeros!")
                    all_loaded = False
                else:
                    print(f"   ✓ {layer_name} ({description}): weights loaded (mean={weight.mean().item():.4f})")
            else:
                print(f"   ? {layer_name} ({description}): no weight parameter (might be ReLU/MaxPool)")
        except KeyError:
            print(f"   ✗ {layer_name} ({description}): layer not found!")
            all_loaded = False
    
    # Check classifier
    print("\n2. Checking Classifier:")
    classifier_weight = model.classifier[-1].weight.data
    classifier_bias = model.classifier[-1].bias.data
    print(f"   ✓ Final layer weight: shape {classifier_weight.shape}, mean={classifier_weight.mean().item():.4f}")
    print(f"   ✓ Final layer bias: shape {classifier_bias.shape}, mean={classifier_bias.mean().item():.4f}")
    
    # Test with actual forward pass
    print("\n3. Testing Forward Pass:")
    model.eval()
    with torch.no_grad():
        # Test with random input
        dummy_input = torch.randn(1, 3, 224, 224).to(device)
        features = model.features(dummy_input)
        features_flat = features.view(features.size(0), -1)
        output = model.classifier(features_flat)
        
        print(f"   ✓ Input shape: {dummy_input.shape}")
        print(f"   ✓ Features shape: {features.shape}")
        print(f"   ✓ Features flattened: {features_flat.shape}")
        print(f"   ✓ Output shape: {output.shape}")
        print(f"   ✓ Features mean: {features.mean().item():.4f}")
        print(f"   ✓ Features std: {features.std().item():.4f}")
        
        # Check if features are all zeros (bad sign)
        if features.abs().sum() < 1e-6:
            print("\n   ⚠ WARNING: Features are all zeros!")
            print("   This means the feature extractor is not working.")
        elif features.std().item() < 0.01:
            print("\n   ⚠ WARNING: Features have very low variance!")
            print("   This might indicate the feature extractor is not working properly.")
        else:
            print("\n   ✓ Features look good (non-zero, good variance)")
    
    # Test multiple inputs to see variation
    print("\n4. Testing Feature Variation:")
    model.eval()
    feature_list = []
    with torch.no_grad():
        for i in range(5):
            dummy_input = torch.randn(1, 3, 224, 224).to(device)
            features = model.features(dummy_input)
            features_flat = features.view(features.size(0), -1)
            feature_list.append(features_flat[0, :10].cpu())  # First 10 features
        
        # Check if features vary between inputs
        feature_tensor = torch.stack(feature_list)
        feature_std = feature_tensor.std(dim=0).mean().item()
        print(f"   Feature variation across inputs: {feature_std:.6f}")
        
        if feature_std < 1e-6:
            print("   ⚠ WARNING: Features don't vary between inputs!")
            print("   This means all inputs produce the same features.")
        else:
            print("   ✓ Features vary between different inputs (good!)")
    
    print("\n" + "="*70)
    if all_loaded:
        print("✓ All critical weights appear to be loaded correctly!")
        print("\nNote: If model still always predicts class 3, it might be:")
        print("  - Model bias towards that class")
        print("  - Need to test with actual face images, not random noise")
        print("  - Class 3 (Surprise) might be the default for uncertain inputs")
    else:
        print("✗ Some weights are missing or zero!")
    print("="*70)
    
    return model

if __name__ == '__main__':
    verify_model_loading()

