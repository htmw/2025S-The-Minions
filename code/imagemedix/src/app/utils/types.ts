export interface FileWithId extends File {
    id: string;
  }
  
  export type UploadStatus = 'pending' | 'uploading' | 'analyzing' | 'success' | 'error';
  
  export interface ScanResult {
    // Common fields
    confidence?: number;
    report?: string;
    reportDate?: string;
    explanation?: string;
    
    // For chest X-rays
    condition?: 'normal' | 'pneumonia';
    normalScore?: number;
    pneumoniaScore?: number;
    
    // For brain scans
    hasTumor?: boolean;
    tumorType?: string;
    tumorLocation?: string;
    
    // Raw API response
    raw?: any;
  }
  
  export interface ScanData {
    _id: string;
    patientId: string;
    patientName: string;
    type: string;
    status: string;
    createdAt: string;
    result?: ScanResult;
    scanType?: 'brain' | 'chest';
    userEmail?: string;
    imageUrl?: string;
  }