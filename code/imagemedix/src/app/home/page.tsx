'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/services/api';
import { Brain, Upload, History, Settings, LogOut } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await auth.getCurrentUser();
        setUser(response.data);
      } catch (error) {
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/auth/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900 border-r border-gray-800">
        <div className="flex flex-col h-full">
          <div className="p-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded bg-indigo-600 flex items-center justify-center">
                <Brain size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold">
                <span className="text-indigo-500">Image</span>Medix
              </span>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            <Link
              href="/home"
              className="flex items-center gap-3 px-4 py-3 text-white bg-indigo-600 rounded-lg"
            >
              <Brain size={20} />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/upload"
              className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Upload size={20} />
              <span>Upload Scans</span>
            </Link>
            <Link
              href="/history"
              className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <History size={20} />
              <span>History</span>
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Settings size={20} />
              <span>Settings</span>
            </Link>
          </nav>

          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Welcome back, {user.name}</h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
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