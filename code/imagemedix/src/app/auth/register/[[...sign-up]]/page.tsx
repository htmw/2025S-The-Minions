'use client';

import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';
import { Brain } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">Create your account</h2>
          <p className="mt-2 text-gray-400">Join ImageMedix today</p>
        </div>

        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <SignUp 
            appearance={{
              elements: {
                formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-500 text-white',
                card: 'bg-transparent shadow-none',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: 'bg-gray-800 border border-gray-700 text-white hover:bg-gray-700',
                formFieldInput: 'bg-gray-800 border-gray-700 text-white',
                formFieldLabel: 'text-gray-300',
                footer: 'hidden'
              }
            }}
            redirectUrl="/home"
          />
        </div>

        <p className="mt-8 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}