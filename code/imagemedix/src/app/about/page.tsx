'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { HeartPulse, CheckCircle, Brain, Clock, Activity, Microscope } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function AboutPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check auth status first
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
      <main className="ml-64 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Problem Statement Section */}
          <div className="mb-16 text-center">
            <h1 className="text-4xl font-bold mb-6">Our Mission</h1>
            <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 shadow-lg">
              <p className="text-lg leading-relaxed text-gray-300">
                Many healthcare facilities face challenges in diagnosing pneumonia and brain tumors 
                quickly and accurately, often due to limited access to specialists and high workloads. 
                Current solutions typically require separate systems to analyze different types of 
                medical images. This leads to inefficiencies in diagnosis and delays in providing 
                critical care. There is a need for an automated system that can efficiently classify 
                medical images and provide preliminary diagnoses to support healthcare professionals 
                in making timely decisions.
              </p>
            </div>
          </div>

          {/* Solution Overview */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-center">Our Solution</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Chest X-ray Analysis */}
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-lg hover:border-indigo-500 transition-colors duration-300">
                <div className="w-12 h-12 rounded-lg bg-indigo-600/20 flex items-center justify-center mb-4">
                  <HeartPulse size={24} className="text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Pneumonia Detection</h3>
                <p className="text-gray-300 mb-4">
                  Our AI-powered system analyzes chest X-rays to detect pneumonia with high accuracy.
                  By leveraging advanced deep learning models, we can identify pneumonia patterns
                  in X-ray images within seconds, providing immediate preliminary diagnoses to
                  support healthcare professionals.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
                    <span>90%+ accuracy in pneumonia detection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Analysis completed in under 5 seconds</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Confidence scores with highlighted regions</span>
                  </li>
                </ul>
              </div>

              {/* Brain Tumor Analysis */}
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-lg hover:border-indigo-500 transition-colors duration-300">
                <div className="w-12 h-12 rounded-lg bg-indigo-600/20 flex items-center justify-center mb-4">
                  <Brain size={24} className="text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Brain Tumor Detection</h3>
                <p className="text-gray-300 mb-4">
                  Our neural network model is trained on thousands of MRI scans to detect various
                  types of brain tumors. The system provides rapid analysis of brain MRI images,
                  helping radiologists and neurologists prioritize cases and make faster decisions.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Multiple tumor type classification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Tumor location and size estimation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Comprehensive diagnostic reports</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Key Benefits Section */}
          <div>
            <h2 className="text-3xl font-bold mb-6 text-center">Key Benefits</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div className="bg-gray-900 p-5 rounded-lg border border-gray-800">
                <Clock className="h-8 w-8 text-indigo-500 mb-3" />
                <h3 className="font-bold text-lg mb-2">Time Efficiency</h3>
                <p className="text-gray-300">Reduces diagnosis time from hours to seconds</p>
              </div>
              
              <div className="bg-gray-900 p-5 rounded-lg border border-gray-800">
                <Activity className="h-8 w-8 text-indigo-500 mb-3" />
                <h3 className="font-bold text-lg mb-2">High Accuracy</h3>
                <p className="text-gray-300">Comparable to specialist-level diagnostic accuracy</p>
              </div>
              
              <div className="bg-gray-900 p-5 rounded-lg border border-gray-800">
                <Microscope className="h-8 w-8 text-indigo-500 mb-3" />
                <h3 className="font-bold text-lg mb-2">Unified Platform</h3>
                <p className="text-gray-300">One system for multiple types of medical images</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}