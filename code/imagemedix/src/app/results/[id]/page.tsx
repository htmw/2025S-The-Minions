"use client";

import React, { useState, useEffect } from "react";
import {
  Brain,
  FileImage,
  Loader2,
  AlertCircle,
  Download,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { scans } from "@/services/api";
import { useParams, useRouter } from "next/navigation";

export default function ScanResultPage() {
  const params = useParams();
  const router = useRouter();
  const scanId = params.id as string;

  const [scan, setScan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (scanId) {
      fetchScan();
    }
  }, [scanId]);

  const fetchScan = async () => {
    try {
      setLoading(true);
      const response = await scans.getById(scanId);
      setScan(response.data);
      setLoading(false);
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to fetch scan details");
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const response = await scans.generateReport(scanId);
      // Construct the full URL to the report
      const reportUrl = `http://localhost:8080${response.data.reportUrl}`;
      window.open(reportUrl, '_blank');
    } catch (error) {
      setError("Failed to generate report");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

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
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold">Scan Result Details</h1>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {scan && (
            <div className="bg-gray-800 rounded-lg p-6 space-y-6">
              {/* Scan Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <FileImage className="h-6 w-6 text-indigo-400" />
                  <div>
                    <h2 className="text-lg font-semibold">Scan Information</h2>
                    <p className="text-sm text-gray-400">ID: {scan._id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Patient ID</p>
                    <p className="text-base">{scan.patientId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Patient Name</p>
                    <p className="text-base">{scan.patientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Scan Date</p>
                    <p className="text-base">{new Date(scan.scanDate).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Status</p>
                    <p className="text-base">{scan.status}</p>
                  </div>
                </div>
              </div>

              {/* Scan Image */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Scan Image</h3>
                <div className="bg-gray-900 rounded-lg p-4 flex items-center justify-center">
                  <img
                    src={scan.imageUrl}
                    alt="Brain MRI Scan"
                    className="max-h-96 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/placeholder-scan.jpg';
                    }}
                  />
                </div>
              </div>

              {/* Analysis Results */}
              {scan.result && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Analysis Results</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-sm text-gray-300">Tumor Present</p>
                      <p className="text-xl font-semibold">
                        {scan.result.hasTumor ? "Yes" : "No"}
                      </p>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-sm text-gray-300">Confidence</p>
                      <p className="text-xl font-semibold">
                        {(scan.result.confidence * 100).toFixed(2)}%
                      </p>
                    </div>

                    {scan.result.tumorType && (
                      <div className="bg-gray-700 rounded-lg p-4">
                        <p className="text-sm text-gray-300">Tumor Type</p>
                        <p className="text-xl font-semibold">
                          {scan.result.tumorType}
                        </p>
                      </div>
                    )}

                    {scan.result.tumorLocation && (
                      <div className="bg-gray-700 rounded-lg p-4">
                        <p className="text-sm text-gray-300">Tumor Location</p>
                        <p className="text-xl font-semibold">
                          {scan.result.tumorLocation}
                        </p>
                      </div>
                    )}
                  </div>

                  {scan.result.additionalNotes && (
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-sm text-gray-300">Additional Notes</p>
                      <p className="mt-2">{scan.result.additionalNotes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={handleGenerateReport}
                  className="py-3 px-6 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Download className="h-5 w-5" />
                  Generate Report
                </button>

                <Link
                  href="/upload"
                  className="py-3 px-6 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600"
                >
                  Upload Another Scan
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
