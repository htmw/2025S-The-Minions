
"use client";

import React, { useState } from "react";
import { 
  Brain,
  Search,
  Filter,
  Calendar,
  Clock,
  FileImage,
  ArrowRight,
  Download,
  MoreVertical,
  Upload,
  CheckCircle,
  AlertCircle,
  ChevronDown
} from "lucide-react";
import Link from "next/link";

export default function HistoryPage() {
  const [activities] = useState([
    {
      id: 1,
      type: "upload",
      patientId: "PT-2024-001",
      description: "Chest X-Ray uploaded",
      timestamp: "2024-03-10 14:30",
      status: "completed",
      imageType: "X-Ray"
    },
    {
      id: 2,
      type: "analysis",
      patientId: "PT-2024-001",
      description: "Analysis completed - Pneumonia detected",
      timestamp: "2024-03-10 14:32",
      status: "completed",
      confidence: 95.8,
      result: "Pneumonia"
    },
    {
      id: 3,
      type: "download",
      patientId: "PT-2024-001",
      description: "Report downloaded",
      timestamp: "2024-03-10 14:35",
      status: "completed"
    },
    {
      id: 4,
      type: "upload",
      patientId: "PT-2024-002",
      description: "Brain MRI uploaded",
      timestamp: "2024-03-09 10:15",
      status: "completed",
      imageType: "MRI"
    },
    {
      id: 5,
      type: "analysis",
      patientId: "PT-2024-002",
      description: "Analysis completed - Normal scan",
      timestamp: "2024-03-09 10:18",
      status: "completed",
      confidence: 98.2,
      result: "Normal"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  // Filter activities based on search term and filter type
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = 
      activity.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === "all") return matchesSearch;
    return matchesSearch && activity.type === filterType;
  });

  const getActivityIcon = (type) => {
    switch (type) {
      case "upload":
        return <Upload size={20} className="text-indigo-400" />;
      case "analysis":
        return <Brain size={20} className="text-indigo-400" />;
      case "download":
        return <Download size={20} className="text-indigo-400" />;
      default:
        return <FileImage size={20} className="text-indigo-400" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 text-sm text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
            <CheckCircle size={12} />
            Completed
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 text-sm text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-full">
            <Clock size={12} />
            Pending
          </span>
        );
      case "error":
        return (
          <span className="inline-flex items-center gap-1 text-sm text-red-400 bg-red-500/10 px-2 py-1 rounded-full">
            <AlertCircle size={12} />
            Error
          </span>
        );
      default:
        return null;
    }
  };

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
            
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="rounded-full bg-gray-800 text-white px-4 py-2 text-sm font-medium hover:bg-gray-700 transition-all"
              >
                Profile
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Activity History</h1>
              <p className="text-gray-400">Track and manage your medical image analysis history</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by ID or description..."
                  className="bg-gray-900 rounded-full pl-10 pr-4 py-2 text-sm border border-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-64"
                />
              </div>
              
              <div className="relative">
                <button 
                  onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                  className="flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm border border-gray-800 hover:bg-gray-800 transition-colors"
                >
                  <Filter size={16} />
                  {filterType === "all" ? "All Activities" : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  <ChevronDown size={14} />
                </button>

                {isFilterMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-lg border border-gray-800 py-1 z-10">
                    <button
                      onClick={() => {
                        setFilterType("all");
                        setIsFilterMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-800 transition-colors"
                    >
                      All Activities
                    </button>
                    <button
                      onClick={() => {
                        setFilterType("upload");
                        setIsFilterMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-800 transition-colors"
                    >
                      Uploads
                    </button>
                    <button
                      onClick={() => {
                        setFilterType("analysis");
                        setIsFilterMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-800 transition-colors"
                    >
                      Analysis
                    </button>
                    <button
                      onClick={() => {
                        setFilterType("download");
                        setIsFilterMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-800 transition-colors"
                    >
                      Downloads
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="space-y-4">
            {filteredActivities.map((activity) => (
              <div 
                key={activity.id}
                className="bg-gray-900 rounded-xl border border-gray-800 p-6 hover:border-indigo-500/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{activity.description}</h3>
                        {getStatusBadge(activity.status)}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} />
                          <span>{activity.timestamp}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span>Patient ID:</span>
                          <span className="text-white">{activity.patientId}</span>
                        </div>
                        {activity.imageType && (
                          <div className="flex items-center gap-1.5">
                            <span>Type:</span>
                            <span className="text-white">{activity.imageType}</span>
                          </div>
                        )}
                        {activity.confidence && (
                          <div className="flex items-center gap-1.5">
                            <span>Confidence:</span>
                            <span className="text-white">{activity.confidence}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {activity.type === "analysis" && (
                      <Link
                        href={`/results/${activity.patientId}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        View Results
                        <ArrowRight size={14} />
                      </Link>
                    )}
                    {(activity.type === "upload" || activity.type === "analysis") && (
                      <button 
                        className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors"
                        title="Download report"
                      >
                        <Download size={14} className="text-gray-400" />
                      </button>
                    )}
                    <button 
                      className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors"
                      title="More options"
                    >
                      <MoreVertical size={14} className="text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredActivities.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto rounded-full bg-gray-800 flex items-center justify-center mb-4">
                  <Search size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">No activities found</h3>
                <p className="text-gray-400">
                  Try adjusting your search or filter settings
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}