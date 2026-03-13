# ml_model_torchscript.py
import os
import io
from PIL import Image
import torch
import torchvision.transforms as transforms

# CONFIG
MODEL_PATH = 'efficientnet_scripted.pt'
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
IMG_SIZE = 224
CLASS_NAMES = os.environ.get("ML_CLASS_NAMES", "healthy,unhealthy").split(",")  # index 0 -> healthy

# Preprocessing - must match training
_preprocess = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

# Lazy-loaded model singleton
_model = None

def load_model(path: str = None):
    global _model
    if _model is not None:
        return _model
    model_path = path or MODEL_PATH
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"TorchScript model not found at {model_path}")
    # TorchScript load (works on CPU)
    _model = torch.jit.load(model_path, map_location=DEVICE)
    _model.eval()
    return _model

def _predict_tensor(tensor):
    """
    tensor: torch.Tensor 1xC x H x W on CPU or DEVICE
    returns dict with label/confidence/scores
    """
    model = load_model()
    tensor = tensor.to(DEVICE)
    with torch.no_grad():
        logits = model(tensor)             # expects shape (B,1) or (B,) depending
        # normalize logits shape
        if logits.dim() == 2 and logits.size(1) == 1:
            probs = torch.sigmoid(logits).squeeze(1)
        else:
            # handle both (B,) or (B,1)
            probs = torch.sigmoid(logits).view(-1)
        prob = float(probs.item()) if probs.numel() == 1 else [float(x) for x in probs.tolist()]
    # For binary we return unhealthy prob (class 1) and both scores
    if isinstance(prob, list):
        # batch - return first element summary
        p = prob[0]
    else:
        p = prob
    scores = {
        CLASS_NAMES[0]: float(1.0 - p),
        CLASS_NAMES[1]: float(p)
    }
    predicted_index = 1 if p >= 0.5 else 0
    return {
        "label": CLASS_NAMES[predicted_index],
        "confidence": float(p if predicted_index == 1 else 1.0 - p),
        "scores": scores,
        "raw_prob_unhealthy": float(p)
    }

def predict_bytes(img_bytes: bytes):
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    tensor = _preprocess(img).unsqueeze(0)  # 1 x C x H x W
    return _predict_tensor(tensor)

def predict_file(path: str):
    with open(path, "rb") as f:
        return predict_bytes(f.read())
