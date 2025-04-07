'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/services/api';
import { Brain, Upload, History, Settings, LogOut, User, Lock, Bell } from 'lucide-react';

interface UserSettings {
  name: string;
  email: string;
  notifications: boolean;
  darkMode: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<UserSettings>({
    name: '',
    email: '',
    notifications: true,
    darkMode: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await auth.getCurrentUser();
      setUser(response.data);
      setSettings(prev => ({
        ...prev,
        name: response.data.name,
        email: response.data.email,
      }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // TODO: Implement settings update API endpoint
      setSuccess('Settings updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update settings');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/auth/login');
  };

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
              className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
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
              className="flex items-center gap-3 px-4 py-3 text-white bg-indigo-600 rounded-lg"
            >
              <Settings size={20} />
              <span>Settings</span>
            </Link>
          </nav>

          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Settings</h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Section */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <User size={20} />
                Profile Settings
              </h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={settings.name}
                    onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={settings.email}
                    onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Preferences Section */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Bell size={20} />
                Preferences
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="notifications" className="text-sm font-medium">
                      Email Notifications
                    </label>
                    <p className="text-sm text-gray-400">
                      Receive notifications about scan analysis results
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings(prev => ({ ...prev, notifications: !prev.notifications }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.notifications ? 'bg-indigo-600' : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.notifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="darkMode" className="text-sm font-medium">
                      Dark Mode
                    </label>
                    <p className="text-sm text-gray-400">
                      Use dark theme for better visibility
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.darkMode ? 'bg-indigo-600' : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.darkMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Lock size={20} />
                Security
              </h2>

              <div className="space-y-4">
                <Link
                  href="/settings/change-password"
                  className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <div>
                    <h3 className="font-medium">Change Password</h3>
                    <p className="text-sm text-gray-400">
                      Update your account password
                    </p>
                  </div>
                  <span className="text-gray-400">→</span>
                </Link>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-500 transition-colors"
            >
              Save Changes
            </button>
          </form>
        </div>
      </main>
    </div>
  );
} 