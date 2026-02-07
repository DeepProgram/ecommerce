'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/authService';
import { useState } from 'react';

export default function Header() {
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await authService.logout(refreshToken);
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    clearAuth();
    router.push('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-[1280px] mx-auto px-16 md:px-24">
        <div className="flex items-center h-[56px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-8 text-brand-600 mr-24">
            <span className="text-[24px]">🛍️</span>
            <span className="text-[18px] font-semibold hidden sm:inline">Shop</span>
          </Link>

          {/* Search Bar - Desktop */}
          <form 
            onSubmit={handleSearch}
            className="flex-1 max-w-[640px] mr-24 hidden md:block"
          >
            <div className="relative">
              <input
                type="search"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-40 px-40 pr-16 rounded-full border border-gray-200 bg-gray-50 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-opacity-20 focus:border-brand-600 focus:bg-white transition-all"
              />
              <button 
                type="submit"
                className="absolute left-12 top-1/2 -translate-y-1/2 text-[18px] text-gray-400 hover:text-brand-600 transition-colors"
              >
                🔍
              </button>
            </div>
          </form>

          {/* Spacer for mobile when search is hidden */}
          <div className="flex-1 md:hidden"></div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-16">
            {/* Cart */}
            <button 
              className="relative hover:opacity-70 transition-opacity"
              onClick={() => router.push('/cart')}
              aria-label="Shopping cart"
            >
              <span className="text-[24px]">🛒</span>
              <span className="absolute -top-6 -right-6 bg-brand-600 text-white text-[10px] font-bold rounded-full w-18 h-18 flex items-center justify-center">
                0
              </span>
            </button>
            
            {/* User Menu */}
            {isAuthenticated ? (
              <div className="flex items-center gap-12">
                <button 
                  onClick={() => router.push('/profile')}
                  className="hidden sm:flex items-center gap-8 text-[14px] text-gray-700 hover:text-brand-600 transition-colors"
                >
                  <span className="text-[20px]">👤</span>
                  <span className="hidden lg:inline font-medium">{user?.first_name || 'Account'}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="hidden sm:block text-[13px] text-gray-700 hover:text-danger transition-colors font-medium"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link 
                href="/login" 
                className="px-24 h-40 bg-brand-600 text-white rounded-lg text-[14px] leading-none font-semibold hover:bg-brand-700 transition-colors flex items-center justify-center whitespace-nowrap"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="max-w-[1280px] mx-auto px-16 py-12 md:hidden border-t border-gray-200">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <input
              type="search"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-40 px-40 pr-16 rounded-full border border-gray-200 bg-gray-50 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-opacity-20 focus:border-brand-600 focus:bg-white transition-all"
            />
            <button 
              type="submit"
              className="absolute left-12 top-1/2 -translate-y-1/2 text-[18px] text-gray-400"
            >
              🔍
            </button>
          </div>
        </form>
      </div>
    </header>
  );
}
