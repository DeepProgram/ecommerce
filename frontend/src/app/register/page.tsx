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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-32">
      <div className="card w-full max-w-md p-32">
        <h1 className="text-h1 mb-24 text-center">Create Account</h1>

        {error && (
          <div className="mb-16 p-16 bg-red-50 border border-danger rounded-lg">
            <p className="text-body-sm text-danger">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-16">
          <div className="grid grid-cols-2 gap-16">
            <div>
              <label htmlFor="first_name" className="block text-body-sm text-gray-700 mb-8">
                First Name
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                value={formData.first_name}
                onChange={handleChange}
                className="input-field w-full"
                required
              />
            </div>

            <div>
              <label htmlFor="last_name" className="block text-body-sm text-gray-700 mb-8">
                Last Name
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                value={formData.last_name}
                onChange={handleChange}
                className="input-field w-full"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="username" className="block text-body-sm text-gray-700 mb-8">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              className="input-field w-full"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-body-sm text-gray-700 mb-8">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field w-full"
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-body-sm text-gray-700 mb-8">
              Phone (Optional)
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className="input-field w-full"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-body-sm text-gray-700 mb-8">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="input-field w-full"
              required
            />
          </div>

          <div>
            <label htmlFor="password2" className="block text-body-sm text-gray-700 mb-8">
              Confirm Password
            </label>
            <input
              id="password2"
              name="password2"
              type="password"
              value={formData.password2}
              onChange={handleChange}
              className="input-field w-full"
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="text-body-sm text-gray-500 text-center mt-24">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-600 hover:text-brand-700">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
