'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await authService.login({ email, password });
      
      // Store tokens immediately so the next API call can use them
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);
      
      const profile = await authService.getProfile();
      
      setAuth(profile, response.access, response.refresh);
      setSuccess(true);
      
      // Show success briefly before redirect
      setTimeout(() => {
        router.push('/');
      }, 500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100dvh-120px)] flex items-center justify-center bg-gray-50 md:fixed md:inset-0 md:top-[56px]">
      <div className="w-full max-w-[920px] mx-auto px-8 md:px-24 py-8 md:py-0">
        <div className="grid md:grid-cols-[1.1fr_1fr] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card">
          <div className="hidden md:flex flex-col justify-center bg-brand-600 text-white p-32">
            <div className="max-w-[320px]">
              <h1 className="text-[28px] leading-[34px] font-bold mb-12">Welcome back</h1>
              <p className="text-[14px] leading-[22px] text-white/90">
                Log in to track orders, save favorites, and checkout faster.
              </p>
            </div>
          </div>

          <div className="p-24 md:p-32">
            <div className="text-center mb-16">
              <h2 className="text-[20px] leading-[26px] font-bold text-gray-900">User Login</h2>
              <p className="text-[12px] text-gray-500 mt-4">Enter your credentials to continue</p>
            </div>

            {error && (
              <div className="mb-16 p-12 bg-red-50 border border-danger rounded-lg">
                <p className="text-[12px] text-danger">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-16 p-12 bg-green-50 border border-success rounded-lg">
                <p className="text-[12px] text-success">Login successful! Redirecting...</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-12">
              <div>
                <label htmlFor="email" className="block text-[12px] text-gray-700 mb-4">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-[27px] px-8 rounded-md border border-gray-200 bg-gray-50 text-[12px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-opacity-20"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-[12px] text-gray-700 mb-4">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-[27px] px-8 rounded-md border border-gray-200 bg-gray-50 text-[12px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-opacity-20"
                  required
                />
              </div>

              <div className="pt-8">
                <button
                  type="submit"
                  className="btn-primary w-full text-[13px] h-[36px]"
                  disabled={loading || success}
                >
                  {success ? 'Success!' : loading ? 'Loading...' : 'Login'}
                </button>
              </div>
            </form>

            <p className="text-[12px] text-gray-500 text-center mt-16">
              Don't have an account?{' '}
              <Link href="/register" className="text-brand-600 hover:text-brand-700">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
