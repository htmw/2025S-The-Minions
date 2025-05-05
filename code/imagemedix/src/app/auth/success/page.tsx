'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

export default function AuthSuccess() {
    const router = useRouter();
    const { isSignedIn, isLoaded } = useAuth();

    useEffect(() => {
        if (isLoaded) {
            const timer = setTimeout(() => {
                if (isSignedIn) {
                    router.push('/home');
                } else {
                    router.push('/auth/login');
                }
            }, 500);
            
            return () => clearTimeout(timer);
        }
    }, [isSignedIn, isLoaded, router]);

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
            <div className="text-center text-white">
                <h1 className="text-2xl font-bold mb-4">Processing login...</h1>
                <p className="text-gray-400">Please wait while we complete your login.</p>
                <div className="mt-6 w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
        </div>
    );
}