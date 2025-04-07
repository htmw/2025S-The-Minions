"use client";

import React, { useState, useCallback, useEffect } from "react";
import { 
  Upload,
  Brain,
  X,
  AlertCircle,
  FileImage,
  CheckCircle,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import { scans, mlModel } from "@/services/api";
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: 'pending' | 'uploading' | 'analyzing' | 'success' | 'error' }>({});
  const [error, setError] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [analysisResults, setAnalysisResults] = useState<{ [key: string]: any }>({});

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type === 'application/dicom';
      if (!isValidType) {
        setError(`File ${file.name} is not a supported image format`);
        return false;
      }
      return true;
    });

    setFiles(prev => [...prev, ...validFiles]);
    validFiles.forEach(file => {
      setUploadStatus(prev => ({ ...prev, [file.name]: 'pending' }));
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

  const checkAnalysisStatus = async (scanId: string, fileName: string) => {
    try {
      const { data: statusData } = await mlModel.getAnalysisStatus(scanId);
      
      if (statusData.status === 'completed') {
        const { data: results } = await mlModel.getAnalysisResults(scanId);
        setAnalysisResults(prev => ({ ...prev, [fileName]: results }));
        setUploadStatus(prev => ({ ...prev, [fileName]: 'success' }));
        
        // Navigate to results page if analysis was successful
        router.push(`/results/${scanId}`);
      } else if (statusData.status === 'failed' || (statusData.jobStatus?.state === 'failed')) {
        setUploadStatus(prev => ({ ...prev, [fileName]: 'error' }));
        setError(`Analysis failed for ${fileName}: ${statusData.jobStatus?.failedReason || 'Unknown error'}`);
      } else if (statusData.status === 'processing' || statusData.jobStatus?.state === 'active') {
        setUploadStatus(prev => ({ ...prev, [fileName]: 'analyzing' }));
        // Still processing, check again in 5 seconds
        setTimeout(() => checkAnalysisStatus(scanId, fileName), 5000);
      } else {
        // Waiting in queue
        setUploadStatus(prev => ({ ...prev, [fileName]: 'analyzing' }));
        setTimeout(() => checkAnalysisStatus(scanId, fileName), 5000);
      }
    } catch (error: any) {
      setUploadStatus(prev => ({ ...prev, [fileName]: 'error' }));
      setError(error.response?.data?.message || `Failed to get analysis status for ${fileName}`);
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
      if (uploadStatus[file.name] === 'pending') {
        setUploadStatus(prev => ({ ...prev, [file.name]: 'uploading' }));

        try {
          const formData = new FormData();
          formData.append('image', file);
          formData.append('patientId', patientId);
          formData.append('patientName', patientName);
          
          const response = await scans.upload(formData);
          setUploadStatus(prev => ({ ...prev, [file.name]: 'analyzing' }));
          
          // Start checking analysis status
          if (response.data._id) {
            checkAnalysisStatus(response.data._id, file.name);
          }
        } catch (err: any) {
          setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }));
          setError(err.response?.data?.message || `Failed to upload ${file.name}`);
        }
      }
    }
  };

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(file => file.name !== fileName));
    setUploadStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[fileName];
      return newStatus;
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
              Drag and drop your MRI scans here, or click to select files
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

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileImage className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-white">{file.name}</p>
                      <p className="text-xs text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      {analysisResults[file.name] && (
                        <p className="text-xs text-green-400 mt-1">
                          Analysis complete: {analysisResults[file.name].diagnosis}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {uploadStatus[file.name] === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : uploadStatus[file.name] === 'error' ? (
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    ) : uploadStatus[file.name] === 'uploading' || uploadStatus[file.name] === 'analyzing' ? (
                      <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
                    ) : (
                      <button
                        onClick={() => removeFile(file.name)}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
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
            Upload Scans
          </button>
        </div>
      </main>
    </div>
  );
}