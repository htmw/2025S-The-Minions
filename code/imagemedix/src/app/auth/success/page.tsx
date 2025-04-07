'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthSuccess() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            // Store the token
            localStorage.setItem('token', token);
            // Redirect to home page
            router.push('/home');
        } else {
            // If no token, redirect to login
            router.push('/auth/login');
        }
    }, [router, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Processing login...</h1>
                <p className="text-gray-600">Please wait while we complete your login.</p>
            </div>
        </div>
    );
} 