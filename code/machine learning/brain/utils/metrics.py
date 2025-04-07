import numpy as np
from scipy import stats

def calculate_confidence_metrics(predictions):
    """
    Calculate confidence metrics for the predictions
    """
    # Get class probabilities
    probs = predictions['class_probabilities']
    values = np.array(list(probs.values()))
    
    # Calculate entropy
    entropy = -np.sum(values * np.log2(values + 1e-10))
    
    # Calculate maximum probability
    max_prob = np.max(values)
    
    # Calculate probability margin
    sorted_probs = np.sort(values)[::-1]
    margin = sorted_probs[0] - sorted_probs[1] if len(sorted_probs) > 1 else 1.0
    
    # Calculate uncertainty score
    uncertainty = 1 - max_prob
    
    # Determine if human review is needed
    needs_review = (
        max_prob < 0.8 or  # Low confidence
        entropy > 1.0 or   # High uncertainty
        margin < 0.2       # Close probabilities
    )
    
    return {
        'entropy': float(entropy),
        'max_probability': float(max_prob),
        'probability_margin': float(margin),
        'uncertainty_score': float(uncertainty),
        'needs_human_review': bool(needs_review)
    }

def calculate_tumor_growth_rate(historical_data):
    """
    Calculate tumor growth rate from historical data
    """
    if len(historical_data) < 2:
        return None
    
    # Extract dates and volumes
    dates = [d['date'] for d in historical_data]
    volumes = [d['volume'] for d in historical_data]
    
    # Calculate time differences in days
    time_diffs = np.diff([(d - dates[0]).days for d in dates])
    
    # Calculate volume differences
    volume_diffs = np.diff(volumes)
    
    # Calculate growth rates
    growth_rates = volume_diffs / time_diffs
    
    # Calculate statistics
    mean_growth_rate = np.mean(growth_rates)
    std_growth_rate = np.std(growth_rates)
    
    # Calculate doubling time
    if mean_growth_rate > 0:
        doubling_time = np.log(2) / mean_growth_rate
    else:
        doubling_time = None
    
    return {
        'mean_growth_rate': float(mean_growth_rate),
        'std_growth_rate': float(std_growth_rate),
        'doubling_time': float(doubling_time) if doubling_time else None,
        'growth_trend': 'increasing' if mean_growth_rate > 0 else 'decreasing' if mean_growth_rate < 0 else 'stable'
    }

def calculate_treatment_response(historical_data, treatment_dates):
    """
    Calculate treatment response metrics
    """
    if not treatment_dates or len(historical_data) < 2:
        return None
    
    # Group data by treatment periods
    treatment_periods = []
    current_period = []
    
    for data in historical_data:
        current_period.append(data)
        if data['date'] in treatment_dates:
            if current_period:
                treatment_periods.append(current_period)
            current_period = []
    
    if current_period:
        treatment_periods.append(current_period)
    
    # Calculate response metrics for each period
    responses = []
    for period in treatment_periods:
        if len(period) < 2:
            continue
            
        initial_volume = period[0]['volume']
        final_volume = period[-1]['volume']
        time_span = (period[-1]['date'] - period[0]['date']).days
        
        response = {
            'initial_volume': float(initial_volume),
            'final_volume': float(final_volume),
            'volume_change': float(final_volume - initial_volume),
            'percent_change': float((final_volume - initial_volume) / initial_volume * 100),
            'time_span': int(time_span),
            'response_rate': float((final_volume - initial_volume) / time_span)
        }
        
        responses.append(response)
    
    return responses

def calculate_survival_metrics(patient_data):
    """
    Calculate survival metrics based on tumor characteristics
    """
    # Extract relevant features
    tumor_type = patient_data.get('tumor_type')
    tumor_grade = patient_data.get('tumor_grade')
    tumor_volume = patient_data.get('tumor_volume')
    
    # Initialize risk score
    risk_score = 0
    
    # Add risk based on tumor type
    type_risk = {
        'glioma': 0.8,
        'meningioma': 0.4,
        'pituitary': 0.3,
        'normal': 0.0
    }
    risk_score += type_risk.get(tumor_type, 0.5)
    
    # Add risk based on tumor grade
    if tumor_grade:
        grade_risk = {
            'I': 0.2,
            'II': 0.4,
            'III': 0.6,
            'IV': 0.8
        }
        risk_score += grade_risk.get(tumor_grade, 0.5)
    
    # Add risk based on tumor volume
    if tumor_volume:
        volume_risk = min(tumor_volume / 100, 1.0)  # Normalize to 0-1
        risk_score += volume_risk
    
    # Normalize final risk score
    risk_score = min(risk_score / 3, 1.0)
    
    # Calculate estimated survival time (in months)
    base_survival = {
        'glioma': 24,
        'meningioma': 60,
        'pituitary': 48,
        'normal': 120
    }
    base_time = base_survival.get(tumor_type, 36)
    estimated_survival = base_time * (1 - risk_score)
    
    return {
        'risk_score': float(risk_score),
        'estimated_survival_months': float(estimated_survival),
        'risk_factors': {
            'tumor_type': tumor_type,
            'tumor_grade': tumor_grade,
            'tumor_volume': float(tumor_volume) if tumor_volume else None
        }
    } 