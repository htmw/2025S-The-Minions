import pandas as pd
from setup import load_and_explore_data
from preprocessing import create_dataset, visualize_samples
from augmentation import create_data_loaders, visualize_augmented_samples

def main():
    print("Step 1: Loading and exploring data...")
    data_df = load_and_explore_data()
    data_df.to_csv('dataset_info.csv', index=False)
    
    print("\nStep 2: Creating train, validation, and test splits...")
    train_df, val_df, test_df = create_dataset(data_df)
    
    print("\nStep 3: Visualizing sample images from each class...")
    visualize_samples(data_df)
    
    print("\nStep 4: Creating PyTorch data loaders with augmentation...")
    train_loader, val_loader, test_loader = create_data_loaders(train_df, val_df, test_df)
    
    print("\nStep 5: Visualizing augmented samples...")
    visualize_augmented_samples(train_loader)
    
    print("\nData preprocessing complete! Ready for PyTorch model training.")

if __name__ == "__main__":
    main()