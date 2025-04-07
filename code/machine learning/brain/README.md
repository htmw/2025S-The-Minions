# Brain Tumor Analysis ML Service

This service provides advanced brain tumor analysis capabilities using machine learning. It includes features for tumor classification, segmentation, and longitudinal analysis.

## Features

- Multi-class tumor classification (meningioma, glioma, pituitary, normal)
- Tumor grading (for gliomas)
- Region of Interest identification with bounding boxes
- Heatmap generation for suspicious areas
- Tumor dimension and volume estimation
- Confidence metrics and uncertainty analysis
- Longitudinal analysis for tracking tumor changes
- Research-specific features for model analysis

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
Create a `.env` file with:
```
ML_MODEL_API_KEY=your_api_key_here
MODEL_WEIGHTS_PATH=path/to/weights/brain_tumor_model.h5
```

4. Download pre-trained model weights:
Place the model weights file in the `models/weights` directory.

## Running the Service

1. Start the Flask server:
```bash
python app.py
```

The service will be available at `http://localhost:5000`.

## API Endpoints

### Brain Tumor Analysis
- `POST /api/brain/analyze`
  - Input: Image URL and scan ID
  - Output: Tumor classification, location, and analysis results

### Research Metrics
- `GET /api/brain/research/metrics`
  - Output: Model performance metrics and statistics

### Model Information
- `GET /api/brain/model/info`
  - Output: Model version and configuration details

## Response Format

Example response from `/api/brain/analyze`:
```json
{
  "scan_id": "123",
  "timestamp": "2024-03-06T12:00:00Z",
  "predictions": {
    "tumor_present": true,
    "tumor_type": "glioma",
    "tumor_grade": "III",
    "tumor_probability": 0.95,
    "class_probabilities": {
      "meningioma": 0.1,
      "glioma": 0.95,
      "pituitary": 0.05,
      "normal": 0.0
    }
  },
  "location": {
    "bounding_box": {...},
    "heatmap": "base64_encoded_image",
    "dimensions": {
      "width": 2.5,
      "height": 3.0,
      "depth": 2.0
    },
    "volume": 15.0
  },
  "confidence_metrics": {
    "entropy": 0.2,
    "max_probability": 0.95,
    "probability_margin": 0.85,
    "uncertainty_score": 0.05,
    "needs_human_review": false
  }
}
```

## Model Architecture

The model uses a CNN architecture with:
- Input size: 224x224x3
- 4 convolutional blocks with batch normalization
- Dropout for regularization
- Softmax output for multi-class classification

## Research Features

The service includes tools for:
- Feature importance analysis
- Model interpretability metrics
- Statistical analysis of predictions
- Research report generation
- Comparison of multiple analyses

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 