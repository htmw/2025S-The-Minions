'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Brain, Upload, History, Settings, LogOut, User } from 'lucide-react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      setLoading(false);
    }
  }, [isLoaded]);

  const handleLogout = async () => {
    await signOut();
    router.push('/auth/login');
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  if (loading) {
    return (
      <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900 border-r border-gray-800">
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </aside>
    );
  }

  return (
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
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive('/home') 
                ? 'text-white bg-indigo-600' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Brain size={20} />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/upload"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive('/upload') 
                ? 'text-white bg-indigo-600' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Upload size={20} />
            <span>Upload Scans</span>
          </Link>
          <Link
            href="/history"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive('/history') 
                ? 'text-white bg-indigo-600' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <History size={20} />
            <span>History</span>
          </Link>
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive('/settings') 
                ? 'text-white bg-indigo-600' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Settings size={20} />
            <span>Settings</span>
          </Link>
          <Link
            href="/about"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive('/about') 
                ? 'text-white bg-indigo-600' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <User size={20} />
            <span>About</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-800">
          {user ? (
            <div className="mb-4">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{user.firstName || user.fullName || 'User'}</p>
                  <p className="text-xs text-gray-400">{user.emailAddresses[0]?.emailAddress}</p>
                </div>
              </div>
            </div>
          ) : null}
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors w-full"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}