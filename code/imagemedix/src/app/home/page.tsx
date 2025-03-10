// app/home/page.jsx
import React from "react";
import { 
  Upload,
  LayoutGrid,
  Settings,
  History,
  Brain
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
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
          <h1 className="text-3xl font-bold mb-8">Welcome to ImageMedix</h1>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Quick Actions Cards */}
            <Link href="/upload" 
              className="bg-gray-900 p-6 rounded-xl border border-gray-800 hover:border-indigo-500/50 transition-all group hover:shadow-lg">
              <div className="w-12 h-12 bg-indigo-600/20 rounded-lg flex items-center justify-center mb-4">
                <Upload size={24} className="text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Upload Image</h3>
              <p className="text-gray-400 text-sm">Upload medical images for AI analysis</p>
            </Link>

            <Link href="/results" 
              className="bg-gray-900 p-6 rounded-xl border border-gray-800 hover:border-indigo-500/50 transition-all group hover:shadow-lg">
              <div className="w-12 h-12 bg-indigo-600/20 rounded-lg flex items-center justify-center mb-4">
                <LayoutGrid size={24} className="text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">View Results</h3>
              <p className="text-gray-400 text-sm">Access your analysis results</p>
            </Link>

            <Link href="/history" 
              className="bg-gray-900 p-6 rounded-xl border border-gray-800 hover:border-indigo-500/50 transition-all group hover:shadow-lg">
              <div className="w-12 h-12 bg-indigo-600/20 rounded-lg flex items-center justify-center mb-4">
                <History size={24} className="text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">History</h3>
              <p className="text-gray-400 text-sm">View past analyses and reports</p>
            </Link>

            <Link href="/settings" 
              className="bg-gray-900 p-6 rounded-xl border border-gray-800 hover:border-indigo-500/50 transition-all group hover:shadow-lg">
              <div className="w-12 h-12 bg-indigo-600/20 rounded-lg flex items-center justify-center mb-4">
                <Settings size={24} className="text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Settings</h3>
              <p className="text-gray-400 text-sm">Manage your account settings</p>
            </Link>
          </div>
          
          {/* Recent Activity Section */}
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-6">Recent Activity</h2>
            <div className="bg-gray-900 rounded-xl border border-gray-800">
              <div className="p-6">
                <p className="text-gray-400">No recent activity to display</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}