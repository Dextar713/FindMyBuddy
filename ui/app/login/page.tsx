'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api_client';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { setCurrentUser, setToken, logout } = useAuth();

  // Clear any existing session when landing on login
  useEffect(() => {
    logout();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const responseLogin = await apiClient.post('/auth/login', { email, password });
      const token = typeof responseLogin.data === 'string' ? responseLogin.data : responseLogin.data?.token;
      if (token) setToken(token);

      const responseUser = await apiClient.get(`/users/find-by-email?email=${email}`);
      setCurrentUser(responseUser.data);

      router.push('/profile');
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message ?? 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-100">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="text-3xl font-bold tracking-tighter text-indigo-600 mb-2">Find Your Buddy</div>
          <p className="text-slate-500 text-sm">Welcome back. Enter your details to continue.</p>
        </div>

        {/* Card */}
        <div className="bg-white p-8 rounded-4xl shadow-xl shadow-slate-200/60 border border-slate-100">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 text-black border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all text-sm"
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
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 text-black border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-xs font-medium bg-red-50 p-3 rounded-xl">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-50 text-center">
            <p className="text-slate-500 text-sm">
              Don&apos;t have an account?{' '}
              <a href="/register" className="text-indigo-600 font-bold hover:underline">
                Join now
              </a>
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-slate-400 text-xs px-4 leading-relaxed">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
