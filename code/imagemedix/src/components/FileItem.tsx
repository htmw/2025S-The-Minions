import React from "react";
import {
  FileImage,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  Badge,
  BarChart3,
  X
} from "lucide-react";

interface FileItemProps {
  file: FileWithId;
  uploadStatus: 'pending' | 'uploading' | 'analyzing' | 'success' | 'error';
  scanType: 'brain' | 'chest';
  result: any;
  onRemove: (fileId: string) => void;
  onViewReport: (fileId: string) => void;
}

interface FileWithId extends File {
  id: string;
}

const FileItem: React.FC<FileItemProps> = ({
  file,
  uploadStatus,
  scanType,
  result,
  onRemove,
  onViewReport
}) => {
  const isChestXray = scanType === 'chest';
  // Properly determine condition based on scan type
  let condition = 'normal';
  if (result) {
    if (isChestXray) {
      condition = result.condition || 'normal';
    } else {
      condition = result.hasTumor ? 'tumor' : 'normal';
    }
  }
  const isAbnormal = isChestXray ? condition === 'pneumonia' : condition === 'tumor';
  
  const getConfidencePercentage = (result: any) => {
    if (!result || typeof result.confidence !== 'number') return null;
    return (result.confidence * 100).toFixed(1) + '%';
  };

  return (
    <div
      className={`bg-gray-800 rounded-lg overflow-hidden border ${
        uploadStatus === 'success'
          ? isAbnormal 
            ? 'border-red-700' 
            : 'border-green-700'
          : 'border-gray-700'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 p-4">
        <div className="flex items-start gap-3 flex-grow">
          <FileImage className="h-6 w-6 text-gray-400 flex-shrink-0 mt-1" />
          <div className="min-w-0 flex-grow">
            <p className="text-sm text-white font-medium truncate">{file.name}</p>
            <p className="text-xs text-gray-400">
              {(file.size / 1024 / 1024).toFixed(2)} MB • {scanType} scan
            </p>
            <div className="mt-2 flex items-center gap-2">
              {uploadStatus === 'success' ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/40 text-green-400">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Analysis Complete
                </span>
              ) : uploadStatus === 'error' ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900/40 text-red-400">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Error
                </span>
              ) : uploadStatus === 'uploading' ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/40 text-blue-400">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Uploading
                </span>
              ) : uploadStatus === 'analyzing' ? (
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
          
          <div className="flex-shrink-0">
            {uploadStatus === 'pending' ? (
              <button
                onClick={() => onRemove(file.id)}
                className="p-1 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                title="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
        
        {uploadStatus === 'success' && result && (
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
                    : 'Normal Lungs'
                  : condition === 'tumor'
                    ? 'Tumor Detected'
                    : 'Normal Brain'}
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
            
            <button 
              onClick={() => onViewReport(file.id)}
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
};

export default FileItem;