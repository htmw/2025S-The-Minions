import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from tqdm import tqdm
import cv2
from sklearn.model_selection import train_test_split

BASE_DIR = 'dataset/chest'

CLASSES = [
    '00 Anatomia Normal',
    '01 Processos Inflamatório',
    '02 Maior Densidade (Derrame)',
    '03 Menor Densidade (Pneumotórax)',
    '04 Doenças Pulmonares Crônicas',
    '05 Doenças Infecciosas',
    '06 Lesões Encapsuladas',
    '07 Alterações de Mediastino',
    '08 Alterações do Tórax Ósseo'
]

def load_and_explore_data():
    class_counts = {}
    all_files = []
    
    for class_name in CLASSES:
        class_path = os.path.join(BASE_DIR, class_name)
        if os.path.exists(class_path):
            files = os.listdir(class_path)
            image_files = [f for f in files if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
            class_counts[class_name] = len(image_files)
            
            for file in image_files:
                all_files.append({
                    'path': os.path.join(class_path, file),
                    'class': class_name,
                    'class_id': CLASSES.index(class_name)
                })
    
    data_df = pd.DataFrame(all_files)
    
    print("Class distribution:")
    for class_name, count in class_counts.items():
        print(f"{class_name}: {count} images")
    
    plt.figure(figsize=(12, 6))
    plt.bar(class_counts.keys(), class_counts.values())
    plt.xticks(rotation=90)
    plt.title('Number of Images per Class')
    plt.tight_layout()
    plt.savefig('class_distribution.png')
    plt.close()
    
    return data_df

if __name__ == "__main__":
    print("Setting up the project and exploring data...")
    data_df = load_and_explore_data()
    data_df.to_csv('dataset_info.csv', index=False)
    print("Setup complete.")