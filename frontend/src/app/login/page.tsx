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
  const [loading, setLoading] = useState(false);
  
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login({ email, password });
      const profile = await authService.getProfile();
      
      setAuth(profile, response.access, response.refresh);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="card w-full max-w-md p-32">
        <h1 className="text-h1 mb-24 text-center">Login</h1>

        {error && (
          <div className="mb-16 p-16 bg-red-50 border border-danger rounded-lg">
            <p className="text-body-sm text-danger">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-16">
          <div>
            <label htmlFor="email" className="block text-body-sm text-gray-700 mb-8">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field w-full"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-body-sm text-gray-700 mb-8">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field w-full"
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>

        <p className="text-body-sm text-gray-500 text-center mt-24">
          Don't have an account?{' '}
          <Link href="/register" className="text-brand-600 hover:text-brand-700">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
