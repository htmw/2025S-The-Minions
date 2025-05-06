import React from "react";
import { CheckCircle, Eye } from "lucide-react";

interface SuccessMessageProps {
  scanType: 'brain' | 'chest';
  onViewResults: () => void;
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({
  scanType,
  onViewResults
}) => {
  return (
    <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 flex items-start">
      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
      <div className="ml-3">
        <h3 className="text-sm font-medium text-green-400">Upload Successful</h3>
        <p className="mt-1 text-sm text-gray-300">
          Your {scanType === 'brain' ? 'brain scan' : 'chest X-ray'} has been uploaded and analyzed successfully.
        </p>
        <div className="mt-3">
          <button
            onClick={onViewResults}
            className="text-sm font-medium text-green-400 hover:text-green-300 flex items-center gap-1"
          >
            <Eye className="h-4 w-4" />
            View all results
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessMessage;