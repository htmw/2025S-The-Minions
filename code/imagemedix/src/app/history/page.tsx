"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, Trash2, Upload } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useUser } from '@clerk/nextjs';

// Interface for scan data
interface Scan {
  _id: string;
  patientId: string;
  patientName: string;
  type: string;
  status: string;
  createdAt: string;
  result?: {
    diagnosis: string;
    confidence: number;
    condition?: string;
    hasTumor?: boolean;
  };
  scanType?: 'brain' | 'chest';
  userEmail?: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const [scansList, setScansList] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
                            Diagnosis: {scan.result.diagnosis || (scan.result.hasTumor ? 'Brain Tumor' : 'Normal Brain') || 
                                        (scan.result.condition === 'pneumonia' ? 'Pneumonia' : 'Normal Lungs')}
                          </p>
                          <p className="text-sm text-gray-400">
                            Confidence: {(scan.result.confidence * 100).toFixed(1)}%
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/results/${scan._id}`}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <FileText size={20} />
                      </Link>
                      <button
                        onClick={() => handleDelete(scan._id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
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
    </div>
  );
}