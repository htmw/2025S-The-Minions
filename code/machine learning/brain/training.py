import os
import torch
import torch.nn as nn
import torch.optim as optim
import torchvision.transforms as transforms
import torchvision.models as models
from torch.utils.data import Dataset, DataLoader
from PIL import Image
import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix, classification_report
import json
from tqdm import tqdm
import random

# Set random seeds for reproducibility
torch.manual_seed(42)
torch.cuda.manual_seed_all(42)
np.random.seed(42)
random.seed(42)
torch.backends.cudnn.deterministic = True
torch.backends.cudnn.benchmark = False

# Define device for training
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

# Define data transformations for brain MRIs
def get_transforms(model_type):
    if model_type == "brain":
        return {
            'train': transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.RandomHorizontalFlip(),
                transforms.RandomRotation(15),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
            ]),
            'val': transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
            ])
        }
    else:
        raise ValueError(f"Unexpected model type: {model_type}")

# Custom Dataset class
class MedicalImageDataset(Dataset):
    def __init__(self, root_dir, transform=None, class_to_idx=None):
        self.root_dir = root_dir
        self.transform = transform
        if class_to_idx is None:
            self.classes = sorted(os.listdir(root_dir))
            self.class_to_idx = {cls_name: i for i, cls_name in enumerate(self.classes)}
        else:
            self.class_to_idx = class_to_idx
            self.classes = list(class_to_idx.keys())
        self.samples = self._make_dataset()
    
    def _make_dataset(self):
        samples = []
        for class_name in self.classes:
            class_dir = os.path.join(self.root_dir, class_name)
            if not os.path.isdir(class_dir):
                continue
            for image_name in os.listdir(class_dir):
                if image_name.lower().endswith(('.jpg', '.jpeg', '.png', '.dcm')):
                    image_path = os.path.join(class_dir, image_name)
                    samples.append((image_path, self.class_to_idx[class_name]))
        return samples
    
    def __len__(self):
        return len(self.samples)
    
    def __getitem__(self, idx):
        image_path, label = self.samples[idx]
        try:
            image = Image.open(image_path).convert('RGB')
        except Exception as e:
            print(f"Error loading image {image_path}: {e}. Using placeholder image.")
            image = Image.new('RGB', (224, 224), color='gray')
        if self.transform:
            image = self.transform(image)
        return image, label

# Define model (using pre-trained DenseNet121)
def get_model(model_type, num_classes=2):
    if model_type == "brain":
        model = models.densenet121(weights=models.DenseNet121_Weights.DEFAULT)
        num_features = model.classifier.in_features
        model.classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(num_features, num_classes)
        )
        return model
    else:
        raise ValueError(f"Unknown model type: {model_type}")

# Training function
def train_model(model, dataloaders, criterion, optimizer, scheduler, num_epochs=20, model_type="brain", checkpoints_dir='checkpoints'):
    os.makedirs(checkpoints_dir, exist_ok=True)
    best_model_path = os.path.join(checkpoints_dir, f'best_{model_type}_model.pth')
    best_acc = 0.0
    history = {'train_loss': [], 'val_loss': [], 'train_acc': [], 'val_acc': []}
    
    for epoch in range(num_epochs):
        print(f'Epoch {epoch+1}/{num_epochs}')
        print('-' * 10)
        
        for phase in ['train', 'val']:
            if phase == 'train':
                model.train()
            else:
                model.eval()
            
            running_loss = 0.0
            running_corrects = 0
            
            pbar = tqdm(dataloaders[phase], desc=f'{phase.capitalize()} Epoch {epoch+1}/{num_epochs}')
            for inputs, labels in pbar:
                inputs = inputs.to(device)
                labels = labels.to(device)
                optimizer.zero_grad()
                
                with torch.set_grad_enabled(phase == 'train'):
                    outputs = model(inputs)
                    _, preds = torch.max(outputs, 1)
                    loss = criterion(outputs, labels)
                    
                    if phase == 'train':
                        loss.backward()
                        optimizer.step()
                
                running_loss += loss.item() * inputs.size(0)
                running_corrects += torch.sum(preds == labels.data)
                pbar.set_postfix({'loss': loss.item(), 'acc': torch.sum(preds == labels.data).item()/inputs.size(0)})
            
            if phase == 'train' and scheduler is not None:
                scheduler.step()
            
            epoch_loss = running_loss / len(dataloaders[phase].dataset)
            epoch_acc = running_corrects.double() / len(dataloaders[phase].dataset)
            
            history[f'{phase}_loss'].append(epoch_loss)
            history[f'{phase}_acc'].append(epoch_acc.item())
            
            print(f'{phase.capitalize()} Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f}')
            
            if phase == 'val' and epoch_acc > best_acc:
                best_acc = epoch_acc
                torch.save({
                    'model_state_dict': model.state_dict(),
                    'optimizer_state_dict': optimizer.state_dict(),
                    'acc': best_acc,
                    'epoch': epoch,
                    'class_to_idx': dataloaders['train'].dataset.class_to_idx
                }, best_model_path)
                print(f'Saved model with acc {best_acc:.4f} to {best_model_path}')
    
    print(f'Best val Acc: {best_acc:.4f}')
    
    # Plot and save training history
    plt.figure(figsize=(12, 4))
    plt.subplot(1, 2, 1)
    plt.plot(history['train_loss'], label='Train Loss')
    plt.plot(history['val_loss'], label='Val Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()
    
    plt.subplot(1, 2, 2)
    plt.plot(history['train_acc'], label='Train Accuracy')
    plt.plot(history['val_acc'], label='Val Accuracy')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.legend()
    
    plt.tight_layout()
    plt.savefig(os.path.join(checkpoints_dir, f'{model_type}_training_history.png'))
    plt.close()
    
    return history, best_model_path

# Evaluation function
def evaluate_model(model, dataloader, criterion):
    model.eval()
    running_loss = 0.0
    running_corrects = 0
    all_preds = []
    all_labels = []
    
    with torch.no_grad():
        for inputs, labels in tqdm(dataloader, desc='Evaluating'):
            inputs = inputs.to(device)
            labels = labels.to(device)
            outputs = model(inputs)
            _, preds = torch.max(outputs, 1)
            loss = criterion(outputs, labels)
            
            running_loss += loss.item() * inputs.size(0)
            running_corrects += torch.sum(preds == labels.data)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
    
    test_loss = running_loss / len(dataloader.dataset)
    test_acc = running_corrects.double() / len(dataloader.dataset)
    
    print(f'Test Loss: {test_loss:.4f} Acc: {test_acc:.4f}')
    cm = confusion_matrix(all_labels, all_preds)
    print("Confusion Matrix:")
    print(cm)
    class_names = list(dataloader.dataset.class_to_idx.keys())
    print("\nClassification Report:")
    print(classification_report(all_labels, all_preds, target_names=class_names))
    
    return test_acc, cm, all_preds, all_labels

# End-to-end train and evaluate pipeline
def train_and_evaluate(data_dir, model_type, num_epochs=20, batch_size=32, learning_rate=0.0003, checkpoints_dir='checkpoints'):
    print(f"\n{'='*50}\nTraining {model_type.upper()} model\n{'='*50}")
    
    transforms_dict = get_transforms(model_type)
    train_data_dir = os.path.join(data_dir, model_type, 'train')
    val_data_dir   = os.path.join(data_dir, model_type, 'val')
    test_data_dir  = os.path.join(data_dir, model_type, 'test')
    
    train_dataset = MedicalImageDataset(train_data_dir, transform=transforms_dict['train'])
    val_dataset   = MedicalImageDataset(val_data_dir, transform=transforms_dict['val'], class_to_idx=train_dataset.class_to_idx)
    test_dataset  = MedicalImageDataset(test_data_dir, transform=transforms_dict['val'], class_to_idx=train_dataset.class_to_idx)
    
    print(f"Classes: {train_dataset.classes}")
    print(f"Training samples: {len(train_dataset)}")
    print(f"Validation samples: {len(val_dataset)}")
    print(f"Test samples: {len(test_dataset)}")
    
    dataloaders = {
        'train': DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=4, pin_memory=True),
        'val': DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=4, pin_memory=True)
    }
    test_dataloader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=4, pin_memory=True)
    
    num_classes = len(train_dataset.classes)
    model = get_model(model_type, num_classes=num_classes).to(device)
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=learning_rate, weight_decay=1e-5)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, 'min', patience=3, factor=0.1, verbose=True)
    
    history, best_model_path = train_model(model, dataloaders, criterion, optimizer, scheduler,
                                             num_epochs=num_epochs, model_type=model_type, checkpoints_dir=checkpoints_dir)
    
    # Load the best model
    checkpoint = torch.load(best_model_path)
    model.load_state_dict(checkpoint['model_state_dict'])
    
    print("\nEvaluating on test set:")
    test_acc, cm, all_preds, all_labels = evaluate_model(model, test_dataloader, criterion)
    
    model_info = {
        'model_type': model_type,
        'num_classes': num_classes,
        'classes': train_dataset.classes,
        'class_to_idx': train_dataset.class_to_idx,
        'best_acc': checkpoint['acc'],
        'best_epoch': checkpoint['epoch'],
    }
    
    with open(os.path.join(checkpoints_dir, f"{model_type}_model_info.json"), 'w') as f:
        json.dump(model_info, f)
    
    # Plot and save confusion matrix
    plt.figure(figsize=(10, 8))
    plt.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    plt.title(f'Confusion Matrix for {model_type} model')
    plt.colorbar()
    tick_marks = np.arange(len(train_dataset.classes))
    plt.xticks(tick_marks, train_dataset.classes, rotation=45)
    plt.yticks(tick_marks, train_dataset.classes)
    thresh = cm.max() / 2.
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            plt.text(j, i, format(cm[i, j], 'd'),
                     horizontalalignment="center",
                     color="white" if cm[i, j] > thresh else "black")
    plt.ylabel('True label')
    plt.xlabel('Predicted label')
    plt.tight_layout()
    plt.savefig(os.path.join(checkpoints_dir, f'{model_type}_confusion_matrix.png'))
    plt.close()
    
    return model_info

def main():
    data_dir = "medical_images"
    checkpoints_dir = "model_checkpoints"
    os.makedirs(checkpoints_dir, exist_ok=True)
    model_type = "brain"
    config = {'epochs': 20, 'batch_size': 32, 'lr': 0.0003}
    
    model_info = train_and_evaluate(data_dir=data_dir,
                                    model_type=model_type,
                                    num_epochs=config['epochs'],
                                    batch_size=config['batch_size'],
                                    learning_rate=config['lr'],
                                    checkpoints_dir=checkpoints_dir)
    print("\nBrain model training complete!")
    print("Model summary:")
    print(f"  Classes: {model_info['classes']}")
    print(f"  Best Accuracy: {model_info['best_acc']:.4f} (Epoch {model_info['best_epoch']+1})")

if __name__ == "__main__":
    main()
