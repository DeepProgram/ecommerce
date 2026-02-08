'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.password2) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register(formData);
      setAuth(response.user, response.access, response.refresh);
      router.push('/');
    } catch (err: any) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        const errorMessages = Object.values(errors).flat().join(', ');
        setError(errorMessages);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full h-[27px] px-8 rounded-md border border-gray-200 bg-gray-50 text-[12px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-opacity-20";

  return (
    <main className="min-h-[calc(100dvh-120px)] flex items-center justify-center bg-gray-50 md:fixed md:inset-0 md:top-[56px]">
      <div className="w-full max-w-[920px] mx-auto px-8 md:px-24 py-8 md:py-0">
        <div className="grid md:grid-cols-[1fr_1.2fr] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card">
          <div className="hidden md:flex flex-col justify-center bg-brand-600 text-white p-24">
            <div className="max-w-[280px]">
              <h1 className="text-[24px] leading-[30px] font-bold mb-8">Create account</h1>
              <p className="text-[13px] leading-[20px] text-white/90">
                Save your favorites, manage orders, and checkout faster.
              </p>
            </div>
          </div>

          <div className="p-16 md:p-20">
            <div className="text-center mb-10">
              <h2 className="text-[18px] leading-[24px] font-bold text-gray-900">Sign Up</h2>
              <p className="text-[11px] text-gray-500 mt-2">It only takes a minute</p>
            </div>

            {error && (
              <div className="mb-8 p-8 bg-red-50 border border-danger rounded-lg">
                <p className="text-[11px] text-danger">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="first_name" className="block text-[11px] text-gray-700 mb-2">
                    First Name
                  </label>
                  <input id="first_name" name="first_name" type="text" value={formData.first_name} onChange={handleChange} className={inputClass} required />
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-[11px] text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input id="last_name" name="last_name" type="text" value={formData.last_name} onChange={handleChange} className={inputClass} required />
                </div>
              </div>

              <div>
                <label htmlFor="username" className="block text-[11px] text-gray-700 mb-2">Username</label>
                <input id="username" name="username" type="text" value={formData.username} onChange={handleChange} className={inputClass} required />
              </div>

              <div>
                <label htmlFor="email" className="block text-[11px] text-gray-700 mb-2">Email</label>
                <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className={inputClass} required />
              </div>

              <div>
                <label htmlFor="phone" className="block text-[11px] text-gray-700 mb-2">Phone (Optional)</label>
                <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} className={inputClass} />
              </div>

              <div>
                <label htmlFor="password" className="block text-[11px] text-gray-700 mb-2">Password</label>
                <input id="password" name="password" type="password" value={formData.password} onChange={handleChange} className={inputClass} required />
                <p className="text-[10px] text-gray-400 mt-1">Use at least 8 characters.</p>
              </div>

              <div>
                <label htmlFor="password2" className="block text-[11px] text-gray-700 mb-2">Confirm Password</label>
                <input id="password2" name="password2" type="password" value={formData.password2} onChange={handleChange} className={inputClass} required />
              </div>

              <div className="pt-2">
                <button type="submit" className="btn-primary w-full text-[12px] h-[36px]" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Register'}
                </button>
              </div>
            </form>

            <p className="text-[11px] text-gray-500 text-center mt-8">
              Already have an account?{' '}
              <Link href="/login" className="text-brand-600 hover:text-brand-700">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
