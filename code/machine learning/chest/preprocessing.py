import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import cv2
from sklearn.model_selection import train_test_split
from setup import CLASSES

def preprocess_image(image_path, target_size=(224, 224)):
    img = cv2.imread(image_path)
    
    if img is None:
        print(f"Warning: Could not read image {image_path}")
        return None
    
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, target_size)
    img = img / 255.0
    
    return img

def create_dataset(data_df, target_size=(224, 224), batch_size=32, test_size=0.2, val_size=0.1):
    train_df, temp_df = train_test_split(
        data_df, 
        test_size=test_size + val_size,
        stratify=data_df['class_id'],
        random_state=42
    )
    
    val_size_adjusted = val_size / (test_size + val_size)
    val_df, test_df = train_test_split(
        temp_df,
        test_size=1 - val_size_adjusted,
        stratify=temp_df['class_id'],
        random_state=42
    )
    
    print(f"Training set: {len(train_df)} images")
    print(f"Validation set: {len(val_df)} images")
    print(f"Test set: {len(test_df)} images")
    
    train_df.to_csv('train_set.csv', index=False)
    val_df.to_csv('val_set.csv', index=False)
    test_df.to_csv('test_set.csv', index=False)
    
    return train_df, val_df, test_df

def visualize_samples(data_df, num_samples=5):
    plt.figure(figsize=(15, 12))
    
    for i, class_name in enumerate(CLASSES):
        class_samples = data_df[data_df['class'] == class_name].sample(min(num_samples, len(data_df[data_df['class'] == class_name])))
        
        for j, (_, row) in enumerate(class_samples.iterrows()):
            img = preprocess_image(row['path'])
            if img is not None:
                plt.subplot(len(CLASSES), num_samples, i * num_samples + j + 1)
                plt.imshow(img)
                plt.title(f"{class_name.split(' ')[0]}")
                plt.axis('off')
    
    plt.tight_layout()
    plt.savefig('sample_images.png')
    plt.close()

if __name__ == "__main__":
    print("Preprocessing data...")
    data_df = pd.read_csv('dataset_info.csv')
    
    print("Creating train, validation, and test splits...")
    train_df, val_df, test_df = create_dataset(data_df)
    
    print("Visualizing sample images...")
    visualize_samples(data_df)
    
    print("Preprocessing complete.")