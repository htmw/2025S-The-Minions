import { FileWithId } from './types';
import { generateReport } from './reportUtils';
import { simulateAnalysis, fileToDataUrl } from './imageUtils';
import { saveScanToLocalStorage } from './localStorageService';

export interface ProcessingCallbacks {
  onUploadStatusChange: (fileId: string, status: 'pending' | 'uploading' | 'analyzing' | 'success' | 'error') => void;
  onAnalysisResultsUpdate: (fileId: string, results: any) => void;
  onScanIdUpdate: (scanId: string) => void;
  onError: (message: string) => void;
  onProcessingComplete: () => void;
}

export const processChestXray = async (
  file: FileWithId,
  patientId: string,
  patientName: string,
  userEmail: string,
  callbacks: ProcessingCallbacks
) => {
  try {
    callbacks.onUploadStatusChange(file.id, 'uploading');
    
    // Convert file to data URL for storage
    const imageUrl = await fileToDataUrl(file);
    
    callbacks.onUploadStatusChange(file.id, 'analyzing');
    
    // Simulate API call with our local function
    const analysisResult = await simulateAnalysis('chest');
    
    const condition = analysisResult.condition;
    const confidence = analysisResult.confidence;
    const normalScore = analysisResult.normalScore;
    const pneumoniaScore = analysisResult.pneumoniaScore;

    // Generate explanation (simplified)
    const explanation = condition === 'pneumonia'
      ? `Analysis of the chest X-ray reveals opacities consistent with pneumonia. The distribution pattern suggests bacterial infection. Lung peripheries show increased density, and there is evidence of consolidation.`
      : `Analysis of the chest X-ray shows clear lung fields with no evidence of infiltrates, consolidation, or effusion. Heart size and pulmonary vascularity appear within normal limits.`;

    const reportDate = new Date().toISOString();
    const structuredReport = generateReport({
      patientName,
      patientId,
      scanType: 'chest',
      condition,
      confidence,
      explanation,
      reportDate
    });
    
    const result = {
      condition,
      confidence,
      normalScore,
      pneumoniaScore,
      explanation,
      report: structuredReport,
      reportDate
    };
    
    callbacks.onAnalysisResultsUpdate(file.id, result);
    
    // Save to localStorage instead of API
    const savedScan = saveScanToLocalStorage({
      patientId,
      patientName,
      scanType: 'chest',
      result,
      imageUrl,
      userEmail
    });
    
    callbacks.onScanIdUpdate(savedScan._id);
    callbacks.onUploadStatusChange(file.id, 'success');
    callbacks.onProcessingComplete();
    
    return result;
  } catch (error: any) {
    console.error('Error analyzing chest X-ray:', error);
    callbacks.onUploadStatusChange(file.id, 'error');
    callbacks.onError(`Failed to analyze ${file.name}: ${error.message}`);
    throw error;
  }
};

export const processBrainScan = async (
  file: FileWithId,
  patientId: string,
  patientName: string,
  userEmail: string,
  callbacks: ProcessingCallbacks
) => {
  try {
    callbacks.onUploadStatusChange(file.id, 'uploading');
    
    // Convert file to data URL for storage
    const imageUrl = await fileToDataUrl(file);
    
    callbacks.onUploadStatusChange(file.id, 'analyzing');
    
    // Simulate API call with our local function
    const analysisResult = await simulateAnalysis('brain');
    
    // Add explanation
    const explanation = analysisResult.hasTumor
      ? `Analysis of the brain MRI reveals a mass with characteristics consistent with a ${analysisResult.tumorType}. The lesion is located in the ${analysisResult.tumorLocation} and demonstrates heterogeneous signal intensity.`
      : `Analysis of the brain MRI shows no evidence of intracranial mass. The brain parenchyma demonstrates normal signal intensity throughout. Ventricles and sulci are of normal size and configuration.`;

    const reportDate = new Date().toISOString();
    const structuredReport = generateReport({
      patientName,
      patientId,
      scanType: 'brain',
      condition: analysisResult.hasTumor ? 'tumor' : 'normal',
      confidence: analysisResult.confidence,
      explanation,
      reportDate
    });
    
    const result = {
      ...analysisResult,
      explanation,
      report: structuredReport,
      reportDate
    };
    
    callbacks.onAnalysisResultsUpdate(file.id, result);
    
    // Save to localStorage instead of API
    const savedScan = saveScanToLocalStorage({
      patientId,
      patientName,
      scanType: 'brain',
      result,
      imageUrl,
      userEmail
    });
    
    callbacks.onScanIdUpdate(savedScan._id);
    callbacks.onUploadStatusChange(file.id, 'success');
    callbacks.onProcessingComplete();
    
    return result;
  } catch (error: any) {
    console.error('Error analyzing brain scan:', error);
    callbacks.onUploadStatusChange(file.id, 'error');
    callbacks.onError(`Failed to analyze ${file.name}: ${error.message}`);
    throw error;
  }
};