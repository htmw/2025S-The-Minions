"use client";

import React, { useState, useCallback, useEffect } from "react";
import { 
  Upload,
  X,
  AlertCircle,
  FileImage,
  CheckCircle,
  Loader2,
  Heart,
  Brain,
  Eye,
  Badge,
  BarChart3,
  FileText,
  User,
  Download,
  XCircle
} from "lucide-react";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import { scans, mlModel } from "@/services/api";
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Sidebar from '@/components/Sidebar';

// Create a unique ID generator for files
const generateUniqueId = (() => {
  let counter = 0;
  return () => `file-${Date.now()}-${counter++}`;
})();

// File interface with unique ID
interface FileWithId extends File {
  id: string;
}

export default function UploadPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const [files, setFiles] = useState<FileWithId[]>([]);
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: 'pending' | 'uploading' | 'analyzing' | 'success' | 'error' }>({});
  const [error, setError] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [analysisResults, setAnalysisResults] = useState<{ [key: string]: any }>({});
  const [scanType, setScanType] = useState<'brain' | 'chest'>('brain');
  const [processingComplete, setProcessingComplete] = useState(false);
  const [uploadedScanIds, setUploadedScanIds] = useState<string[]>([]); 
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<FileWithId | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check auth status first
    if (isLoaded) {
      if (!isSignedIn) {
        router.push('/auth/login');
        return;
      }
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    // Show success message when processing is complete
    if (processingComplete && files.every(file => uploadStatus[file.id] === 'success')) {
      setShowSuccessMessage(true);
      
      // Hide the success message after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [processingComplete, files, uploadStatus]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type === 'application/dicom';
      if (!isValidType) {
        setError(`File ${file.name} is not a supported image format`);
        return false;
      }
      return true;
    });

    // Add unique ID to each file
    const filesWithId = validFiles.map(file => {
      // Create a new object with all properties from the file plus id
      const fileWithId = Object.assign(file, {
        id: generateUniqueId()
      });
      return fileWithId;
    });

    setFiles(prev => [...prev, ...filesWithId]);
    filesWithId.forEach(file => {
      setUploadStatus(prev => ({ ...prev, [file.id]: 'pending' }));
    });
    
    // Reset processing complete flag when new files are added
    setProcessingComplete(false);
    setShowSuccessMessage(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/dicom': ['.dcm']
    },
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const processChestXray = async (file: FileWithId) => {
    try {
      setUploadStatus(prev => ({ ...prev, [file.id]: 'analyzing' }));
      
      // Call to Next.js API route (which now proxies to Google Gemini API)
      const response = await mlModel.analyzeChestXray(file);
      
      // Process the results - with updated format from Gemini API
      const classifications = response.classifications || [];
      const explanation = response.explanation || '';
      
      const normalClass = classifications.find((c: any) => c.label === 'normal');
      const pneumoniaClass = classifications.find((c: any) => c.label === 'pneumonia');
      
      const normalScore = normalClass?.score || 0;
      const pneumoniaScore = pneumoniaClass?.score || 0;
      
      const condition = pneumoniaScore > normalScore ? 'pneumonia' : 'normal';
      const confidence = condition === 'pneumonia' ? pneumoniaScore : normalScore;

      // Generate a structured report
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
      
      // Save results
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
      
      setAnalysisResults(prev => ({ 
        ...prev, 
        [file.id]: result
      }));
      
      setUploadStatus(prev => ({ ...prev, [file.id]: 'success' }));
      
      // Also upload to backend for storage
      const formData = new FormData();
      formData.append('image', file);
      formData.append('patientId', patientId);
      formData.append('patientName', patientName);
      formData.append('scanType', 'chest');
      
      // Include analysis results with explanation from Gemini
      formData.append('result', JSON.stringify({
        hasTumor: condition === 'pneumonia', // Treating pneumonia as abnormal finding
        confidence: confidence,
        tumorType: condition === 'pneumonia' ? 'Pneumonia' : 'Normal',
        tumorLocation: condition === 'pneumonia' ? 'Lungs' : 'N/A',
        tumorSize: 'N/A',
        additionalNotes: explanation.slice(0, 1000), // Limit length for database storage
        report: structuredReport
      }));
      
      try {
        const uploadResponse = await scans.upload(formData);
        
        // Store the scan ID
        if (uploadResponse.data._id) {
          setUploadedScanIds(prev => [...prev, uploadResponse.data._id]);
        }
        
        // Mark processing as complete
        setProcessingComplete(true);
      } catch (uploadError) {
        console.error('Failed to upload scan to backend:', uploadError);
        // Continue with UI display even if backend upload fails
      }
      
      return result;
    } catch (error: any) {
      console.error('Error analyzing chest X-ray:', error);
      setUploadStatus(prev => ({ ...prev, [file.id]: 'error' }));
      setError(error.response?.data?.message || `Failed to analyze ${file.name}`);
      throw error;
    }
  };

  const checkAnalysisStatus = async (scanId: string, fileId: string) => {
    try {
      const { data: statusData } = await mlModel.getAnalysisStatus(scanId);
      
      if (statusData.status === 'completed') {
        const { data: results } = await scans.getById(scanId);

        // Generate a structured report if not already present
        const reportDate = new Date().toISOString();
        let structuredReport = results.report;
        
        if (!structuredReport) {
          structuredReport = generateReport({
            patientName,
            patientId,
            scanType: 'brain',
            condition: results.hasTumor ? 'tumor' : 'normal',
            confidence: results.confidence,
            explanation: results.additionalNotes || '',
            reportDate
          });
        }

        // Add the report to the results
        const enhancedResults = {
          ...results,
          report: structuredReport,
          reportDate
        };
        
        setAnalysisResults(prev => ({ ...prev, [fileId]: enhancedResults }));
        setUploadStatus(prev => ({ ...prev, [fileId]: 'success' }));
        
        // Store the scan ID if not already stored
        if (!uploadedScanIds.includes(scanId)) {
          setUploadedScanIds(prev => [...prev, scanId]);
        }
        
        // Mark processing as complete
        setProcessingComplete(true);
      } else if (statusData.status === 'failed' || (statusData.jobStatus?.state === 'failed')) {
        setUploadStatus(prev => ({ ...prev, [fileId]: 'error' }));
        setError(`Analysis failed for ${fileId}: ${statusData.jobStatus?.failedReason || 'Unknown error'}`);
      } else if (statusData.status === 'processing' || statusData.jobStatus?.state === 'active') {
        setUploadStatus(prev => ({ ...prev, [fileId]: 'analyzing' }));
        // Still processing, check again in 5 seconds
        setTimeout(() => checkAnalysisStatus(scanId, fileId), 5000);
      } else {
        // Waiting in queue
        setUploadStatus(prev => ({ ...prev, [fileId]: 'analyzing' }));
        setTimeout(() => checkAnalysisStatus(scanId, fileId), 5000);
      }
    } catch (error: any) {
      setUploadStatus(prev => ({ ...prev, [fileId]: 'error' }));
      setError(error.response?.data?.message || `Failed to get analysis status for ${fileId}`);
    }
  };

  // Generate a structured medical report
  const generateReport = ({ 
    patientName, 
    patientId, 
    scanType, 
    condition, 
    confidence, 
    explanation,
    reportDate
  }: { 
    patientName: string;
    patientId: string;
    scanType: string;
    condition: string;
    confidence: number;
    explanation: string;
    reportDate: string;
  }) => {
    // Format date for display
    const date = new Date(reportDate);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit', 
      minute: '2-digit'
    });

    // Create different reports based on scan type
    if (scanType === 'chest') {
      // For chest X-rays
      return `
# RADIOLOGICAL REPORT

## PATIENT INFORMATION
- **Patient Name:** ${patientName}
- **Patient ID:** ${patientId}
- **Exam Date:** ${formattedDate} at ${formattedTime}
- **Exam Type:** Chest X-Ray
- **Referring Physician:** N/A

## CLINICAL INDICATION
Routine chest X-ray examination for pneumonia screening.

## FINDINGS
${explanation || `
Analysis of the chest X-ray shows ${condition === 'pneumonia' ? 'evidence of pneumonia' : 'no signs of pneumonia'}. ${condition === 'pneumonia' ? 'There are opacities consistent with pneumonic infiltrates.' : 'Lung fields appear clear.'} Heart size and pulmonary vascularity are within normal limits. No pleural effusion or pneumothorax is identified.`}

## IMPRESSION
${condition === 'pneumonia' 
  ? `POSITIVE FOR PNEUMONIA with ${(confidence * 100).toFixed(1)}% confidence.`
  : `NEGATIVE FOR PNEUMONIA with ${(confidence * 100).toFixed(1)}% confidence.`}

## RECOMMENDATIONS
${condition === 'pneumonia' 
  ? 'Clinical correlation and appropriate treatment for pneumonia is recommended. Follow-up imaging may be necessary to monitor response to treatment.'
  : 'No further imaging follow-up is required at this time based on these findings alone.'}

Generated by ImageMedix AI Diagnostic System
This report should be reviewed by a licensed healthcare professional.
      `;
    } else {
      // For brain MRIs
      return `
# RADIOLOGICAL REPORT

## PATIENT INFORMATION
- **Patient Name:** ${patientName}
- **Patient ID:** ${patientId}
- **Exam Date:** ${formattedDate} at ${formattedTime}
- **Exam Type:** Brain MRI
- **Referring Physician:** N/A

## CLINICAL INDICATION
Brain MRI for evaluation of potential tumor.

## TECHNIQUE
Standard multiplanar MRI sequences of the brain were performed.

## FINDINGS
${explanation || `
Analysis of the brain MRI ${condition === 'tumor' ? 'reveals evidence of an intracranial mass' : 'shows no evidence of intracranial mass'}. ${condition === 'tumor' ? 'The lesion demonstrates characteristics consistent with a brain tumor.' : 'The brain parenchyma demonstrates normal signal intensity throughout.'} Ventricles and sulci are of normal size and configuration. No midline shift or mass effect is seen. No evidence of acute infarction, hemorrhage, or extra-axial collection.`}

## IMPRESSION
${condition === 'tumor' 
  ? `POSITIVE FOR BRAIN TUMOR with ${(confidence * 100).toFixed(1)}% confidence.`
  : `NEGATIVE FOR BRAIN TUMOR with ${(confidence * 100).toFixed(1)}% confidence.`}

## RECOMMENDATIONS
${condition === 'tumor' 
  ? 'Neurosurgical consultation is recommended. Consider additional imaging with contrast for further characterization. Clinical correlation is advised.'
  : 'No further imaging follow-up is required at this time based on these findings alone.'}

Generated by ImageMedix AI Diagnostic System
This report should be reviewed by a licensed healthcare professional.
      `;
    }
  };

  const handleUpload = async () => {
    if (!patientId) {
      setError('Please enter a patient ID');
      return;
    }

    if (!patientName) {
      setError('Please enter a patient name');
      return;
    }

    setError('');
    
    // Reset processing complete flag when new upload starts
    setProcessingComplete(false);
    setShowSuccessMessage(false);
    
    // Count of files to process
    let filesToProcess = files.filter(file => uploadStatus[file.id] === 'pending').length;
    
    if (filesToProcess === 0) {
      // No files to process, redirect to results
      router.push('/results');
      return;
    }
    
    for (const file of files) {
      if (uploadStatus[file.id] === 'pending') {
        setUploadStatus(prev => ({ ...prev, [file.id]: 'uploading' }));

        try {
          if (scanType === 'chest') {
            // Process chest X-ray using Gemini API via Next.js API route
            await processChestXray(file);
          } else {
            // Regular flow for brain scans using backend processing
            const formData = new FormData();
            formData.append('image', file);
            formData.append('patientId', patientId);
            formData.append('patientName', patientName);
            formData.append('scanType', 'brain');
            
            const response = await scans.upload(formData);
            setUploadStatus(prev => ({ ...prev, [file.id]: 'analyzing' }));
            
            // Store the scan ID
            if (response.data._id) {
              setUploadedScanIds(prev => [...prev, response.data._id]);
              
              // Start checking analysis status
              checkAnalysisStatus(response.data._id, file.id);
            }
          }
        } catch (err: any) {
          setUploadStatus(prev => ({ ...prev, [file.id]: 'error' }));
          setError(err.response?.data?.message || `Failed to upload ${file.name}`);
        }
      }
    }
  };

  // Open the result modal
  const openResultModal = (fileId: string) => {
    const file = files.find(f => f.id === fileId) || null;
    const result = analysisResults[fileId] || null;
    
    if (file && result) {
      setSelectedFile(file);
      setSelectedResult(result);
      setShowResultModal(true);
    }
  };

  // Close the result modal
  const closeResultModal = () => {
    setShowResultModal(false);
    setSelectedFile(null);
    setSelectedResult(null);
  };

  // Download report as text file
  const downloadReport = () => {
    if (!selectedResult || !selectedResult.report || !selectedFile) return;
    
    const blob = new Blob([selectedResult.report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFile.name.split('.')[0]}-report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Manual redirect to results page
  const viewResults = () => {
    router.push('/results');
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
    setUploadStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[fileId];
      return newStatus;
    });
    // Also remove analysis results if present
    setAnalysisResults(prev => {
      const newResults = { ...prev };
      delete newResults[fileId];
      return newResults;
    });
  };

  // Check if all files are processed
  const allFilesProcessed = files.length > 0 && 
    files.every(file => uploadStatus[file.id] === 'success' || uploadStatus[file.id] === 'error');

  // Get the confidence percentage for display
  const getConfidencePercentage = (result: any) => {
    if (!result || typeof result.confidence !== 'number') return null;
    return (result.confidence * 100).toFixed(1) + '%';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Upload Medical Scans</h1>
          
          {/* Success Message */}
          {showSuccessMessage && (
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 flex items-start">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-400">Upload Successful</h3>
                <p className="mt-1 text-sm text-gray-300">
                  Your {scanType === 'brain' ? 'brain scan' : 'chest X-ray'} has been uploaded and analyzed successfully.
                </p>
                <div className="mt-3">
                  <button
                    onClick={viewResults}
                    className="text-sm font-medium text-green-400 hover:text-green-300 flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    View all results
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Scan Type Selector */}
          <div className="flex gap-4">
            <button
              onClick={() => setScanType('brain')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                scanType === 'brain' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Brain size={20} />
              <span>Brain Scan</span>
            </button>
            
            <button
              onClick={() => setScanType('chest')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                scanType === 'chest' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Heart size={20} />
              <span>Chest X-Ray</span>
            </button>
          </div>

          {/* Patient ID Input */}
          <div>
            <label htmlFor="patientId" className="block text-sm font-medium text-gray-300 mb-2">
              Patient ID
            </label>
            <input
              type="text"
              id="patientId"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter patient ID"
            />
          </div>

          {/* Patient Name Input */}
          <div>
            <label htmlFor="patientName" className="block text-sm font-medium text-gray-300 mb-2">
              Patient Name
            </label>
            <input
              type="text"
              id="patientName"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter patient name"
            />
          </div>

          {/* Upload Area */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700 hover:border-indigo-500'}`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-400">
              Drag and drop your {scanType === 'brain' ? 'MRI scans' : 'chest X-rays'} here, or click to select files
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: PNG, JPG, JPEG, GIF, DICOM (max 10MB)
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-900/20 p-3 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* File List with Enhanced Results Display */}
          {files.length > 0 && (
            <div className="space-y-4">
              {files.map((file) => {
                const result = analysisResults[file.id];
                const isChestXray = scanType === 'chest';
                const condition = isChestXray && result ? result.condition : result?.hasTumor ? 'tumor' : 'normal';
                const isAbnormal = isChestXray ? condition === 'pneumonia' : condition === 'tumor';
                
                return (
                  <div
                    key={file.id}
                    className={`bg-gray-800 rounded-lg overflow-hidden border ${
                      uploadStatus[file.id] === 'success'
                        ? isAbnormal 
                          ? 'border-red-700' 
                          : 'border-green-700'
                        : 'border-gray-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4 p-4">
                      {/* File Info */}
                      <div className="flex items-start gap-3 flex-grow">
                        <FileImage className="h-6 w-6 text-gray-400 flex-shrink-0 mt-1" />
                        <div className="min-w-0 flex-grow">
                          <p className="text-sm text-white font-medium truncate">{file.name}</p>
                          <p className="text-xs text-gray-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MB • {scanType} scan
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            {uploadStatus[file.id] === 'success' ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/40 text-green-400">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Analysis Complete
                              </span>
                            ) : uploadStatus[file.id] === 'error' ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900/40 text-red-400">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Error
                              </span>
                            ) : uploadStatus[file.id] === 'uploading' ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/40 text-blue-400">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Uploading
                              </span>
                            ) : uploadStatus[file.id] === 'analyzing' ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-900/40 text-yellow-400">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Analyzing
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Button */}
                        <div className="flex-shrink-0">
                          {uploadStatus[file.id] === 'pending' ? (
                            <button
                              onClick={() => removeFile(file.id)}
                              className="p-1 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                              title="Remove file"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                      </div>
                      
                      {/* Results Summary (for success) */}
                      {uploadStatus[file.id] === 'success' && result && (
                        <div className="flex-shrink-0 flex flex-col sm:items-end gap-2 sm:min-w-32">
                          <div className={`px-3 py-1.5 rounded-lg ${
                            isAbnormal
                              ? 'bg-red-900/30 text-red-400 border border-red-800'
                              : 'bg-green-900/30 text-green-400 border border-green-800'
                          }`}>
                            <p className="text-sm font-medium flex items-center">
                              <Badge className="h-3.5 w-3.5 mr-1.5" />
                              {isChestXray
                                ? condition === 'pneumonia'
                                  ? 'Pneumonia Detected'
                                  : 'Normal'
                                : condition === 'tumor'
                                  ? 'Tumor Detected'
                                  : 'Normal'}
                            </p>
                          </div>
                          {result.confidence && (
                            <div className="bg-gray-700/50 px-3 py-1.5 rounded-lg border border-gray-700">
                              <p className="text-sm text-gray-300 flex items-center">
                                <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                                Confidence: {getConfidencePercentage(result)}
                              </p>
                            </div>
                          )}
                          
                          {/* View Report Button */}
                          <button 
                            onClick={() => openResultModal(file.id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 px-3 rounded-lg text-sm font-medium flex items-center"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1.5" />
                            View Report
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Upload and View Results Buttons */}
          <div className="flex flex-col space-y-4">
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || !patientId || !patientName}
              className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Upload className="h-5 w-5" />
              {scanType === 'chest' ? 'Upload & Analyze X-rays' : 'Upload Scans'}
            </button>
            
            {/* Show View Results button if any files have been processed */}
            {allFilesProcessed && (
              <button
                onClick={viewResults}
                className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 flex items-center justify-center gap-2"
              >
                <Eye className="h-5 w-5" />
                View All Results
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Modal for Detailed Result Display */}
      {showResultModal && selectedResult && selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-800 p-4">
              <h3 className="text-lg font-medium text-white flex items-center">
                <FileText className="h-5 w-5 mr-2 text-indigo-400" />
                Diagnostic Report
              </h3>
              <button
                onClick={closeResultModal}
                className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-4">
              <div className="flex flex-col space-y-6">
                {/* Top Section - Patient Info and Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Patient Info Card */}
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h4 className="font-medium text-indigo-300 mb-3 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Patient Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between border-b border-gray-700 pb-2">
                        <span className="text-gray-400">Name:</span>
                        <span className="text-white font-medium">{patientName}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-700 pb-2">
                        <span className="text-gray-400">ID:</span>
                        <span className="text-white">{patientId}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-700 pb-2">
                        <span className="text-gray-400">Scan Type:</span>
                        <span className="text-white capitalize">{scanType} Scan</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">File:</span>
                        <span className="text-white">{selectedFile.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Result Summary Card */}
                  <div className={`p-4 rounded-lg border ${
                    (selectedResult.condition === 'pneumonia' || selectedResult.hasTumor) 
                      ? 'bg-red-900/20 border-red-700' 
                      : 'bg-green-900/20 border-green-700'
                  }`}>
                    <h4 className={`font-medium mb-3 flex items-center ${
                      (selectedResult.condition === 'pneumonia' || selectedResult.hasTumor) 
                        ? 'text-red-300' 
                        : 'text-green-300'
                    }`}>
                      <Badge className="h-4 w-4 mr-2" />
                      Diagnostic Summary
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Finding:</span>
                        <span className={`font-bold ${
                          (selectedResult.condition === 'pneumonia' || selectedResult.hasTumor) 
                            ? 'text-red-400' 
                            : 'text-green-400'
                        }`}>
                          {scanType === 'chest' 
                            ? selectedResult.condition === 'pneumonia' ? 'Pneumonia' : 'Normal' 
                            : selectedResult.hasTumor ? 'Brain Tumor' : 'Normal'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Confidence:</span>
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-700 rounded-full h-2 mr-2">
                            <div className={`h-2 rounded-full ${
                              (selectedResult.condition === 'pneumonia' || selectedResult.hasTumor) 
                                ? 'bg-red-500' 
                                : 'bg-green-500'
                            }`} style={{ width: `${(selectedResult.confidence || 0.5) * 100}%` }}></div>
                          </div>
                          <span className="text-white font-medium">{getConfidencePercentage(selectedResult)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Date:</span>
                        <span className="text-white">
                          {selectedResult.reportDate 
                            ? new Date(selectedResult.reportDate).toLocaleString()
                            : new Date().toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Detailed Report */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-indigo-300 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Detailed Report
                    </h4>
                    <button 
                      onClick={downloadReport}
                      className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded text-white"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </button>
                  </div>
                  <div className="bg-gray-900 rounded p-4 text-gray-300 whitespace-pre-line font-mono text-xs overflow-auto max-h-80">
                    {selectedResult.report || 'No detailed report available.'}
                  </div>
                </div>
                
                {/* AI Analysis */}
                {selectedResult.explanation && (
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                    <h4 className="font-medium text-indigo-300 flex items-center mb-4">
                      <Brain className="h-4 w-4 mr-2" />
                      AI Analysis
                    </h4>
                    <div className="bg-gray-900 rounded p-4 text-gray-300 whitespace-pre-line text-sm">
                      {selectedResult.explanation}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="border-t border-gray-800 p-4 flex justify-end gap-3">
              <button
                onClick={downloadReport}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Report
              </button>
              <button
                onClick={closeResultModal}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}