'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isInitialized, isAuthenticated, router]);

  // Show loader while initializing or if not authenticated
  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-120px)] md:min-h-[calc(100vh-56px)] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-48 h-48 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mb-12"></div>
          <p className="text-[13px] text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
