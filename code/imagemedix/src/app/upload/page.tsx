"use client";

import React, { useState, useCallback, useEffect } from "react";
import { 
  Upload,
  Brain,
  X,
  AlertCircle,
  FileImage,
  CheckCircle,
  Loader2,
  Heart,
  ChevronDown,
  ChevronUp,
  Eye,
  Badge,
  BarChart3,
  FileText
} from "lucide-react";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import { scans, mlModel } from "@/services/api";
import { useRouter } from 'next/navigation';

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
  const [files, setFiles] = useState<FileWithId[]>([]);
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: 'pending' | 'uploading' | 'analyzing' | 'success' | 'error' }>({});
  const [error, setError] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [analysisResults, setAnalysisResults] = useState<{ [key: string]: any }>({});
  const [scanType, setScanType] = useState<'brain' | 'chest'>('brain');
  const [expandedExplanations, setExpandedExplanations] = useState<{ [key: string]: boolean }>({});
  const [processingComplete, setProcessingComplete] = useState(false);
  const [uploadedScanIds, setUploadedScanIds] = useState<string[]>([]); // Store IDs of uploaded scans
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

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

  const toggleExplanation = (fileId: string) => {
    setExpandedExplanations(prev => ({
      ...prev,
      [fileId]: !prev[fileId]
    }));
  };

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
      
      // Save results
      const result = {
        condition,
        confidence,
        normalScore,
        pneumoniaScore,
        explanation,
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
        additionalNotes: explanation.slice(0, 1000) // Limit length for database storage
      }));
      
      try {
        const uploadResponse = await scans.upload(formData);
        console.log('Scan uploaded to backend:', uploadResponse.data);
        
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
        setAnalysisResults(prev => ({ ...prev, [fileId]: results }));
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
    // Clean up expanded state
    setExpandedExplanations(prev => {
      const newState = { ...prev };
      delete newState[fileId];
      return newState;
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

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-900 bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <nav className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded bg-indigo-600 flex items-center justify-center text-white">
                <Brain size={20} />
              </div>
              <span className="text-xl font-bold">
                <span className="text-indigo-500">Image</span>Medix
              </span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8 text-gray-400">
              <Link href="/home" className="text-sm hover:text-white transition-colors">Home</Link>
              <Link href="/upload" className="text-sm hover:text-white transition-colors text-white">Upload</Link>
              <Link href="/results" className="text-sm hover:text-white transition-colors">Results</Link>
              <Link href="/about" className="text-sm hover:text-white transition-colors">About</Link>
            </div>
            
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="rounded-full bg-gray-800 text-white px-4 py-2 text-sm font-medium hover:bg-gray-700 transition-all"
              >
                Profile
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-6">
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
                const condition = isChestXray && result ? result.condition : null;
                const isAbnormal = isChestXray ? condition === 'pneumonia' : false;
                
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
                          ) : uploadStatus[file.id] === 'success' && result?.explanation ? (
                            <button
                              onClick={() => toggleExplanation(file.id)}
                              className="p-1 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                              title={expandedExplanations[file.id] ? "Hide details" : "Show details"}
                            >
                              {expandedExplanations[file.id] ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
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
                                : result.hasTumor
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
                        </div>
                      )}
                    </div>
                    
                    {/* Expanded AI Explanation */}
                    {result?.explanation && expandedExplanations[file.id] && (
                      <div className="px-4 pb-4 pt-2 border-t border-gray-700 bg-gray-800/50">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <h4 className="text-sm font-medium text-gray-300">AI Analysis</h4>
                        </div>
                        <div className="bg-gray-900 rounded-lg p-3 text-xs text-gray-300 whitespace-pre-line">
                          {result.explanation}
                        </div>
                      </div>
                    )}
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
    </div>
  );
}