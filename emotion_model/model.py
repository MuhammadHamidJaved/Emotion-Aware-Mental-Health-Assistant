import torch
import torch.nn as nn
import torchvision.models as models

class EmotionResNet50(nn.Module):
    """
    ResNet50-based emotion classifier.
    This model uses a pre-trained ResNet50 as a feature extractor
    and adds a custom classifier head for emotion prediction.
    """
    def __init__(self, num_classes=7):
        """
        Initialize the emotion classifier.
        
        Args:
            num_classes (int): Number of emotion classes. Default is 7 for:
                ['Angry', 'Disgust', 'Fear', 'Happy', 'Neutral', 'Sad', 'Surprise']
        """
        super(EmotionResNet50, self).__init__()
        
        # Load pre-trained ResNet50
        resnet = models.resnet50(weights=None)
        
        # Remove the final fully connected layer
        self.features = nn.Sequential(*list(resnet.children())[:-1])
        
        # Add custom classifier for emotion prediction
        self.classifier = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(resnet.fc.in_features, 512),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(512, num_classes)
        )
        
    def forward(self, x):
        x = self.features(x)
        x = x.view(x.size(0), -1)  # Flatten
        x = self.classifier(x)
        return x

def remap_state_dict(state_dict):
    """
    Remap state_dict keys from 'model.*' format to match our model structure.
    
    The saved model uses:
    - model.conv1, model.bn1, model.layer1-4, model.fc
    
    Our model uses:
    - features.0 (conv1), features.1 (bn1), features.4-7 (layers), classifier
    """
    new_state_dict = {}
    unmapped_keys = []
    
    # Mapping for ResNet50 structure when wrapped in Sequential
    # ResNet50 children: [conv1, bn1, relu, maxpool, layer1, layer2, layer3, layer4, avgpool]
    # So indices are: 0=conv1, 1=bn1, 2=relu, 3=maxpool, 4=layer1, 5=layer2, 6=layer3, 7=layer4, 8=avgpool
    
    for key, value in state_dict.items():
        new_key = key
        mapped = False
        
        # Remove 'model.' prefix if present
        if key.startswith('model.'):
            new_key = key[6:]  # Remove 'model.' prefix
        
        # Map ResNet layers to features Sequential indices
        if new_key == 'conv1' or new_key.startswith('conv1.'):
            # Remove 'conv1.' (6 chars including dot) to get suffix
            if new_key.startswith('conv1.'):
                suffix = new_key[6:]  # Remove 'conv1.' (6 chars)
            else:
                suffix = ''  # Just 'conv1' with no suffix
            new_key = 'features.0' + ('.' + suffix if suffix else '')
            mapped = True
        elif new_key == 'bn1' or new_key.startswith('bn1.'):
            # Remove 'bn1.' (4 chars including dot) to get suffix
            if new_key.startswith('bn1.'):
                suffix = new_key[4:]  # Remove 'bn1.' (4 chars)
            else:
                suffix = ''  # Just 'bn1' with no suffix
            new_key = 'features.1' + ('.' + suffix if suffix else '')
            mapped = True
        elif new_key.startswith('relu'):
            # relu doesn't have parameters, but handle it anyway
            suffix = new_key[4:] if len(new_key) > 4 else ''
            new_key = 'features.2' + ('.' + suffix if suffix else '')
            mapped = True
        elif new_key.startswith('maxpool'):
            # maxpool doesn't have parameters, but handle it anyway
            suffix = new_key[7:] if len(new_key) > 7 else ''
            new_key = 'features.3' + ('.' + suffix if suffix else '')
            mapped = True
        elif new_key.startswith('layer1.'):
            new_key = 'features.4.' + new_key[7:]
            mapped = True
        elif new_key.startswith('layer2.'):
            new_key = 'features.5.' + new_key[7:]
            mapped = True
        elif new_key.startswith('layer3.'):
            new_key = 'features.6.' + new_key[7:]
            mapped = True
        elif new_key.startswith('layer4.'):
            new_key = 'features.7.' + new_key[7:]
            mapped = True
        elif new_key.startswith('avgpool'):
            # avgpool doesn't have parameters, but handle it anyway
            suffix = new_key[7:] if len(new_key) > 7 else ''
            new_key = 'features.8' + ('.' + suffix if suffix else '')
            mapped = True
        elif new_key.startswith('fc.'):
            # Map fc to classifier
            # fc.1 -> classifier.1, fc.4 -> classifier.4
            new_key = 'classifier.' + new_key[3:]
            mapped = True
        
        if not mapped and key != new_key:
            # Key was modified but not explicitly mapped - might be an issue
            unmapped_keys.append((key, new_key))
        
        new_state_dict[new_key] = value
    
    if unmapped_keys:
        print(f"⚠ Warning: {len(unmapped_keys)} keys were modified but not explicitly mapped")
        print(f"   Examples: {unmapped_keys[:3]}")
    
    return new_state_dict

def load_model(model_path, num_classes=7, device='cpu'):
    """
    Load the trained emotion prediction model.
    
    Args:
        model_path (str): Path to the .pth model file
        num_classes (int): Number of emotion classes (will be auto-detected from checkpoint if available)
        device (str): Device to load the model on ('cpu' or 'cuda')
    
    Returns:
        model: Loaded PyTorch model in evaluation mode
    """
    checkpoint = torch.load(model_path, map_location=device)
    
    # Store original state_dict for auto-detection before remapping
    original_state_dict = None
    
    # Check if it's a checkpoint dictionary or direct state_dict
    if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
        # Extract model state dict from checkpoint
        state_dict = checkpoint['model_state_dict']
        original_state_dict = state_dict.copy()  # Keep original for auto-detection
        
        # Try to get num_classes from config if available
        if 'config' in checkpoint and hasattr(checkpoint['config'], 'num_classes'):
            num_classes = checkpoint['config'].num_classes
        elif 'config' in checkpoint and isinstance(checkpoint['config'], dict) and 'num_classes' in checkpoint['config']:
            num_classes = checkpoint['config']['num_classes']
        
        # Print checkpoint info if available
        if 'best_val_acc' in checkpoint:
            print(f"Loaded checkpoint from epoch {checkpoint.get('epoch', 'unknown')}")
            print(f"Best validation accuracy: {checkpoint.get('best_val_acc', 'unknown'):.2%}")
    else:
        # Direct state_dict
        state_dict = checkpoint
        original_state_dict = state_dict.copy() if isinstance(state_dict, dict) else None
    
    # Auto-detect num_classes from state_dict if not already set
    # Check original keys first (before remapping)
    detected_classes = None
    if num_classes == 7:  # Only auto-detect if using default
        if original_state_dict:
            for key in ['model.fc.4.weight', 'model.fc.4.bias', 'fc.4.weight', 'fc.4.bias', 'classifier.4.weight', 'classifier.4.bias']:
                if key in original_state_dict:
                    detected_classes = original_state_dict[key].shape[0]
                    break
        
        if detected_classes is not None and detected_classes != num_classes:
            print(f"Auto-detected {detected_classes} classes from checkpoint (was using default {num_classes})")
            num_classes = detected_classes
    
    # Remap state_dict keys if needed (check if keys start with 'model.')
    needs_remap = state_dict and any(key.startswith('model.') for key in state_dict.keys())
    if needs_remap:
        print("Remapping state_dict keys to match model structure...")
        state_dict = remap_state_dict(state_dict)
        
        # After remapping, check again for num_classes if still not detected
        if detected_classes is None:
            for key in ['classifier.4.weight', 'classifier.4.bias']:
                if key in state_dict:
                    detected_classes = state_dict[key].shape[0]
                    if detected_classes != num_classes:
                        print(f"Auto-detected {detected_classes} classes from checkpoint (was using default {num_classes})")
                        num_classes = detected_classes
                    break
    
    # Create model and load weights
    model = EmotionResNet50(num_classes=num_classes)
    
    # Try to load with strict=False first, then check for missing keys
    missing_keys, unexpected_keys = model.load_state_dict(state_dict, strict=False)
    
    if missing_keys:
        print(f"\n⚠ Warning: {len(missing_keys)} keys were missing:")
        print(f"   First 5 missing keys: {missing_keys[:5]}")
        if len(missing_keys) > 5:
            print(f"   ... and {len(missing_keys) - 5} more")
    
    if unexpected_keys:
        print(f"\n⚠ Warning: {len(unexpected_keys)} unexpected keys:")
        print(f"   First 5 unexpected keys: {unexpected_keys[:5]}")
        if len(unexpected_keys) > 5:
            print(f"   ... and {len(unexpected_keys) - 5} more")
    
    # Verify critical weights were loaded
    classifier_weight = model.classifier[-1].weight.data
    if classifier_weight.abs().sum() < 1e-6:
        print("\n⚠ WARNING: Classifier weights appear to be all zeros!")
        print("   This suggests the weights were not loaded correctly.")
    else:
        print(f"\n✓ Classifier weights loaded successfully")
        print(f"   Weight stats: mean={classifier_weight.mean().item():.4f}, std={classifier_weight.std().item():.4f}")
    
    model.to(device)
    model.eval()
    return model

