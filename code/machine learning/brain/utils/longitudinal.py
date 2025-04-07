from datetime import datetime, timedelta
import numpy as np
from .metrics import calculate_tumor_growth_rate, calculate_treatment_response

def compare_with_history(patient_id, current_prediction):
    """
    Compare current scan with patient's historical data
    """
    # This would typically fetch data from a database
    # For now, we'll simulate historical data
    historical_data = simulate_historical_data(patient_id)
    
    if not historical_data:
        return None
    
    # Add current prediction to historical data
    current_data = {
        'date': datetime.now(),
        'volume': current_prediction['tumor_volume'],
        'type': current_prediction['tumor_type'],
        'grade': current_prediction['tumor_grade'],
        'confidence': current_prediction['tumor_probability']
    }
    historical_data.append(current_data)
    
    # Sort by date
    historical_data.sort(key=lambda x: x['date'])
    
    # Calculate growth metrics
    growth_metrics = calculate_tumor_growth_rate(historical_data)
    
    # Calculate changes from previous scan
    previous_scan = historical_data[-2] if len(historical_data) > 1 else None
    changes = calculate_changes(previous_scan, current_data) if previous_scan else None
    
    # Generate trend analysis
    trend_analysis = analyze_trends(historical_data)
    
    return {
        'growth_metrics': growth_metrics,
        'changes_from_previous': changes,
        'trend_analysis': trend_analysis,
        'historical_data': historical_data
    }

def calculate_changes(previous_scan, current_scan):
    """
    Calculate changes between two scans
    """
    if not previous_scan or not current_scan:
        return None
    
    volume_change = current_scan['volume'] - previous_scan['volume']
    volume_change_percent = (volume_change / previous_scan['volume']) * 100
    
    time_diff = (current_scan['date'] - previous_scan['date']).days
    
    return {
        'volume_change': float(volume_change),
        'volume_change_percent': float(volume_change_percent),
        'days_between_scans': int(time_diff),
        'type_change': current_scan['type'] != previous_scan['type'],
        'grade_change': current_scan['grade'] != previous_scan['grade'],
        'confidence_change': float(current_scan['confidence'] - previous_scan['confidence'])
    }

def analyze_trends(historical_data):
    """
    Analyze trends in the historical data
    """
    if len(historical_data) < 2:
        return None
    
    # Extract time series data
    dates = [d['date'] for d in historical_data]
    volumes = [d['volume'] for d in historical_data]
    confidences = [d['confidence'] for d in historical_data]
    
    # Calculate basic statistics
    volume_stats = {
        'mean': float(np.mean(volumes)),
        'std': float(np.std(volumes)),
        'min': float(np.min(volumes)),
        'max': float(np.max(volumes))
    }
    
    # Calculate trend direction
    volume_trend = 'increasing' if volumes[-1] > volumes[0] else 'decreasing' if volumes[-1] < volumes[0] else 'stable'
    
    # Calculate rate of change
    time_span = (dates[-1] - dates[0]).days
    total_volume_change = volumes[-1] - volumes[0]
    rate_of_change = total_volume_change / time_span if time_span > 0 else 0
    
    # Calculate stability metrics
    volume_variability = float(np.std(volumes) / np.mean(volumes)) if np.mean(volumes) > 0 else 0
    
    return {
        'volume_stats': volume_stats,
        'volume_trend': volume_trend,
        'rate_of_change': float(rate_of_change),
        'volume_variability': float(volume_variability),
        'confidence_trend': 'improving' if confidences[-1] > confidences[0] else 'decreasing' if confidences[-1] < confidences[0] else 'stable'
    }

def simulate_historical_data(patient_id):
    """
    Simulate historical data for testing
    """
    # Generate random dates within the last year
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365)
    
    # Generate 3-5 random scans
    num_scans = np.random.randint(3, 6)
    dates = sorted([start_date + timedelta(days=np.random.randint(0, 365)) for _ in range(num_scans)])
    
    # Generate random volumes with a trend
    base_volume = np.random.uniform(10, 30)
    volumes = [base_volume * (1 + 0.1 * i + np.random.normal(0, 0.1)) for i in range(num_scans)]
    
    # Generate random tumor types and grades
    tumor_types = ['glioma', 'meningioma', 'pituitary', 'normal']
    grades = ['I', 'II', 'III', 'IV']
    
    historical_data = []
    for i in range(num_scans):
        tumor_type = tumor_types[np.random.randint(0, len(tumor_types))]
        grade = grades[np.random.randint(0, len(grades))] if tumor_type == 'glioma' else None
        
        historical_data.append({
            'date': dates[i],
            'volume': float(volumes[i]),
            'type': tumor_type,
            'grade': grade,
            'confidence': float(np.random.uniform(0.7, 0.95))
        })
    
    return historical_data

def generate_treatment_recommendations(patient_data, historical_data):
    """
    Generate treatment recommendations based on historical data and current state
    """
    if not historical_data or len(historical_data) < 2:
        return None
    
    # Calculate growth rate
    growth_metrics = calculate_tumor_growth_rate(historical_data)
    
    # Get current tumor characteristics
    current_scan = historical_data[-1]
    
    # Initialize recommendations
    recommendations = {
        'urgency_level': 'routine',
        'next_scan_date': None,
        'treatment_options': [],
        'risk_factors': []
    }
    
    # Determine urgency level
    if growth_metrics['mean_growth_rate'] > 0.5:
        recommendations['urgency_level'] = 'urgent'
    elif growth_metrics['mean_growth_rate'] > 0.2:
        recommendations['urgency_level'] = 'moderate'
    
    # Calculate next scan date
    if growth_metrics['mean_growth_rate'] > 0:
        days_to_next_scan = int(30 / growth_metrics['mean_growth_rate'])
        recommendations['next_scan_date'] = current_scan['date'] + timedelta(days=min(days_to_next_scan, 90))
    else:
        recommendations['next_scan_date'] = current_scan['date'] + timedelta(days=90)
    
    # Add treatment options based on tumor type and grade
    if current_scan['type'] == 'glioma':
        if current_scan['grade'] in ['III', 'IV']:
            recommendations['treatment_options'].extend([
                'Surgery + Radiation + Chemotherapy',
                'Targeted therapy',
                'Clinical trial participation'
            ])
        else:
            recommendations['treatment_options'].extend([
                'Surgery',
                'Radiation therapy',
                'Watch and wait'
            ])
    elif current_scan['type'] == 'meningioma':
        recommendations['treatment_options'].extend([
            'Surgery',
            'Radiation therapy',
            'Watch and wait'
        ])
    
    # Add risk factors
    if growth_metrics['mean_growth_rate'] > 0.2:
        recommendations['risk_factors'].append('Rapid growth rate')
    if current_scan['volume'] > 50:
        recommendations['risk_factors'].append('Large tumor size')
    if current_scan['type'] == 'glioma' and current_scan['grade'] in ['III', 'IV']:
        recommendations['risk_factors'].append('High-grade glioma')
    
    return recommendations 