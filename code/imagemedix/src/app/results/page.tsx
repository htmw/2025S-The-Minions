"use client";

import React, { useState, useEffect } from "react";
import { 
  Brain,
  FileImage,
  Loader2,
  AlertCircle,
  Download
} from "lucide-react";
import Link from "next/link";
import { scans, mlModel } from "@/services/api";

export default function ResultsPage() {
  const [scansList, setScansList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedScan, setSelectedScan] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState(null);

  useEffect(() => {
    fetchScans();
  }, []);

  const fetchScans = async () => {
    try {
      const response = await scans.getAll();
      setScansList(response.data);
      setLoading(false);
    } catch (error) {
      setError("Failed to fetch scans");
      setLoading(false);
    }
  };

  const handleAnalyze = async (scanId) => {
    try {
      setAnalysisStatus("processing");
      const response = await mlModel.analyzeScan(scanId);
      pollAnalysisStatus(response.data.jobId, scanId);
    } catch (error) {
      setError("Failed to start analysis");
      setAnalysisStatus(null);
    }
  };

  const pollAnalysisStatus = async (jobId, scanId) => {
    const interval = setInterval(async () => {
      try {
        const statusResponse = await mlModel.getAnalysisStatus(jobId);
        setAnalysisStatus(statusResponse.data.status);

        if (statusResponse.data.status === "completed") {
          clearInterval(interval);
          const resultsResponse = await mlModel.getAnalysisResults(scanId);
          setSelectedScan(resultsResponse.data);
        } else if (statusResponse.data.status === "failed") {
          clearInterval(interval);
          setError("Analysis failed");
          setAnalysisStatus(null);
        }
      } catch (error) {
        clearInterval(interval);
        setError("Failed to get analysis status");
        setAnalysisStatus(null);
      }
    }, 5000);
  };

  const handleGenerateReport = async (scanId) => {
    try {
      const response = await scans.generateReport(scanId);
      window.open(response.data.reportUrl, '_blank');
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
          <h1 className="text-2xl font-bold">Scan Results</h1>

          {error && (
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Scans List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scansList.map((scan) => (
              <div
                key={scan._id}
                className="bg-gray-800 rounded-lg p-4 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <FileImage className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-white">Scan ID: {scan._id}</p>
                    <p className="text-xs text-gray-400">
                      Patient ID: {scan.patientId}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-gray-400">
                    Status: {scan.status}
                  </p>
                  {scan.result && (
                    <>
                      <p className="text-sm text-gray-400">
                        Tumor Present: {scan.result.hasTumor ? "Yes" : "No"}
                      </p>
                      <p className="text-sm text-gray-400">
                        Confidence: {(scan.result.confidence * 100).toFixed(2)}%
                      </p>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  {!scan.result && (
                    <button
                      onClick={() => handleAnalyze(scan._id)}
                      disabled={analysisStatus === "processing"}
                      className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {analysisStatus === "processing" ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Analyzing...
                        </span>
                      ) : (
                        "Analyze"
                      )}
                    </button>
                  )}
                  {scan.result && (
                    <button
                      onClick={() => handleGenerateReport(scan._id)}
                      className="flex-1 py-2 px-4 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-600 flex items-center justify-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Generate Report
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}