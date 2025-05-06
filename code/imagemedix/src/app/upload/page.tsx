"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Upload, AlertCircle, Eye } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

import Sidebar from '@/components/Sidebar';
import FileDropzone from '@/components/FileDropzone';
import FileItem from '@/components/FileItem';
import PatientInfoForm from '@/components/PatientInfoForm';
import ScanTypeSelector from '@/components/ScanTypeSelector';
import SuccessMessage from '@/components/SuccessMessage';
import ResultModal from '@/components/ResultModal';

import { FileWithId, addIdToFiles } from '../utils/idUtils';
import { processChestXray, processBrainScan } from '../utils/scanProcessor';

export default function UploadPage() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  
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

  // Authentication check
  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        router.push('/auth/login');
        return;
      }
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, router]);

  // Show success message when processing is complete
  useEffect(() => {
    if (processingComplete && files.every(file => uploadStatus[file.id] === 'success')) {
      setShowSuccessMessage(true);
      
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [processingComplete, files, uploadStatus]);

  // Handle dropped files
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type === 'application/dicom';
      if (!isValidType) {
        setError(`File ${file.name} is not a supported image format`);
        return false;
      }
      return true;
    });

    const filesWithId = addIdToFiles(validFiles);
    setFiles(prev => [...prev, ...filesWithId]);
    
    filesWithId.forEach(file => {
      setUploadStatus(prev => ({ ...prev, [file.id]: 'pending' }));
    });
    
    setProcessingComplete(false);
    setShowSuccessMessage(false);
  }, []);

  // Handle upload button click
  const handleUpload = async () => {
    if (!patientId) {
      setError('Please enter a patient ID');
      return;
    }

    if (!patientName) {
      setError('Please enter a patient name');
      return;
    }

    if (!user) {
      setError('User not authenticated');
      return;
    }

    const userEmail = user.emailAddresses[0]?.emailAddress;
    if (!userEmail) {
      setError('Unable to identify user email');
      return;
    }

    setError('');
    setProcessingComplete(false);
    setShowSuccessMessage(false);
    
    let filesToProcess = files.filter(file => uploadStatus[file.id] === 'pending').length;
    
    if (filesToProcess === 0) {
      router.push('/history');
      return;
    }
    
    for (const file of files) {
      if (uploadStatus[file.id] === 'pending') {
        try {
          if (scanType === 'chest') {
            await processChestXray(file, patientId, patientName, userEmail, {
              onUploadStatusChange: (fileId, status) => {
                setUploadStatus(prev => ({ ...prev, [fileId]: status }));
              },
              onAnalysisResultsUpdate: (fileId, results) => {
                setAnalysisResults(prev => ({ ...prev, [fileId]: results }));
              },
              onScanIdUpdate: (scanId) => {
                setUploadedScanIds(prev => [...prev, scanId]);
              },
              onError: (message) => {
                setError(message);
              },
              onProcessingComplete: () => {
                setProcessingComplete(true);
              }
            });
          } else {
            await processBrainScan(file, patientId, patientName, userEmail, {
              onUploadStatusChange: (fileId, status) => {
                setUploadStatus(prev => ({ ...prev, [fileId]: status }));
              },
              onAnalysisResultsUpdate: (fileId, results) => {
                setAnalysisResults(prev => ({ ...prev, [fileId]: results }));
              },
              onScanIdUpdate: (scanId) => {
                setUploadedScanIds(prev => [...prev, scanId]);
              },
              onError: (message) => {
                setError(message);
              },
              onProcessingComplete: () => {
                setProcessingComplete(true);
              }
            });
          }
        } catch (err: any) {
          console.error('Error processing file:', err);
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

  // Navigate to results page
  const viewResults = () => {
    router.push('/history');
  };

  // Remove a file from the list
  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
    setUploadStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[fileId];
      return newStatus;
    });
    setAnalysisResults(prev => {
      const newResults = { ...prev };
      delete newResults[fileId];
      return newResults;
    });
  };

  // Check if all files are processed
  const allFilesProcessed = files.length > 0 && 
    files.every(file => uploadStatus[file.id] === 'success' || uploadStatus[file.id] === 'error');

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Sidebar />

      <main className="ml-64 p-8">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Upload Medical Scans</h1>
          
          {showSuccessMessage && (
            <SuccessMessage 
              scanType={scanType}
              onViewResults={viewResults}
            />
          )}

          <ScanTypeSelector 
            scanType={scanType}
            onScanTypeChange={setScanType}
          />

          <PatientInfoForm
            patientId={patientId}
            patientName={patientName}
            onPatientIdChange={setPatientId}
            onPatientNameChange={setPatientName}
          />

          <FileDropzone 
            onDrop={onDrop}
            scanType={scanType}
          />

          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-900/20 p-3 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {files.length > 0 && (
            <div className="space-y-4">
              {files.map((file) => (
                <FileItem
                  key={file.id}
                  file={file}
                  uploadStatus={uploadStatus[file.id]}
                  scanType={scanType}
                  result={analysisResults[file.id]}
                  onRemove={removeFile}
                  onViewReport={openResultModal}
                />
              ))}
            </div>
          )}

          <div className="flex flex-col space-y-4">
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || !patientId || !patientName}
              className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Upload className="h-5 w-5" />
              {scanType === 'chest' ? 'Upload & Analyze X-rays' : 'Upload Scans'}
            </button>
            
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

      {showResultModal && (
        <ResultModal
          selectedFile={selectedFile}
          selectedResult={selectedResult}
          patientName={patientName}
          patientId={patientId}
          scanType={scanType}
          onClose={closeResultModal}
          onDownloadReport={downloadReport}
        />
      )}
    </div>
  );
}