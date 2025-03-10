"use client";

import React, { useState, useCallback } from "react";
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

export default function UploadPage() {
  const [files, setFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState("idle"); // idle, uploading, success, error
  const [errorMessage, setErrorMessage] = useState("");

  const onDrop = useCallback((acceptedFiles) => {
    // Filter for image files
    const imageFiles = acceptedFiles.filter(file => 
      file.type.startsWith('image/') || 
      file.type === 'application/dicom'
    );
    
    if (imageFiles.length < acceptedFiles.length) {
      setErrorMessage("Some files were rejected. Please upload only medical images.");
    }

    setFiles(prev => [...prev, ...imageFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      progress: 0,
      status: 'queued'
    }))]);
    setErrorMessage("");
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/dicom': ['.dcm', '.dicom']
    }
  });

  const removeFile = (fileId) => {
    setFiles(files.filter(f => f.id !== fileId));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setErrorMessage("Please select files to upload");
      return;
    }

    setUploadStatus("uploading");
    setErrorMessage("");

    // Simulate upload process
    try {
      // In a real application, you would send files to your server here
      await new Promise(resolve => setTimeout(resolve, 2000));
      setUploadStatus("success");
    } catch (error) {
      setUploadStatus("error");
      setErrorMessage("An error occurred during upload. Please try again.");
    }
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

      <main className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Upload Medical Images</h1>
          </div>

          {/* Upload Area */}
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700 hover:border-gray-600'}
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-indigo-600/20 flex items-center justify-center">
                <Upload size={24} className="text-indigo-400" />
              </div>
              <div>
                <p className="text-xl font-medium mb-2">
                  {isDragActive ? 'Drop your files here' : 'Drag & drop your files here'}
                </p>
                <p className="text-gray-400">
                  or click to browse from your computer
                </p>
              </div>
              <p className="text-sm text-gray-500">
                Supported formats: JPEG, PNG, DICOM
              </p>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400">
              <AlertCircle size={16} />
              <p>{errorMessage}</p>
            </div>
          )}

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Selected Files</h2>
              <div className="space-y-3">
                {files.map((file) => (
                  <div 
                    key={file.id}
                    className="bg-gray-900 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-indigo-600/20 flex items-center justify-center">
                        <FileImage size={20} className="text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-medium">{file.file.name}</p>
                        <p className="text-sm text-gray-400">
                          {(file.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFile(file.id)}
                      className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors"
                    >
                      <X size={14} className="text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Button */}
          {files.length > 0 && (
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleUpload}
                disabled={uploadStatus === "uploading"}
                className={`rounded-full px-6 py-3 font-medium flex items-center gap-2
                  ${uploadStatus === "uploading" 
                    ? 'bg-indigo-600/50 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-500'
                  }
                `}
              >
                {uploadStatus === "uploading" ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Uploading...
                  </>
                ) : uploadStatus === "success" ? (
                  <>
                    <CheckCircle size={18} />
                    Upload Complete
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Upload Files
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}