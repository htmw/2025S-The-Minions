'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { Brain, Upload, History, Settings } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Clerk has loaded and the user is not signed in, redirect to login
    if (isLoaded) {
      if (!isSignedIn) {
        router.push('/auth/login');
        return;
      }
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Welcome back, {user?.firstName || user?.fullName || 'User'}</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick Upload Card */}
            <Link
              href="/upload"
              className="p-6 bg-gray-900 rounded-lg border border-gray-800 hover:border-indigo-500 transition-colors group"
            >
              <div className="w-12 h-12 bg-indigo-600/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-600/30 transition-colors">
                <Upload size={24} className="text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload New Scan</h3>
              <p className="text-gray-400">
                Upload medical scans for AI-powered analysis and diagnosis.
              </p>
            </Link>

            {/* Recent Scans Card */}
            <Link
              href="/history"
              className="p-6 bg-gray-900 rounded-lg border border-gray-800 hover:border-indigo-500 transition-colors group"
            >
              <div className="w-12 h-12 bg-indigo-600/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-600/30 transition-colors">
                <History size={24} className="text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Recent Scans</h3>
              <p className="text-gray-400">
                View and manage your recently uploaded medical scans.
              </p>
            </Link>

            {/* Settings Card */}
            <Link
              href="/settings"
              className="p-6 bg-gray-900 rounded-lg border border-gray-800 hover:border-indigo-500 transition-colors group"
            >
              <div className="w-12 h-12 bg-indigo-600/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-600/30 transition-colors">
                <Settings size={24} className="text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Settings</h3>
              <p className="text-gray-400">
                Manage your account settings and preferences.
              </p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}