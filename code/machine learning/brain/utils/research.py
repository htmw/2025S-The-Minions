import numpy as np
from datetime import datetime
import json
import os

def generate_research_metrics(predictions, image):
    """
    Generate research metrics for the current prediction
    """
    # Calculate feature importance
    feature_importance = calculate_feature_importance(image)
    
    # Generate model interpretability metrics
    interpretability = generate_interpretability_metrics(predictions, image)
    
    # Calculate statistical metrics
    statistics = calculate_statistical_metrics(predictions, image)
    
    return {
        'feature_importance': feature_importance,
        'interpretability': interpretability,
        'statistics': statistics,
        'timestamp': datetime.now().isoformat()
    }

def calculate_feature_importance(image):
    """
    Calculate importance of different image features
    """
    # This would typically use techniques like Grad-CAM or SHAP
    # For now, we'll simulate feature importance
    features = {
        'texture': float(np.random.uniform(0.6, 0.9)),
        'intensity': float(np.random.uniform(0.5, 0.8)),
        'shape': float(np.random.uniform(0.4, 0.7)),
        'edge_features': float(np.random.uniform(0.3, 0.6)),
        'regional_features': float(np.random.uniform(0.5, 0.8))
    }
    
    # Normalize to sum to 1
    total = sum(features.values())
    features = {k: v/total for k, v in features.items()}
    
    return features

def generate_interpretability_metrics(predictions, image):
    """
    Generate metrics for model interpretability
    """
    # Calculate prediction confidence
    confidence = predictions['tumor_probability']
    
    # Calculate class probabilities
    class_probs = predictions['class_probabilities']
    
    # Calculate entropy of predictions
    probs = np.array(list(class_probs.values()))
    entropy = -np.sum(probs * np.log2(probs + 1e-10))
    
    # Generate attention map (simulated)
    attention_map = {
        'top_left': float(np.random.uniform(0.1, 0.3)),
        'top_right': float(np.random.uniform(0.1, 0.3)),
        'bottom_left': float(np.random.uniform(0.1, 0.3)),
        'bottom_right': float(np.random.uniform(0.1, 0.3))
    }
    
    return {
        'confidence': float(confidence),
        'entropy': float(entropy),
        'attention_map': attention_map,
        'class_probabilities': class_probs
    }

def calculate_statistical_metrics(predictions, image):
    """
    Calculate statistical metrics for research purposes
    """
    # Calculate image statistics
    image_stats = {
        'mean_intensity': float(np.mean(image)),
        'std_intensity': float(np.std(image)),
        'min_intensity': float(np.min(image)),
        'max_intensity': float(np.max(image)),
        'histogram': np.histogram(image, bins=10)[0].tolist()
    }
    
    # Calculate prediction statistics
    prediction_stats = {
        'tumor_probability': float(predictions['tumor_probability']),
        'class_distribution': predictions['class_probabilities'],
        'confidence_score': float(np.max(list(predictions['class_probabilities'].values())))
    }
    
    return {
        'image_statistics': image_stats,
        'prediction_statistics': prediction_stats
    }

def generate_research_report(predictions, image, patient_data=None):
    """
    Generate a comprehensive research report
    """
    # Get basic metrics
    metrics = generate_research_metrics(predictions, image)
    
    # Add patient demographics if available
    if patient_data:
        demographics = {
            'age': patient_data.get('age'),
            'gender': patient_data.get('gender'),
            'ethnicity': patient_data.get('ethnicity'),
            'medical_history': patient_data.get('medical_history', [])
        }
    else:
        demographics = None
    
    # Generate report
    report = {
        'timestamp': datetime.now().isoformat(),
        'metrics': metrics,
        'demographics': demographics,
        'model_version': '1.0.0',
        'analysis_parameters': {
            'image_size': image.shape,
            'preprocessing_steps': ['normalization', 'resizing'],
            'model_confidence_threshold': 0.5
        }
    }
    
    return report

def export_research_data(report, format='json'):
    """
    Export research data in specified format
    """
    if format == 'json':
        return json.dumps(report, indent=2)
    elif format == 'csv':
        # Convert to CSV format
        # This would need to be implemented based on specific requirements
        pass
    else:
        raise ValueError(f"Unsupported format: {format}")

def save_research_data(report, output_dir):
    """
    Save research data to file
    """
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate filename with timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'research_report_{timestamp}.json'
    
    # Save to file
    filepath = os.path.join(output_dir, filename)
    with open(filepath, 'w') as f:
        json.dump(report, f, indent=2)
    
    return filepath

def generate_comparison_report(reports):
    """
    Generate a comparison report from multiple research reports
    """
    if not reports:
        return None
    
    # Extract metrics from all reports
    metrics = [report['metrics'] for report in reports]
    
    # Calculate aggregate statistics
    aggregate_stats = {
        'mean_confidence': np.mean([m['interpretability']['confidence'] for m in metrics]),
        'std_confidence': np.std([m['interpretability']['confidence'] for m in metrics]),
        'mean_entropy': np.mean([m['interpretability']['entropy'] for m in metrics]),
        'std_entropy': np.std([m['interpretability']['entropy'] for m in metrics])
    }
    
    # Generate comparison report
    comparison = {
        'timestamp': datetime.now().isoformat(),
        'num_reports': len(reports),
        'aggregate_statistics': aggregate_stats,
        'individual_reports': reports
    }
    
    return comparison 