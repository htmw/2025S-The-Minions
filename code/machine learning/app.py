import os
import io
import json
import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
from flask import Flask, request, jsonify

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def get_inference_transform(model_type):
    if model_type == "chest":
        return transforms.Compose([transforms.Resize((224,224)), transforms.ToTensor(), transforms.Normalize([0.485,0.456,0.406], [0.229,0.224,0.225])])
    elif model_type == "brain":
        return transforms.Compose([transforms.Resize((224,224)), transforms.ToTensor(), transforms.Normalize([0.485,0.456,0.406], [0.229,0.224,0.225])])
    elif model_type == "scan_type":
        return transforms.Compose([transforms.Resize((224,224)), transforms.ToTensor(), transforms.Normalize([0.485,0.456,0.406], [0.229,0.224,0.225])])
    else:
        raise ValueError("Unknown model type")

def get_model_architecture(model_type, num_classes):
    if model_type in ["chest", "brain", "scan_type"]:
        model = models.densenet121(weights=models.DenseNet121_Weights.DEFAULT)
        num_features = model.classifier.in_features
        model.classifier = nn.Sequential(nn.Dropout(0.3), nn.Linear(num_features, num_classes))
        return model
    else:
        raise ValueError("Unknown model type")

def load_model(model_type, checkpoints_dir="model_checkpoints"):
    info_path = os.path.join(checkpoints_dir, f"{model_type}_model_info.json")
    ckpt_path = os.path.join(checkpoints_dir, f"best_{model_type}_model.pth")
    if not os.path.exists(info_path) or not os.path.exists(ckpt_path):
        raise FileNotFoundError(f"Model info or checkpoint for {model_type} not found")
    with open(info_path, "r") as f:
        model_info = json.load(f)
    num_classes = model_info['num_classes']
    class_to_idx = model_info['class_to_idx']
    model = get_model_architecture(model_type, num_classes)
    checkpoint = torch.load(ckpt_path, map_location=device)
    model.load_state_dict(checkpoint['model_state_dict'])
    model.to(device)
    model.eval()
    idx_to_class = {v: k for k, v in class_to_idx.items()}
    return model, class_to_idx, idx_to_class

loaded_models = {}
MODEL_TYPES = ["chest", "brain", "scan_type"]
CHECKPOINTS_DIR = "model_checkpoints"
for m_type in MODEL_TYPES:
    try:
        model, class_to_idx, idx_to_class = load_model(m_type, checkpoints_dir=CHECKPOINTS_DIR)
        loaded_models[m_type] = {"model": model, "class_to_idx": class_to_idx, "idx_to_class": idx_to_class, "transform": get_inference_transform(m_type)}
    except Exception as e:
        print(f"Failed to load model {m_type}: {e}")

app = Flask(__name__)

@app.route("/")
def index():
    return "<h1>Medical Image Classification Deployment</h1><p>Use the /predict endpoint.</p>"

@app.route("/predict", methods=["POST"])
def predict():
    model_type = request.args.get("model_type")
    if model_type not in loaded_models:
        return jsonify({"error": "Invalid or missing model_type. Provide one of: chest, brain, scan_type"}), 400
    if "image" not in request.files:
        return jsonify({"error": "No image file provided. Use key 'image'."}), 400
    image_file = request.files["image"]
    try:
        image_bytes = image_file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        return jsonify({"error": f"Could not read image file: {e}"}), 400
    transform = loaded_models[model_type]["transform"]
    input_tensor = transform(image).unsqueeze(0).to(device)
    model = loaded_models[model_type]["model"]
    with torch.no_grad():
        outputs = model(input_tensor)
        _, pred_idx = torch.max(outputs, 1)
        pred_idx = pred_idx.item()
    idx_to_class = loaded_models[model_type]["idx_to_class"]
    pred_class = idx_to_class.get(pred_idx, "Unknown")
    response = {"model_type": model_type, "predicted_class": pred_class, "prediction_index": pred_idx}
    return jsonify(response)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
