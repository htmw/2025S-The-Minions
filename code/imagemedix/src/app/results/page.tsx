"use client";

import React, { useState, useEffect } from "react";
import { 
  Brain,
  FileImage,
  Loader2,
  AlertCircle,
  Download,
  RefreshCcw,
  ChevronRight,
  ImageIcon,
  Upload
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { scans, mlModel } from "@/services/api";

export default function ResultsPage() {
  const router = useRouter();
  const [scansList, setScansList] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedScan, setSelectedScan] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState<{[key: string]: string | null}>({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Fetch scans immediately when component mounts
    fetchScans();
    
    // Set up automatic refresh
    const refreshInterval = setInterval(() => {
      if (!refreshing) {
        fetchScans(false); // Silent refresh without loading indicator
      }
    }, 10000); // Check every 10 seconds for updates
    
    return () => clearInterval(refreshInterval);
  }, []);

  const fetchScans = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      const response = await scans.getAll();
      
      // Log raw API response to help debug
      console.log("API Raw Response:", response);
      
      let extractedScans: any[] = [];
      
      // Handle different API response formats
      if (Array.isArray(response.data)) {
        extractedScans = response.data;
      } else if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data.scans)) {
          extractedScans = response.data.scans;
        } else if (Array.isArray(response.data.items)) {
          extractedScans = response.data.items;
        } else if (Array.isArray(response.data.results)) {
          extractedScans = response.data.results;
        } else if (response.data._id) {
          // Single scan object
          extractedScans = [response.data];
        } else {
          // Try to extract array from any property that is an array
          for (const key in response.data) {
            if (Array.isArray(response.data[key]) && response.data[key].length > 0) {
              extractedScans = response.data[key];
              break;
            }
          }
        }
      }
      
      console.log("Extracted scans:", extractedScans);
      
      if (extractedScans.length > 0) {
        setScansList(extractedScans);
      } else {
        console.warn("No scans found in API response");
      }
      
      if (showLoading) setLoading(false);
    } catch (error) {
      console.error("Error fetching scans:", error);
      if (showLoading) {
        setError("Failed to fetch scans. Please try refreshing the page.");
        setLoading(false);
      }
    }
  };

  const refreshScans = async () => {
    try {
      setRefreshing(true);
      setError("");
      await fetchScans(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Error refreshing scans:", error);
      setError("Failed to refresh scans");
      setRefreshing(false);
    }
  };

  const handleAnalyze = async (scanId: string) => {
    try {
      setAnalysisStatus(prev => ({ ...prev, [scanId]: "processing" }));
      const response = await mlModel.analyzeScan(scanId);
      
      console.log("Analysis started:", response);
      
      if (response.data && response.data.jobId) {
        pollAnalysisStatus(response.data.jobId, scanId);
      } else {
        console.error("No job ID returned from analysis start:", response);
        setError("Failed to start analysis: No job ID returned");
        setAnalysisStatus(prev => ({ ...prev, [scanId]: "failed" }));
      }
    } catch (error) {
      console.error("Error starting analysis:", error);
      setError("Failed to start analysis");
      setAnalysisStatus(prev => ({ ...prev, [scanId]: null }));
    }
  };

  const pollAnalysisStatus = async (jobId: string, scanId: string) => {
    const interval = setInterval(async () => {
      try {
        const statusResponse = await mlModel.getAnalysisStatus(jobId);
        console.log("Status response:", statusResponse);
        
        setAnalysisStatus(prev => ({ ...prev, [scanId]: statusResponse.data.status }));

        if (statusResponse.data.status === "completed") {
          clearInterval(interval);
          const resultsResponse = await mlModel.getAnalysisResults(scanId);
          setSelectedScan(resultsResponse.data);
          // Refresh the scans list to show updated status
          fetchScans(false);
        } else if (statusResponse.data.status === "failed" || (statusResponse.data.jobStatus?.state === "failed")) {
          clearInterval(interval);
          setError(`Analysis failed for scan ID: ${scanId}`);
          setAnalysisStatus(prev => ({ ...prev, [scanId]: "failed" }));
        }
      } catch (error) {
        console.error("Error polling status:", error);
        clearInterval(interval);
        setError("Failed to get analysis status");
        setAnalysisStatus(prev => ({ ...prev, [scanId]: "failed" }));
      }
    }, 5000);
  };

  const handleGenerateReport = async (scanId: string) => {
    try {
      const response = await scans.generateReport(scanId);
      
      // Check if we have a valid URL
      if (response.data && response.data.reportUrl) {
        window.open(response.data.reportUrl, '_blank');
      } else {
        setError("Report URL not available");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      setError("Failed to generate report");
    }
  };

  const viewScanDetails = (scanId: string) => {
    router.push(`/results/${scanId}`);
  };

  // Helper function to safely get result data
  const getScanResult = (scan: any) => {
    if (!scan) return null;
    
    // Try different possible result locations based on API response format
    if (scan.result) return scan.result;
    if (scan.analysis) return scan.analysis;
    if (scan.results) return scan.results;
    
    return null;
  };

  // Helper function to check if a scan has a tumor/abnormality
  const hasTumorOrAbnormality = (scan: any) => {
    const result = getScanResult(scan);
    if (!result) return false;
    
    // Check different possible fields for abnormality indicator
    if (typeof result.hasTumor === 'boolean') return result.hasTumor;
    if (typeof result.hasAbnormality === 'boolean') return result.hasAbnormality;
    if (typeof result.isPneumonia === 'boolean') return result.isPneumonia;
    if (result.condition === 'pneumonia') return true;
    if (result.tumorType && result.tumorType !== 'Normal') return true;
    
    return false;
  };

  // Helper function to get confidence value
  const getConfidence = (scan: any) => {
    const result = getScanResult(scan);
    if (!result) return null;
    
    if (typeof result.confidence === 'number') return result.confidence;
    if (typeof result.probability === 'number') return result.probability;
    if (typeof result.score === 'number') return result.score;
    
    return null;
  };

  // Helper function to get condition/tumor type
  const getConditionType = (scan: any) => {
    const result = getScanResult(scan);
    if (!result) return null;
    
    if (result.tumorType) return result.tumorType;
    if (result.condition) return result.condition;
    if (result.diagnosis) return result.diagnosis;
    
    const abnormal = hasTumorOrAbnormality(scan);
    if (scan.scanType === 'chest' && abnormal) return 'Pneumonia';
    if (scan.scanType === 'chest' && !abnormal) return 'Normal';
    if (abnormal) return 'Abnormal';
    
    return 'Normal';
  };

  // Format date helper with better error handling
  const formatDate = (dateString: string | number | Date) => {
    if (!dateString) return "No date";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";
      return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    } catch (e) {
      return "Unknown date";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading scan results...</p>
        </div>
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
              <Link href="/results" className="text-sm hover:text-white transition-colors text-white">Results</Link>
              <Link href="/about" className="text-sm hover:text-white transition-colors">About</Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Scan Results</h1>
            <div className="flex gap-3">
              <Link
                href="/upload"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <Upload className="h-4 w-4" />
                Upload New Scan
              </Link>
              <button 
                onClick={refreshScans}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700 transition-colors"
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
                Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-900/20 p-3 rounded-lg">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!Array.isArray(scansList) || scansList.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <div className="flex justify-center mb-4">
                <ImageIcon className="h-16 w-16 text-gray-600" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">No Scans Found</h3>
              <p className="text-gray-400 mb-6">Upload medical scans to analyze and view results here.</p>
              <Link href="/upload" className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                Upload Your First Scan
              </Link>
            </div>
          ) : (
            /* Scans List with improved layout */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scansList.map((scan, index) => {
                const scanId = scan._id || scan.id || `scan-${index}`;
                const result = getScanResult(scan);
                const hasAbnormality = hasTumorOrAbnormality(scan);
                const confidenceValue = getConfidence(scan);
                const condition = getConditionType(scan);
                
                return (
                  <div
                    key={scanId}
                    className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-indigo-500 transition-colors"
                  >
                    <div className="p-4 space-y-4">
                      <div className="flex items-center gap-3">
                        <FileImage className="h-6 w-6 text-indigo-400" />
                        <div>
                          <p className="text-sm font-medium text-white">{scan.patientName || "Unknown Patient"}</p>
                          <p className="text-xs text-gray-400">
                            Patient ID: {scan.patientId || "Unknown"}
                          </p>
                          {(scan.scanDate || scan.createdAt) && (
                            <p className="text-xs text-gray-500">
                              {formatDate(scan.scanDate || scan.createdAt)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-400">
                            Scan Type:
                          </p>
                          <span className="text-sm text-white bg-gray-700 px-2 py-1 rounded-full">
                            {scan.scanType || "Unknown"}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-400">
                            Status:
                          </p>
                          <span className={`text-sm px-2 py-1 rounded-full ${
                            scan.status === "completed" || result
                              ? "bg-green-900/40 text-green-400" 
                              : scan.status === "processing" || scan.status === "analyzing"
                              ? "bg-yellow-900/40 text-yellow-400"
                              : "bg-gray-700 text-white"
                          }`}>
                            {result ? "Completed" : scan.status || "Pending"}
                          </span>
                        </div>
                        
                        {result && (
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-400">
                              Finding:
                            </p>
                            <span className={`text-sm px-2 py-1 rounded-full ${
                              hasAbnormality
                                ? "bg-red-900/40 text-red-400" 
                                : "bg-green-900/40 text-green-400"
                            }`}>
                              {condition || "Unknown"}
                            </span>
                          </div>
                        )}
                        
                        {confidenceValue !== null && (
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-400">
                              Confidence:
                            </p>
                            <span className="text-sm text-white">
                              {`${(confidenceValue * 100).toFixed(0)}%`}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Preview image if available */}
                      {scan.imageUrl && (
                        <div className="w-full h-32 bg-gray-900 rounded overflow-hidden flex items-center justify-center">
                          <img 
                            src={scan.imageUrl}
                            alt={`Scan for ${scan.patientName || 'patient'}`}
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder-scan.jpg';
                            }}
                          />
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => viewScanDetails(scanId)}
                          className="flex-1 py-2 px-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center justify-center gap-1"
                        >
                          View Details
                          <ChevronRight className="h-4 w-4" />
                        </button>

                        {!result && scan.status !== "processing" && (
                          <button
                            onClick={() => handleAnalyze(scanId)}
                            disabled={analysisStatus[scanId] === "processing"}
                            className="flex-1 py-2 px-3 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                          >
                            {analysisStatus[scanId] === "processing" ? (
                              <span className="flex items-center justify-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Processing...
                              </span>
                            ) : (
                              "Analyze"
                            )}
                          </button>
                        )}
                        
                        {result && (
                          <button
                            onClick={() => handleGenerateReport(scanId)}
                            className="w-10 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-600 flex items-center justify-center"
                            title="Generate Report"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Upload More Button */}
          {scansList.length > 0 && (
            <div className="flex justify-center mt-8">
              <Link
                href="/upload"
                className="py-3 px-6 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2"
              >
                <Upload className="h-5 w-5" />
                Upload Another Scan
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}