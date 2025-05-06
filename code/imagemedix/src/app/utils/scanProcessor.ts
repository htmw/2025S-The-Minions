import { FileWithId } from './idUtils';
import { mlModel, scans } from '@/services/api';
import { generateReport } from './reportUtils';

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
  callbacks: ProcessingCallbacks
) => {
  try {
    callbacks.onUploadStatusChange(file.id, 'analyzing');
    
    const response = await mlModel.analyzeChestXray(file);
    
    const classifications = response.classifications || [];
    const explanation = response.explanation || '';
    
    const normalClass = classifications.find((c: any) => c.label === 'normal');
    const pneumoniaClass = classifications.find((c: any) => c.label === 'pneumonia');
    
    const normalScore = normalClass?.score || 0;
    const pneumoniaScore = pneumoniaClass?.score || 0;
    
    const condition = pneumoniaScore > normalScore ? 'pneumonia' : 'normal';
    const confidence = condition === 'pneumonia' ? pneumoniaScore : normalScore;

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
      reportDate,
      raw: response
    };
    
    callbacks.onAnalysisResultsUpdate(file.id, result);
    callbacks.onUploadStatusChange(file.id, 'success');
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('patientId', patientId);
    formData.append('patientName', patientName);
    formData.append('scanType', 'chest');
    
    formData.append('result', JSON.stringify({
      hasTumor: condition === 'pneumonia',
      confidence: confidence,
      tumorType: condition === 'pneumonia' ? 'Pneumonia' : 'Normal',
      tumorLocation: condition === 'pneumonia' ? 'Lungs' : 'N/A',
      tumorSize: 'N/A',
      additionalNotes: explanation.slice(0, 1000),
      report: structuredReport
    }));
    
    try {
      const uploadResponse = await scans.upload(formData);
      
      if (uploadResponse.data._id) {
        callbacks.onScanIdUpdate(uploadResponse.data._id);
      }
      
      callbacks.onProcessingComplete();
    } catch (uploadError) {
      console.error('Failed to upload scan to backend:', uploadError);
    }
    
    return result;
  } catch (error: any) {
    console.error('Error analyzing chest X-ray:', error);
    callbacks.onUploadStatusChange(file.id, 'error');
    callbacks.onError(error.response?.data?.message || `Failed to analyze ${file.name}`);
    throw error;
  }
};

export const processBrainScan = async (
  file: FileWithId,
  patientId: string,
  patientName: string,
  callbacks: ProcessingCallbacks
) => {
  try {
    callbacks.onUploadStatusChange(file.id, 'uploading');
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('patientId', patientId);
    formData.append('patientName', patientName);
    formData.append('scanType', 'brain');
    
    const response = await scans.upload(formData);
    callbacks.onUploadStatusChange(file.id, 'analyzing');
    
    if (response.data._id) {
      callbacks.onScanIdUpdate(response.data._id);
      pollAnalysisStatus(response.data._id, file.id, callbacks);
    }
  } catch (err: any) {
    callbacks.onUploadStatusChange(file.id, 'error');
    callbacks.onError(err.response?.data?.message || `Failed to upload ${file.name}`);
  }
};

export const pollAnalysisStatus = async (
  scanId: string, 
  fileId: string, 
  callbacks: ProcessingCallbacks
) => {
  try {
    const { data: statusData } = await mlModel.getAnalysisStatus(scanId);
    
    if (statusData.status === 'completed') {
      const { data: results } = await scans.getById(scanId);

      const reportDate = new Date().toISOString();
      let structuredReport = results.report;
      
      if (!structuredReport) {
        structuredReport = generateReport({
          patientName: results.patientName || 'Unknown',
          patientId: results.patientId || 'Unknown',
          scanType: 'brain',
          condition: results.hasTumor ? 'tumor' : 'normal',
          confidence: results.confidence || 0.5,
          explanation: results.additionalNotes || '',
          reportDate
        });
      }

      const enhancedResults = {
        ...results,
        report: structuredReport,
        reportDate
      };
      
      callbacks.onAnalysisResultsUpdate(fileId, enhancedResults);
      callbacks.onUploadStatusChange(fileId, 'success');
      callbacks.onProcessingComplete();
    } else if (statusData.status === 'failed' || (statusData.jobStatus?.state === 'failed')) {
      callbacks.onUploadStatusChange(fileId, 'error');
      callbacks.onError(`Analysis failed for ${fileId}: ${statusData.jobStatus?.failedReason || 'Unknown error'}`);
    } else {
      callbacks.onUploadStatusChange(fileId, 'analyzing');
      setTimeout(() => pollAnalysisStatus(scanId, fileId, callbacks), 5000);
    }
  } catch (error: any) {
    callbacks.onUploadStatusChange(fileId, 'error');
    callbacks.onError(error.response?.data?.message || `Failed to get analysis status for ${fileId}`);
  }
};