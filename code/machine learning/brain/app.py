from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime
import json
import numpy as np
from dotenv import load_dotenv
from utils.image_processing import preprocess_image
from models.brain_tumor_classifier import BrainTumorClassifier

# Load environment variables
load_dotenv()

# Initialize the brain tumor classifier
classifier = BrainTumorClassifier()

app = Flask(__name__)
# Configure CORS to allow requests from your frontend
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Authentication middleware
def require_api_key(f):
    def decorated(*args, **kwargs):
        api_key = request.headers.get('Authorization')
        if api_key and api_key.startswith('Bearer '):
            api_key = api_key.split('Bearer ')[1]
            if api_key == os.getenv('ML_MODEL_API_KEY'):
                return f(*args, **kwargs)
        return jsonify({'error': 'Invalid API key'}), 401
    decorated.__name__ = f.__name__
    return decorated

@app.route('/')
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'brain-tumor-ml',
        'version': '1.0.0'
    })

@app.route('/api/brain/analyze', methods=['POST'])
@require_api_key
def analyze_brain():
    try:
        data = request.json
        image_url = data.get('image_url')
        scan_id = data.get('scan_id')
        patient_id = data.get('patient_id')

        # Check if we have model weights
        weights_path = os.path.join(os.path.dirname(__file__), 'models', 'weights', 'brain_tumor_model.h5')
        if not os.path.exists(weights_path):
            # If no weights, return mock results
            return jsonify({
                'scan_id': scan_id,
                'timestamp': datetime.now().isoformat(),
                'predictions': {
                    'tumor_present': True,
                    'tumor_type': 'glioma',
                    'tumor_grade': 'II',
                    'tumor_probability': 0.85,
                    'class_probabilities': {
                        'glioma': 0.85,
                        'meningioma': 0.10,
                        'pituitary': 0.05
                    }
                },
                'location': {
                    'bounding_box': [100, 100, 200, 200],
                    'heatmap': 'mock_heatmap_data',
                    'dimensions': [50, 50, 30],
                    'volume': 75000
                },
                'confidence_metrics': {
                    'model_confidence': 0.92,
                    'prediction_stability': 0.88
                },
                'longitudinal_analysis': None,
                'research_metrics': {
                    'image_quality_score': 0.95,
                    'segmentation_quality': 0.90
                },
                'metadata': {
                    'processing_time': 1.5,
                    'model_version': '1.0.0 (Mock Data)'
                }
            })

        # Process the image
        try:
            # Preprocess the image
            preprocessed_image = preprocess_image(image_url)

            # Make predictions
            prediction_results = classifier.predict(preprocessed_image)

            # Determine if tumor is present
            tumor_present = prediction_results['tumor_type'] != 'normal'

            # Prepare results
            results = {
                'scan_id': scan_id,
                'timestamp': datetime.now().isoformat(),
                'predictions': {
                    'tumor_present': tumor_present,
                    'tumor_type': prediction_results['tumor_type'] if tumor_present else None,
                    'tumor_grade': prediction_results['tumor_grade'] if tumor_present else None,
                    'tumor_probability': prediction_results['tumor_probability'],
                    'class_probabilities': prediction_results['class_probabilities']
                },
                'location': {
                    'bounding_box': [100, 100, 200, 200],  # Placeholder
                    'heatmap': 'heatmap_data',  # Placeholder
                    'dimensions': prediction_results['tumor_dimensions'],
                    'volume': prediction_results['tumor_volume']
                },
                'confidence_metrics': {
                    'model_confidence': prediction_results['tumor_probability'],
                    'prediction_stability': 0.88  # Placeholder
                },
                'longitudinal_analysis': None,  # Placeholder
                'research_metrics': {
                    'image_quality_score': prediction_results['image_quality_score'],
                    'segmentation_quality': 0.90  # Placeholder
                },
                'metadata': {
                    'processing_time': prediction_results['processing_time'],
                    'model_version': classifier.version
                }
            }
        except Exception as e:
            # If image processing fails, return mock results with error message
            return jsonify({
                'scan_id': scan_id,
                'timestamp': datetime.now().isoformat(),
                'predictions': {
                    'tumor_present': True,
                    'tumor_type': 'glioma',
                    'tumor_grade': 'II',
                    'tumor_probability': 0.85,
                    'class_probabilities': {
                        'glioma': 0.85,
                        'meningioma': 0.10,
                        'pituitary': 0.05
                    }
                },
                'location': {
                    'bounding_box': [100, 100, 200, 200],
                    'heatmap': 'mock_heatmap_data',
                    'dimensions': [50, 50, 30],
                    'volume': 75000
                },
                'confidence_metrics': {
                    'model_confidence': 0.92,
                    'prediction_stability': 0.88
                },
                'longitudinal_analysis': None,
                'research_metrics': {
                    'image_quality_score': 0.95,
                    'segmentation_quality': 0.90
                },
                'metadata': {
                    'processing_time': 1.5,
                    'model_version': '1.0.0 (Mock Data)',
                    'error': str(e)
                }
            })

        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)