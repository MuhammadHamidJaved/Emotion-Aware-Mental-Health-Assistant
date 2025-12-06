# Setup Instructions

## Step 1: Copy Model File

Copy your trained model file to this directory:

```bash
# From the parent directory
copy ResNet50_best.pth emotion_model\

# Or manually copy ResNet50_best.pth to the emotion_model folder
```

The model file should be named `ResNet50_best.pth` and placed in the `emotion_model` folder.

## Step 2: Install Dependencies

```bash
cd emotion_model
pip install -r requirements.txt
```

Or install individually:
```bash
pip install torch torchvision Pillow opencv-python numpy matplotlib seaborn scikit-learn
```

## Step 3: Verify Installation

Run the test script to verify everything is working:

```bash
python test_model.py
```

You should see:
- ✓ Model loaded successfully
- ✓ Model has 8 output classes
- ✓ Model forward pass successful

## Step 4: Test with an Image

```bash
python predict.py --image path/to/test_image.jpg
```

## Project Structure

After setup, your folder should look like:

```
emotion_model/
├── README.md                 # Main documentation
├── QUICK_START.md            # Quick start guide
├── SETUP.md                  # This file
├── requirements.txt          # Dependencies
├── .gitignore               # Git ignore file
├── model.py                 # Model definition
├── predict.py               # Prediction script
├── emotion_detector.py      # Standalone detector class
├── test_model.py            # Model testing
├── verify_model.py          # Model verification
├── confusion_matrix.py      # Confusion matrix generation
└── ResNet50_best.pth        # Your model file (copy this)
```

## Next Steps

1. ✅ Copy `ResNet50_best.pth` to this folder
2. ✅ Install dependencies
3. ✅ Run `python test_model.py` to verify
4. ✅ Try `python predict.py --webcam` for real-time prediction
5. ✅ See `QUICK_START.md` for usage examples

## Troubleshooting

### "Model file not found"
- Make sure `ResNet50_best.pth` is in the `emotion_model` folder
- Check the file name is exactly `ResNet50_best.pth`

### Import errors
- Make sure all dependencies are installed: `pip install -r requirements.txt`
- Make sure you're running scripts from the `emotion_model` directory

### GPU issues
- For CPU: Use `--device cpu` (default)
- For GPU: Install CUDA PyTorch and use `--device cuda`

