import torch
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from PIL import Image
import torchvision.transforms as transforms
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, classification_report, accuracy_score
import argparse
import os
from pathlib import Path
from model import load_model

# Default emotion classes (FER2013 standard - 7 classes)
EMOTION_LABELS_7 = ['Angry', 'Disgust', 'Fear', 'Happy', 'Neutral', 'Sad', 'Surprise']
# AffectNet emotion classes (8 classes) - correct order
AFFECTNET_LABELS = ['Neutral', 'Happy', 'Sad', 'Surprise', 'Fear', 'Disgust', 'Anger', 'Contempt']

class EmotionDataset(Dataset):
    """Dataset class for emotion images."""
    def __init__(self, image_paths, labels, transform=None):
        self.image_paths = image_paths
        self.labels = labels
        self.transform = transform
    
    def __len__(self):
        return len(self.image_paths)
    
    def __getitem__(self, idx):
        image_path = self.image_paths[idx]
        label = self.labels[idx]
        
        # Load image
        image = Image.open(image_path).convert('RGB')
        
        if self.transform:
            image = self.transform(image)
        
        return image, label

def load_data_from_directory(data_dir):
    """
    Load images from directory structure where each subdirectory is an emotion class.
    Expected structure:
    data_dir/
        Angry/
            img1.jpg
            img2.jpg
        Disgust/
            img1.jpg
        ...
    """
    image_paths = []
    labels = []
    
    # Get all subdirectories (emotion classes)
    emotion_dirs = [d for d in os.listdir(data_dir) if os.path.isdir(os.path.join(data_dir, d))]
    
    for emotion_dir in emotion_dirs:
        emotion_path = os.path.join(data_dir, emotion_dir)
        
        # Get emotion label index (check both AffectNet and FER2013 labels)
        if emotion_dir in AFFECTNET_LABELS:
            label = AFFECTNET_LABELS.index(emotion_dir)
        elif emotion_dir in EMOTION_LABELS_7:
            label = EMOTION_LABELS_7.index(emotion_dir)
        else:
            print(f"Warning: Unknown emotion class '{emotion_dir}', skipping...")
            continue
        
        # Get all images in this directory
        image_extensions = ['.jpg', '.jpeg', '.png', '.bmp']
        for img_file in os.listdir(emotion_path):
            if any(img_file.lower().endswith(ext) for ext in image_extensions):
                image_paths.append(os.path.join(emotion_path, img_file))
                labels.append(label)
    
    return image_paths, labels

def load_data_from_csv(csv_path):
    """
    Load images from CSV file.
    Expected format: image_path,label (or emotion_name)
    """
    import csv
    image_paths = []
    labels = []
    
    with open(csv_path, 'r') as f:
        reader = csv.reader(f)
        next(reader)  # Skip header if present
        
        for row in reader:
            if len(row) < 2:
                continue
            
            img_path = row[0].strip()
            label_str = row[1].strip()
            
            # Convert label to index (check both AffectNet and FER2013 labels)
            if label_str.isdigit():
                label = int(label_str)
            elif label_str in AFFECTNET_LABELS:
                label = AFFECTNET_LABELS.index(label_str)
            elif label_str in EMOTION_LABELS_7:
                label = EMOTION_LABELS_7.index(label_str)
            else:
                continue
            
            if os.path.exists(img_path):
                image_paths.append(img_path)
                labels.append(label)
    
    return image_paths, labels

def predict_batch(model, dataloader, device):
    """Make predictions on a batch of images."""
    all_preds = []
    all_labels = []
    
    model.eval()
    with torch.no_grad():
        for images, labels in dataloader:
            images = images.to(device)
            labels = labels.to(device)
            
            outputs = model(images)
            _, preds = torch.max(outputs, 1)
            
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
    
    return np.array(all_preds), np.array(all_labels)

def plot_confusion_matrix(y_true, y_pred, emotion_labels, save_path=None):
    """Plot and display confusion matrix."""
    cm = confusion_matrix(y_true, y_pred)
    
    # Calculate accuracy
    accuracy = accuracy_score(y_true, y_pred)
    
    # Create figure
    plt.figure(figsize=(10, 8))
    
    # Normalize confusion matrix
    cm_normalized = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]
    
    # Create heatmap
    sns.heatmap(cm_normalized, annot=True, fmt='.2f', cmap='Blues',
                xticklabels=emotion_labels, yticklabels=emotion_labels,
                cbar_kws={'label': 'Normalized Count'})
    
    plt.title(f'Confusion Matrix (Accuracy: {accuracy:.2%})', fontsize=16, fontweight='bold')
    plt.ylabel('True Label', fontsize=12)
    plt.xlabel('Predicted Label', fontsize=12)
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"Confusion matrix saved to {save_path}")
    
    plt.show()
    
    # Print detailed confusion matrix
    print("\n" + "="*70)
    print("CONFUSION MATRIX (Counts)")
    print("="*70)
    print(f"{'':<12}", end="")
    for label in emotion_labels:
        print(f"{label:<12}", end="")
    print()
    
    for i, label in enumerate(emotion_labels):
        print(f"{label:<12}", end="")
        for j in range(len(emotion_labels)):
            print(f"{cm[i, j]:<12}", end="")
        print()
    
    # Print normalized confusion matrix
    print("\n" + "="*70)
    print("CONFUSION MATRIX (Normalized)")
    print("="*70)
    print(f"{'':<12}", end="")
    for label in emotion_labels:
        print(f"{label:<12}", end="")
    print()
    
    for i, label in enumerate(emotion_labels):
        print(f"{label:<12}", end="")
        for j in range(len(emotion_labels)):
            print(f"{cm_normalized[i, j]:<12.2f}", end="")
        print()
    
    return cm, cm_normalized

def main():
    parser = argparse.ArgumentParser(description='Generate confusion matrix for emotion prediction model')
    parser.add_argument('--model', type=str, default='ResNet50_best.pth',
                       help='Path to the model file')
    parser.add_argument('--data_dir', type=str, default=None,
                       help='Path to test data directory (with emotion subdirectories)')
    parser.add_argument('--csv', type=str, default=None,
                       help='Path to CSV file with image paths and labels')
    parser.add_argument('--device', type=str, default='cpu',
                       choices=['cpu', 'cuda'],
                       help='Device to run inference on')
    parser.add_argument('--batch_size', type=int, default=32,
                       help='Batch size for inference')
    parser.add_argument('--num_classes', type=int, default=7,
                       help='Number of emotion classes')
    parser.add_argument('--save_path', type=str, default='confusion_matrix.png',
                       help='Path to save confusion matrix image')
    
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
    
    # Load test data
    if args.csv:
        print(f"Loading data from CSV: {args.csv}")
        image_paths, labels = load_data_from_csv(args.csv)
    elif args.data_dir:
        print(f"Loading data from directory: {args.data_dir}")
        image_paths, labels = load_data_from_directory(args.data_dir)
    else:
        print("Error: Please provide either --data_dir or --csv")
        parser.print_help()
        return
    
    if len(image_paths) == 0:
        print("Error: No images found!")
        return
    
    print(f"Found {len(image_paths)} images")
    
    # Create transforms (same as training)
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                           std=[0.229, 0.224, 0.225])
    ])
    
    # Create dataset and dataloader
    dataset = EmotionDataset(image_paths, labels, transform=transform)
    dataloader = DataLoader(dataset, batch_size=args.batch_size, shuffle=False, num_workers=0)
    
    # Make predictions
    print("Making predictions...")
    y_pred, y_true = predict_batch(model, dataloader, device)
    
    # Get emotion labels based on detected number of classes
    # The model will auto-detect num_classes, so we need to get it from the model
    actual_num_classes = model.classifier[-1].out_features
    if actual_num_classes == 8:
        emotion_labels = AFFECTNET_LABELS  # Use AffectNet labels for 8 classes
    else:
        emotion_labels = EMOTION_LABELS_7[:actual_num_classes] if actual_num_classes <= len(EMOTION_LABELS_7) else EMOTION_LABELS_7
    
    print(f"Using {actual_num_classes} emotion classes: {emotion_labels}")
    
    # Generate confusion matrix
    print("\nGenerating confusion matrix...")
    cm, cm_normalized = plot_confusion_matrix(y_true, y_pred, emotion_labels, args.save_path)
    
    # Print classification report
    print("\n" + "="*70)
    print("CLASSIFICATION REPORT")
    print("="*70)
    print(classification_report(y_true, y_pred, target_names=emotion_labels, digits=4))
    
    # Calculate per-class accuracy
    print("\n" + "="*70)
    print("PER-CLASS ACCURACY")
    print("="*70)
    for i, label in enumerate(emotion_labels):
        class_mask = y_true == i
        if class_mask.sum() > 0:
            class_acc = (y_pred[class_mask] == y_true[class_mask]).mean()
            print(f"{label:<15}: {class_acc:.2%} ({class_mask.sum()} samples)")

if __name__ == '__main__':
    main()

