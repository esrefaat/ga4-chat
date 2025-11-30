'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import ThemeToggle from '@/components/ThemeToggle';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(username, password);

    if (!result.success) {
      setError(result.error || 'Login failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-gray-800 border border-gray-700 shadow-2xl rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="p-8 text-center border-b border-gray-700 bg-gradient-to-r from-purple-900/30 to-blue-900/30">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg">
            <i className="fas fa-chart-bar text-3xl text-white" aria-hidden="true"></i>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-gray-100">
            GA4 Chat Login
          </h1>
          <p className="text-sm flex items-center justify-center gap-2 text-gray-400">
            <i className="fas fa-shield-alt" aria-hidden="true"></i>
            Enter your credentials to access
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8">
          {/* Username Field */}
          <div className="mb-6">
            <label 
              htmlFor="username" 
              className="block mb-2 text-sm font-medium text-gray-300"
            >
              <i className="fas fa-user mr-2" aria-hidden="true"></i>
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <i className="fas fa-user-circle" aria-hidden="true"></i>
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-3 rounded-lg border bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                placeholder="Enter your username"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="mb-6">
            <label 
              htmlFor="password" 
              className="block mb-2 text-sm font-medium text-gray-300"
            >
              <i className="fas fa-lock mr-2" aria-hidden="true"></i>
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <i className="fas fa-key" aria-hidden="true"></i>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-3 rounded-lg border bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                placeholder="Enter your password"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg border bg-red-900/30 border-red-700 text-red-300 flex items-center gap-3">
              <i className="fas fa-exclamation-circle" aria-hidden="true"></i>
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
            }`}
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin" aria-hidden="true"></i>
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt" aria-hidden="true"></i>
                <span>Login</span>
              </>
            )}
          </button>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <p className="flex items-center justify-center gap-2">
              <i className="fas fa-info-circle" aria-hidden="true"></i>
              Secure authentication required
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
