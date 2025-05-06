import { FileWithId } from './types';

// Convert file to data URL for preview/storage
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to data URL'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsDataURL(file);
  });
};

// Generate image placeholder if needed
export const getImagePlaceholder = (scanType: 'brain' | 'chest'): string => {
  if (scanType === 'brain') {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMxMTFiMmIiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjcwIiBzdHJva2U9IiM0MzM4ZmYiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWRhc2hhcnJheT0iMTAiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjUwIiBzdHJva2U9IiM2MzY2ZmYiIHN0cm9rZS13aWR0aD0iMiIvPjx0ZXh0IHg9IjEwMCIgeT0iMTEwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMCIgZmlsbD0id2hpdGUiPkJyYWluIFNjYW48L3RleHQ+PC9zdmc+';
  } else {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMxMTFiMmIiLz48cmVjdCB4PSI1MCIgeT0iNTAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBzdHJva2U9IiM2MzY2ZmYiIHN0cm9rZS13aWR0aD0iMiIvPjxyZWN0IHg9IjY1IiB5PSI2NSIgd2lkdGg9IjcwIiBoZWlnaHQ9IjcwIiBzdHJva2U9IiM0MzM4ZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWRhc2hhcnJheT0iNSIvPjx0ZXh0IHg9IjEwMCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMCIgZmlsbD0id2hpdGUiPkNoZXN0IFgtUmF5PC90ZXh0Pjwvc3ZnPg==';
  }
};

// Simple ML simulation for testing without API
export const simulateAnalysis = (scanType: 'brain' | 'chest'): Promise<any> => {
  return new Promise((resolve) => {
    // Simulate processing time
    setTimeout(() => {
      const isAbnormal = Math.random() > 0.5;
      const confidence = 0.7 + (Math.random() * 0.25); // Random confidence between 0.7 and 0.95
      
      if (scanType === 'brain') {
        resolve({
          hasTumor: isAbnormal,
          confidence: confidence,
          tumorType: isAbnormal ? 'Glioma' : 'Normal',
          tumorLocation: isAbnormal ? 'Left frontal lobe' : 'N/A'
        });
      } else {
        resolve({
          condition: isAbnormal ? 'pneumonia' : 'normal',
          confidence: confidence,
          normalScore: isAbnormal ? 1 - confidence : confidence,
          pneumoniaScore: isAbnormal ? confidence : 1 - confidence
        });
      }
    }, 2000);
  });
};