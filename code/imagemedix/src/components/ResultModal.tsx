import React from "react";
import {
  FileText,
  XCircle,
  User,
  Badge,
  Brain,
  Download
} from "lucide-react";

interface ResultModalProps {
  selectedFile: FileWithId | null;
  selectedResult: any;
  patientName: string;
  patientId: string;
  scanType: 'brain' | 'chest';
  onClose: () => void;
  onDownloadReport: () => void;
}

interface FileWithId extends File {
  id: string;
}

const ResultModal: React.FC<ResultModalProps> = ({
  selectedFile,
  selectedResult,
  patientName,
  patientId,
  scanType,
  onClose,
  onDownloadReport
}) => {
  if (!selectedFile || !selectedResult) return null;

  const getConfidencePercentage = (result: any) => {
    if (!result || typeof result.confidence !== 'number') return null;
    return (result.confidence * 100).toFixed(1) + '%';
  };

  const isAbnormal = scanType === 'chest' 
    ? selectedResult.condition === 'pneumonia' 
    : selectedResult.hasTumor;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-800 p-4">
          <h3 className="text-lg font-medium text-white flex items-center">
            <FileText className="h-5 w-5 mr-2 text-indigo-400" />
            Diagnostic Report
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          <div className="flex flex-col space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              <div className={`p-4 rounded-lg border ${
                isAbnormal
                  ? 'bg-red-900/20 border-red-700' 
                  : 'bg-green-900/20 border-green-700'
              }`}>
                <h4 className={`font-medium mb-3 flex items-center ${
                  isAbnormal
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
                      isAbnormal
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
                          isAbnormal
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
            
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-indigo-300 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Detailed Report
                </h4>
                <button 
                  onClick={onDownloadReport}
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
        
        <div className="border-t border-gray-800 p-4 flex justify-end gap-3">
          <button
            onClick={onDownloadReport}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Report
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;