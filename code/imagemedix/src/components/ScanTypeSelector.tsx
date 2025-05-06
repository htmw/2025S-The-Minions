import React from "react";
import { Brain, Heart } from "lucide-react";

interface ScanTypeSelectorProps {
  scanType: 'brain' | 'chest';
  onScanTypeChange: (type: 'brain' | 'chest') => void;
}

const ScanTypeSelector: React.FC<ScanTypeSelectorProps> = ({
  scanType,
  onScanTypeChange
}) => {
  return (
    <div className="flex gap-4">
      <button
        onClick={() => onScanTypeChange('brain')}
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
        onClick={() => onScanTypeChange('chest')}
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
  );
};

export default ScanTypeSelector;