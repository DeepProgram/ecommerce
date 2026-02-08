'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/authService';
import { cartService } from '@/services/cartService';
import { useState, useEffect } from 'react';

export default function Header() {
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const { itemCount, setItemCount } = useCartStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  useEffect(() => {
    if (isAuthenticated) {
      loadCartCount();
    } else {
      setItemCount(0);
    }
  }, [isAuthenticated]);

  const loadCartCount = async () => {
    try {
      const cart = await cartService.getCart();
      const count = cart?.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
      setItemCount(count);
    } catch (error) {
      console.error('Failed to load cart count:', error);
    }
  };

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
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-[1280px] mx-auto px-16 md:px-24">
        <div className="flex items-center justify-between h-[56px] gap-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-8 text-brand-600 flex-shrink-0">
            <span className="text-[24px]">🛍️</span>
            <span className="text-[18px] font-semibold hidden sm:inline">Shop</span>
          </Link>

          {/* Search Bar - Desktop */}
          <form 
            onSubmit={handleSearch}
            className="flex-1 max-w-[560px] mx-24 hidden md:block"
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
          <div className="flex items-center gap-16 flex-shrink-0">
            {/* Cart - Only show when authenticated */}
            {isAuthenticated && (
              <button 
                className="relative hover:opacity-70 transition-opacity flex items-center justify-center"
                onClick={() => router.push('/cart')}
                aria-label="Shopping cart"
              >
                <span className="text-[24px] leading-none">🛒</span>
                {itemCount > 0 && (
                  <span className="absolute -top-[4px] -right-[4px] bg-brand-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-[4px] flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
            )}
            
            {/* User Menu */}
            {isAuthenticated ? (
              <div className="flex items-center gap-12">
                {/* Mobile profile icon */}
                <button 
                  onClick={() => router.push('/profile')}
                  className="sm:hidden hover:opacity-70 transition-opacity flex items-center justify-center"
                  aria-label="Account"
                >
                  <span className="text-[24px] leading-none">👤</span>
                </button>
                
                {/* Desktop profile button */}
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
