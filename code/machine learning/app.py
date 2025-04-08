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
app = Flask(__name__)

@app.route("/")
def index():
    return "<h1>Medical Image Classification Deployment</h1><p>Use the /predict endpoint to POST an image with parameter model_type (chest, brain, scan_type).</p>"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
