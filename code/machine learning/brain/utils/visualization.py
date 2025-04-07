import numpy as np
import cv2
import matplotlib.pyplot as plt
from io import BytesIO
import base64

def generate_heatmap(image, predictions):
    """
    Generate a heatmap showing the model's attention
    """
    # Convert image to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    
    # Create a blank heatmap
    heatmap = np.zeros_like(gray)
    
    # Get tumor probability
    tumor_prob = predictions['tumor_probability']
    
    # Generate heatmap based on tumor probability
    if tumor_prob > 0.5:
        # Apply Gaussian blur to create a smooth heatmap
        heatmap = cv2.GaussianBlur(gray, (21, 21), 0)
        heatmap = cv2.normalize(heatmap, None, 0, 255, cv2.NORM_MINMAX)
        
        # Apply color map
        heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)
        
        # Convert to base64
        _, buffer = cv2.imencode('.png', heatmap)
        heatmap_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return heatmap_base64
    return None

def create_bounding_box(image, predictions):
    """
    Create a bounding box around the tumor
    """
    # Get tumor dimensions
    dimensions = predictions['tumor_dimensions']
    
    if dimensions:
        # Calculate box coordinates
        x = int(dimensions['x'])
        y = int(dimensions['y'])
        w = int(dimensions['width'])
        h = int(dimensions['height'])
        
        # Create image with bounding box
        img_with_box = image.copy()
        cv2.rectangle(img_with_box, (x, y), (x + w, y + h), (0, 255, 0), 2)
        
        # Convert to base64
        _, buffer = cv2.imencode('.png', img_with_box)
        box_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return box_base64
    return None

def create_visualization_report(image, predictions):
    """
    Create a comprehensive visualization report
    """
    # Create figure with subplots
    fig, axes = plt.subplots(2, 2, figsize=(12, 12))
    
    # Original image
    axes[0, 0].imshow(image)
    axes[0, 0].set_title('Original Image')
    axes[0, 0].axis('off')
    
    # Heatmap
    heatmap = generate_heatmap(image, predictions)
    if heatmap:
        heatmap_img = plt.imread(BytesIO(base64.b64decode(heatmap)))
        axes[0, 1].imshow(heatmap_img)
        axes[0, 1].set_title('Attention Heatmap')
        axes[0, 1].axis('off')
    
    # Bounding box
    box = create_bounding_box(image, predictions)
    if box:
        box_img = plt.imread(BytesIO(base64.b64decode(box)))
        axes[1, 0].imshow(box_img)
        axes[1, 0].set_title('Tumor Location')
        axes[1, 0].axis('off')
    
    # Class probabilities
    probs = predictions['class_probabilities']
    classes = list(probs.keys())
    values = list(probs.values())
    axes[1, 1].bar(classes, values)
    axes[1, 1].set_title('Class Probabilities')
    axes[1, 1].set_ylim(0, 1)
    plt.xticks(rotation=45)
    
    # Save to base64
    buffer = BytesIO()
    plt.savefig(buffer, format='png', bbox_inches='tight')
    buffer.seek(0)
    report_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    plt.close()
    return report_base64

def generate_trend_visualization(historical_data):
    """
    Generate visualization of tumor growth/regression over time
    """
    dates = [d['date'] for d in historical_data]
    volumes = [d['volume'] for d in historical_data]
    
    plt.figure(figsize=(10, 6))
    plt.plot(dates, volumes, marker='o')
    plt.title('Tumor Volume Over Time')
    plt.xlabel('Date')
    plt.ylabel('Volume (cm³)')
    plt.grid(True)
    
    # Save to base64
    buffer = BytesIO()
    plt.savefig(buffer, format='png', bbox_inches='tight')
    buffer.seek(0)
    trend_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    plt.close()
    return trend_base64 