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
  ChevronUp
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
        
        // Redirect to results page with the new scan ID
        if (uploadResponse.data._id) {
          router.push(`/results/${uploadResponse.data._id}`);
        } else {
          // If no ID was returned, redirect to main results page
          router.push('/results');
        }
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
        
        // Redirect to results page when analysis is complete
        router.push(`/results/${scanId}`);
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
    
    for (const file of files) {
      if (uploadStatus[file.id] === 'pending') {
        setUploadStatus(prev => ({ ...prev, [file.id]: 'uploading' }));

        try {
          if (scanType === 'chest') {
            // Process chest X-ray using Gemini API via Next.js API route
            await processChestXray(file);
            // The redirect will happen in the processChestXray function
          } else {
            // Regular flow for brain scans using backend processing
            const formData = new FormData();
            formData.append('image', file);
            formData.append('patientId', patientId);
            formData.append('patientName', patientName);
            formData.append('scanType', 'brain');
            
            const response = await scans.upload(formData);
            setUploadStatus(prev => ({ ...prev, [file.id]: 'analyzing' }));
            
            // Start checking analysis status
            if (response.data._id) {
              checkAnalysisStatus(response.data._id, file.id);
              // The redirect will happen in the checkAnalysisStatus function
            }
          }
        } catch (err: any) {
          setUploadStatus(prev => ({ ...prev, [file.id]: 'error' }));
          setError(err.response?.data?.message || `Failed to upload ${file.name}`);
        }
      }
    }
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
              <Link href="/upload" className="text-sm hover:text-white transition-colors">Upload</Link>
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
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* File List with Enhanced Results Display */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="bg-gray-800 rounded-lg overflow-hidden"
                >
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <FileImage className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-white">{file.name}</p>
                        <p className="text-xs text-gray-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        {analysisResults[file.id] && scanType === 'chest' && (
                          <p className="text-xs mt-1" style={{ 
                            color: analysisResults[file.id].condition === 'pneumonia' ? '#f87171' : '#4ade80'
                          }}>
                            {analysisResults[file.id].condition === 'pneumonia' 
                              ? `Pneumonia detected (${(analysisResults[file.id].confidence * 100).toFixed(2)}%)` 
                              : `Normal (${(analysisResults[file.id].confidence * 100).toFixed(2)}%)`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {uploadStatus[file.id] === 'success' && analysisResults[file.id]?.explanation && (
                        <button
                          onClick={() => toggleExplanation(file.id)}
                          className="mr-2 text-gray-400 hover:text-white"
                        >
                          {expandedExplanations[file.id] ? 
                            <ChevronUp className="h-5 w-5" /> : 
                            <ChevronDown className="h-5 w-5" />
                          }
                        </button>
                      )}
                      {uploadStatus[file.id] === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      ) : uploadStatus[file.id] === 'error' ? (
                        <AlertCircle className="h-5 w-5 text-red-400" />
                      ) : uploadStatus[file.id] === 'uploading' || uploadStatus[file.id] === 'analyzing' ? (
                        <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
                      ) : (
                        <button
                          onClick={() => removeFile(file.id)}
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Expanded AI Explanation */}
                  {analysisResults[file.id]?.explanation && expandedExplanations[file.id] && (
                    <div className="px-4 pb-4 pt-2 border-t border-gray-700">
                      <h4 className="text-xs font-medium text-gray-300 mb-2">AI Analysis</h4>
                      <p className="text-xs text-gray-400 whitespace-pre-line">
                        {analysisResults[file.id].explanation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || !patientId || !patientName}
            className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {scanType === 'chest' ? 'Upload & Analyze X-rays' : 'Upload Scans'}
          </button>
        </div>
      </main>
    </div>
  );
}