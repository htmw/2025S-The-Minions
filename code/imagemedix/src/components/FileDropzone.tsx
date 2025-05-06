import React from "react";
import { Upload } from "lucide-react";
import { useDropzone } from "react-dropzone";

interface FileDropzoneProps {
  onDrop: (acceptedFiles: File[]) => void;
  scanType: 'brain' | 'chest';
}

const FileDropzone: React.FC<FileDropzoneProps> = ({ onDrop, scanType }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/dicom': ['.dcm']
    },
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  return (
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
  );
};

export default FileDropzone;