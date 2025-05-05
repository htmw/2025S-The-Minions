'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

interface AuthWrapperProps {
  children: ReactNode;
  requireAuth?: boolean; 
}

export default function AuthWrapper({ children, requireAuth = true }: AuthWrapperProps) {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (requireAuth && !isSignedIn) {
      router.push('/auth/login');
      return;
    }

    if (!requireAuth && isSignedIn) {
      router.push('/home');
      return;
    }

    setAuthorized(true);
  }, [isLoaded, isSignedIn, requireAuth, router]);

  if (!authorized && requireAuth) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}