import os
import numpy as np
import cv2
from sklearn.model_selection import train_test_split

class BrainTumorDataProcessor:
    def __init__(self, base_path):
        self.base_path = base_path
        self.classes = ['glioma', 'meningioma', 'notumor', 'pituitary']
        self.data = []
        self.labels = []
        
    def load_and_preprocess_images(self, img_size=(224, 224)):
        for class_idx, class_name in enumerate(self.classes):
            class_path = os.path.join(self.base_path, 'Testing', class_name)
            for img_name in os.listdir(class_path):
                img_path = os.path.join(class_path, img_name)
                try:
                    img = cv2.imread(img_path)
                    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                    img = cv2.resize(img, img_size)
                    img = img / 255.0
                    self.data.append(img)
                    self.labels.append(class_idx)
                except Exception as e:
                    print(f"Error processing {img_path}: {str(e)}")
        
        self.data = np.array(self.data)
        self.labels = np.array(self.labels)
        
    def split_data(self, test_size=0.2, random_state=42):
        return train_test_split(
            self.data, 
            self.labels, 
            test_size=test_size, 
            random_state=random_state,
            stratify=self.labels
        )
    
    def get_class_names(self):
        return self.classes
    
    def get_data_shape(self):
        return self.data.shape
    
    def get_unique_labels(self):
        return np.unique(self.labels, return_counts=True)