'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
  });
  const router = useRouter();

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/check');
      const data = await response.json();
      setAuthState({
        isAuthenticated: data.authenticated || false,
        isLoading: false,
      });
      return data.authenticated || false;
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
      });
      return false;
    }
  }, []);

  // Login
  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
        });
        router.push('/');
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  }, [router]);

  // Logout
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
      });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [router]);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    ...authState,
    login,
    logout,
    checkAuth,
  };
}

