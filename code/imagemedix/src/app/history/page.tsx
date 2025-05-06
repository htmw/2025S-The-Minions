"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { scans } from '@/services/api';
import { FileText, Trash2, Upload } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useUser } from '@clerk/nextjs';

export default function HistoryPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const [scansList, setScansList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check auth status first
    if (isLoaded) {
      if (!isSignedIn) {
        router.push('/auth/login');
        return;
      }
      // Then fetch scans
      fetchScans();
    }
  }, [isLoaded, isSignedIn, router]);

  const fetchScans = async () => {
    try {
      const response = await scans.getAll();
      
      // Debug: Log the API response to see its structure
      console.log('API response:', response);

      // Make sure we're setting an array to scansList
      if (response && response.data) {
        // Handle different API response formats
        if (Array.isArray(response.data)) {
          setScansList(response.data);
        } else if (response.data.scans && Array.isArray(response.data.scans)) {
          setScansList(response.data.scans);
        } else if (response.data.items && Array.isArray(response.data.items)) {
          setScansList(response.data.items);
        } else if (response.data.results && Array.isArray(response.data.results)) {
          setScansList(response.data.results);
        } else {
          // If we can't find an array in the response, set an empty array
          console.error('Unexpected API response format:', response.data);
          setScansList([]);
        }
      } else {
        setScansList([]);
      }
    } catch (err) {
      console.error('Error fetching scans:', err);
      setError(err.response?.data?.message || 'Failed to fetch scans');
      setScansList([]); // Ensure scansList is an array even on error
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (scanId) => {
    if (!confirm('Are you sure you want to delete this scan?')) {
      return;
    }

    try {
      await scans.delete(scanId);
      setScansList(prev => prev.filter(scan => scan._id !== scanId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete scan');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
              {Array.isArray(scansList) && scansList.map((scan) => (
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
                          Type: {scan.type}
                        </span>
                        <span className="text-sm text-gray-400">
                          Status: {scan.status}
                        </span>
                      </div>
                      {scan.result && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-400">
                            Diagnosis: {scan.result.diagnosis}
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