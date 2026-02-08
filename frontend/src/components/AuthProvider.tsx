'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initialize, isInitialized } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isInitialized) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-48 h-48 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mb-12"></div>
          <p className="text-[13px] text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
