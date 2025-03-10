"use client";

import React, { useState } from "react";
import { 
  Brain,
  Search,
  Filter,
  Download,
  Share2,
  FileImage,
  ChevronDown,
  Clock
} from "lucide-react";
import Link from "next/link";

export default function ResultsPage() {
  const [results] = useState([
    {
      id: 1,
      patientId: "PT-2024-001",
      imageType: "X-Ray",
      diagnosis: "Pneumonia",
      confidence: 95.8,
      date: "2024-03-10",
      status: "complete"
    },
    {
      id: 2,
      patientId: "PT-2024-002",
      imageType: "MRI",
      diagnosis: "Normal",
      confidence: 98.2,
      date: "2024-03-09",
      status: "complete"
    },
    // Add more mock results as needed
  ]);

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
            <h1 className="text-3xl font-bold">Analysis Results</h1>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search results..."
                  className="bg-gray-900 rounded-full pl-10 pr-4 py-2 text-sm border border-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-64"
                />
              </div>
              
              <button className="flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm border border-gray-800 hover:bg-gray-800 transition-colors">
                <Filter size={16} />
                Filter
              </button>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Patient ID</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Image Type</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Diagnosis</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Confidence</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Date</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr 
                      key={result.id} 
                      className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-indigo-600/20 flex items-center justify-center">
                            <FileImage size={16} className="text-indigo-400" />
                          </div>
                          <span>{result.patientId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{result.imageType}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-sm
                          ${result.diagnosis === "Normal" 
                            ? "bg-green-500/10 text-green-400" 
                            : "bg-yellow-500/10 text-yellow-400"
                          }`}
                        >
                          {result.diagnosis}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-800 h-1.5 rounded-full">
                            <div 
                              className="bg-indigo-500 h-1.5 rounded-full" 
                              style={{ width: `${result.confidence}%` }}
                            ></div>
                          </div>
                          <span>{result.confidence}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{result.date}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors">
                            <Download size={14} className="text-gray-400" />
                          </button>
                          <button className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors">
                            <Share2 size={14} className="text-gray-400" />
                          </button>
                          <button className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors">
                            <ChevronDown size={14} className="text-gray-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}