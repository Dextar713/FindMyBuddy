'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api_client';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, Loader2, Sparkles, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { setCurrentUser, logout } = useAuth();

  // Clear any existing session when landing on register
  useEffect(() => {
    logout();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await apiClient.post('/auth/register', {
        email: formData.email,
        password: formData.password,
        role: 'Admin',
      });

      const userId = await apiClient.post('/users/create', {
        email: formData.email,
        userName: formData.username,
      });

      const responseUser = await apiClient.get(`/users/${userId.data}`);
      setCurrentUser(responseUser.data);

      router.push('/profile');
    } catch (err: any) {
      if (err.response?.data) {
        setError(err.response.data.message ?? JSON.stringify(err.response.data));
      } else {
        setError(err.message ?? 'Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-104">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-2xl mb-4">
            <Sparkles className="w-6 h-6 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create Account</h1>
          <p className="text-slate-500 mt-2">Join Find Your Buddy and start meeting people.</p>
        </div>

        {/* Card */}
        <div className="bg-white p-8 text-black rounded-4xl shadow-xl shadow-slate-200/60 border border-slate-100">
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                Display Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all text-sm"
                  placeholder="How should we call you?"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all text-sm"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all text-sm"
                  placeholder="At least 8 characters"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-xs font-medium bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-indigo-100 disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-50 text-center">
            <p className="text-slate-500 text-sm">
              Already have an account?{' '}
              <a href="/login" className="text-indigo-600 font-bold hover:underline transition-all">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
