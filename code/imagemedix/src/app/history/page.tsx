"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, Trash2, Upload, Download } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useUser } from '@clerk/nextjs';

// Interface for scan data
interface ScanResult {
  diagnosis?: string;
  confidence?: number;
  condition?: string;
  hasTumor?: boolean;
  report?: string;
  explanation?: string;
}

interface Scan {
  _id: string;
  patientId: string;
  patientName: string;
  type: string;
  status: string;
  createdAt: string;
  result?: ScanResult;
  scanType?: 'brain' | 'chest';
  userEmail?: string;
  imageUrl?: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const [scansList, setScansList] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);

  useEffect(() => {
    // Check auth status first
    if (isLoaded) {
      if (!isSignedIn || !user) {
        router.push('/auth/login');
        return;
      }
      // Then fetch scans from localStorage
      fetchScansFromLocalStorage();
    }
  }, [isLoaded, isSignedIn, router, user]);

  const fetchScansFromLocalStorage = () => {
    try {
      // Get user's email from Clerk
      const userEmail = user?.emailAddresses[0]?.emailAddress;
      
      if (!userEmail) {
        setError('Unable to identify user email');
        setLoading(false);
        return;
      }

      // Retrieve scans from localStorage
      const storedScans = localStorage.getItem('userScans');
      let allScans: Scan[] = [];
      
      if (storedScans) {
        try {
          allScans = JSON.parse(storedScans);
        } catch (e) {
          console.error('Error parsing stored scans:', e);
          allScans = [];
        }
      }
      
      // Filter scans for the current user
      const userScans = allScans.filter(scan => scan.userEmail === userEmail);
      setScansList(userScans);
      
    } catch (err) {
      console.error('Error fetching scans from localStorage:', err);
      setError('Failed to fetch your scan history');
      setScansList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (scanId: string) => {
    if (!confirm('Are you sure you want to delete this scan?')) {
      return;
    }

    try {
      // Get all scans from localStorage
      const storedScans = localStorage.getItem('userScans');
      
      if (storedScans) {
        let allScans: Scan[] = JSON.parse(storedScans);
        
        // Remove the scan with the given ID
        allScans = allScans.filter(scan => scan._id !== scanId);
        
        // Save the updated list back to localStorage
        localStorage.setItem('userScans', JSON.stringify(allScans));
        
        // Update the UI
        const userEmail = user?.emailAddresses[0]?.emailAddress;
        setScansList(allScans.filter(scan => scan.userEmail === userEmail));
      }
    } catch (err) {
      console.error('Error deleting scan:', err);
      setError('Failed to delete scan');
    }
  };

  // Open modal with selected scan
  const openScanDetails = (scan: Scan) => {
    setSelectedScan(scan);
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedScan(null);
  };

  // Download scan report
  const downloadReport = () => {
    if (!selectedScan || !selectedScan.result?.report) return;
    
    const blob = new Blob([selectedScan.result.report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedScan.patientId}-report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Helper function to get diagnosis text
  const getDiagnosis = (result?: ScanResult) => {
    if (!result) return "Unknown";
    
    return result.diagnosis || 
           (result.hasTumor ? 'Brain Tumor' : 'Normal Brain') || 
           (result.condition === 'pneumonia' ? 'Pneumonia' : 'Normal Lungs');
  };

  // Helper function to determine if result is abnormal
  const isAbnormal = (result?: ScanResult) => {
    if (!result) return false;
    return result.hasTumor || result.condition === 'pneumonia';
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Scan History</h1>
            <Link
              href="/upload"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
            >
              <Upload size={20} />
              <span>Upload New Scan</span>
            </Link>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : scansList.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No scans found</h3>
              <p className="text-gray-400 mb-6">Upload your first medical scan to get started</p>
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
              >
                <Upload size={20} />
                <span>Upload Scan</span>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6">
              {scansList.map((scan) => (
                <div
                  key={scan._id}
                  className="bg-gray-900 rounded-lg border border-gray-800 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">
                        Patient ID: {scan.patientId}
                      </h3>
                      <p className="text-sm text-gray-400 mb-4">
                        Uploaded on {formatDate(scan.createdAt)}
                      </p>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-400">
                          Type: {scan.scanType || scan.type}
                        </span>
                        <span className="text-sm text-gray-400">
                          Status: {scan.status}
                        </span>
                      </div>
                      {scan.result && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-400">
                            Diagnosis: {getDiagnosis(scan.result)}
                          </p>
                          <p className="text-sm text-gray-400">
                            Confidence: {(scan.result.confidence ? (scan.result.confidence * 100).toFixed(1) : 0)}%
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openScanDetails(scan)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                        title="View Scan Details"
                      >
                        <FileText size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(scan._id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                        title="Delete Scan"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Scan Details Modal */}
      {showModal && selectedScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-800 p-4">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-400" />
                Scan Result Details
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"
              >
                &times;
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <div className="flex flex-col space-y-6">
                {/* Patient Info and Diagnostic Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Patient Info */}
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h4 className="font-medium text-indigo-300 mb-3">Patient Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between border-b border-gray-700 pb-2">
                        <span className="text-gray-400">Patient ID:</span>
                        <span className="text-white font-medium">{selectedScan.patientId}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-700 pb-2">
                        <span className="text-gray-400">Patient Name:</span>
                        <span className="text-white">{selectedScan.patientName}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-700 pb-2">
                        <span className="text-gray-400">Scan Date:</span>
                        <span className="text-white">{formatDate(selectedScan.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Scan Type:</span>
                        <span className="text-white capitalize">{selectedScan.scanType || selectedScan.type}</span>
                      </div>
                    </div>
                  </div>

                  {/* Diagnostic Summary */}
                  {selectedScan.result && (
                    <div className={`p-4 rounded-lg border ${
                      isAbnormal(selectedScan.result)
                        ? 'bg-red-900/20 border-red-700' 
                        : 'bg-green-900/20 border-green-700'
                    }`}>
                      <h4 className={`font-medium mb-3 ${
                        isAbnormal(selectedScan.result)
                          ? 'text-red-300' 
                          : 'text-green-300'
                      }`}>Diagnostic Summary</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Finding:</span>
                          <span className={`font-bold ${
                            isAbnormal(selectedScan.result)
                              ? 'text-red-400' 
                              : 'text-green-400'
                          }`}>
                            {getDiagnosis(selectedScan.result)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Confidence:</span>
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-700 rounded-full h-2 mr-2">
                              <div className={`h-2 rounded-full ${
                                isAbnormal(selectedScan.result)
                                  ? 'bg-red-500' 
                                  : 'bg-green-500'
                              }`} style={{ width: `${(selectedScan.result.confidence || 0.5) * 100}%` }}></div>
                            </div>
                            <span className="text-white font-medium">{(selectedScan.result.confidence ? (selectedScan.result.confidence * 100).toFixed(1) : 0)}%</span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            selectedScan.status === 'completed' 
                              ? 'bg-green-900/40 text-green-400' 
                              : 'bg-gray-700 text-gray-300'
                          }`}>
                            {selectedScan.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Scan Image */}
                {selectedScan.imageUrl && (
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                    <h4 className="font-medium text-indigo-300 mb-4">Scan Image</h4>
                    <div className="bg-gray-900 rounded p-4 flex items-center justify-center">
                      <img 
                        src={selectedScan.imageUrl}
                        alt={`Medical scan for ${selectedScan.patientName}`}
                        className="max-h-96 object-contain rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-scan.jpg';
                        }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Detailed Report */}
                {selectedScan.result?.report && (
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-indigo-300">Detailed Report</h4>
                      <button 
                        onClick={downloadReport}
                        className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded text-white"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download Report
                      </button>
                    </div>
                    <div className="bg-gray-900 rounded p-4 text-gray-300 whitespace-pre-line font-mono text-xs overflow-auto max-h-80">
                      {selectedScan.result.report}
                    </div>
                  </div>
                )}
                
                {/* AI Analysis */}
                {selectedScan.result?.explanation && (
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                    <h4 className="font-medium text-indigo-300 mb-4">AI Analysis</h4>
                    <div className="bg-gray-900 rounded p-4 text-gray-300 whitespace-pre-line text-sm">
                      {selectedScan.result.explanation}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="border-t border-gray-800 p-4 flex justify-end gap-3">
              {selectedScan.result?.report && (
                <button
                  onClick={downloadReport}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Report
                </button>
              )}
              
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}