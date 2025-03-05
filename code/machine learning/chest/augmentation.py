import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import torch
from torch.utils.data import Dataset, DataLoader
import torchvision.transforms as transforms
from PIL import Image
from setup import CLASSES

class LungXrayDataset(Dataset):
    def __init__(self, dataframe, transform=None):
        self.dataframe = dataframe
        self.transform = transform
        
    def __len__(self):
        return len(self.dataframe)
    
    def __getitem__(self, idx):
        img_path = self.dataframe.iloc[idx]['path']
        image = Image.open(img_path).convert('RGB')
        class_id = self.dataframe.iloc[idx]['class_id']
        
        if self.transform:
            image = self.transform(image)
            
        return image, class_id

def create_data_loaders(train_df, val_df, test_df, target_size=(224, 224), batch_size=32):
    # Define transformations
    train_transform = transforms.Compose([
        transforms.Resize(target_size),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.1, contrast=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize(target_size),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    # Create datasets
    train_dataset = LungXrayDataset(train_df, transform=train_transform)
    val_dataset = LungXrayDataset(val_df, transform=val_transform)
    test_dataset = LungXrayDataset(test_df, transform=val_transform)
    
    # Create data loaders
    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=4,
        pin_memory=True
    )
    
    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=4,
        pin_memory=True
    )
    
    test_loader = DataLoader(
        test_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=4,
        pin_memory=True
    )
    
    return train_loader, val_loader, test_loader

def visualize_augmented_samples(train_loader):
    plt.figure(figsize=(12, 6))
    
    # Get a batch from the train loader
    images, labels = next(iter(train_loader))
    
    # Move tensors to CPU and convert to numpy for visualization
    images = images.cpu().numpy()
    labels = labels.cpu().numpy()
    
    # De-normalize the images for visualization
    mean = np.array([0.485, 0.456, 0.406]).reshape(1, 3, 1, 1)
    std = np.array([0.229, 0.224, 0.225]).reshape(1, 3, 1, 1)
    images = images * std + mean
    
    # Plot the images
    for i in range(min(8, len(images))):
        plt.subplot(2, 4, i+1)
        # Transpose from [C, H, W] to [H, W, C] and clip to [0, 1]
        img = np.transpose(images[i], (1, 2, 0))
        img = np.clip(img, 0, 1)
        plt.imshow(img)
        plt.title(f"Class: {labels[i]}")
        plt.axis('off')
    
    plt.tight_layout()
    plt.savefig('augmented_samples_pytorch.png')
    plt.close()

def prepare_data_for_model(train_df, val_df, test_df, target_size=(224, 224), batch_size=32):
    # Create PyTorch data loaders
    train_loader, val_loader, test_loader = create_data_loaders(
        train_df, val_df, test_df, target_size, batch_size
    )
    
    # Return data loaders for model training
    return train_loader, val_loader, test_loader

if __name__ == "__main__":
    print("Setting up PyTorch data augmentation...")
    
    train_df = pd.read_csv('train_set.csv')
    val_df = pd.read_csv('val_set.csv')
    test_df = pd.read_csv('test_set.csv')
    
    print("Creating PyTorch data loaders with augmentation...")
    train_loader, val_loader, test_loader = create_data_loaders(train_df, val_df, test_df)
    
    print("Visualizing augmented samples...")
    visualize_augmented_samples(train_loader)
    
    print("PyTorch data preparation complete.")