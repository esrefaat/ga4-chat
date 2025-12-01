'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import '@/styles/chat.css';

interface User {
  username: string;
  role: string;
}

export default function SettingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const meResponse = await fetch('/api/auth/me');
      if (!meResponse.ok) {
        throw new Error('Failed to get user info');
      }
      const meData = await meResponse.json();
      setCurrentUser(meData);

      // Check if admin
      if (meData.role !== 'admin') {
        router.push('/');
        return;
      }

      // Get all users
      const usersResponse = await fetch('/api/users');
      if (!usersResponse.ok) {
        throw new Error('Failed to load users');
      }
      const usersData = await usersResponse.json();
      setUsers(usersData.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const invalidateUserSessions = async (username: string) => {
    try {
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/auth/invalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'user', username }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to invalidate sessions');
      }

      setSuccess(`All sessions for ${username} have been invalidated`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invalidate sessions');
      setTimeout(() => setError(null), 5000);
    }
  };

  const invalidateAllSessions = async () => {
    if (!confirm('Are you sure you want to invalidate ALL sessions for ALL users? This will force everyone to log in again.')) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/auth/invalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'all' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to invalidate sessions');
      }

      setSuccess('All sessions have been invalidated');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invalidate sessions');
      setTimeout(() => setError(null), 5000);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner-large"></div>
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || currentUser?.role !== 'admin') {
    return null;
  }

  return (
    <div className="app-layout">
      <div className="chat-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="chat-header">
          <div className="header-content">
            <div className="header-title-section">
              <h1>Settings</h1>
              <p className="header-subtitle">User Management & Session Control</p>
            </div>
            <button
              className="logout-btn"
              onClick={() => router.push('/')}
              style={{ background: 'transparent', border: '1px solid currentColor' }}
            >
              <span>Back to Chat</span>
            </button>
          </div>
        </div>

        <div style={{ padding: '24px', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
          {error && (
            <div style={{
              padding: '12px 16px',
              background: '#fee',
              color: '#c33',
              borderRadius: '8px',
              marginBottom: '16px',
              border: '1px solid #fcc',
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '12px 16px',
              background: '#efe',
              color: '#3c3',
              borderRadius: '8px',
              marginBottom: '16px',
              border: '1px solid #cfc',
            }}>
              {success}
            </div>
          )}

          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Users</h2>
            <div style={{
              background: 'var(--bg-secondary, #fff)',
              borderRadius: '12px',
              border: '1px solid var(--border-color, #e5e7eb)',
              overflow: 'hidden',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-tertiary, #f9fafb)', borderBottom: '2px solid var(--border-color, #e5e7eb)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Username</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Role</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={user.username} style={{ borderBottom: index < users.length - 1 ? '1px solid var(--border-color, #e5e7eb)' : 'none' }}>
                      <td style={{ padding: '12px 16px' }}>{user.username}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: user.role === 'admin' ? '#dbeafe' : '#f3f4f6',
                          color: user.role === 'admin' ? '#1e40af' : '#374151',
                          fontSize: '12px',
                          fontWeight: '500',
                        }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => invalidateUserSessions(user.username)}
                          style={{
                            padding: '6px 12px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#dc2626'}
                          onMouseOut={(e) => e.currentTarget.style.background = '#ef4444'}
                        >
                          Invalidate Sessions
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Global Actions</h2>
            <div style={{
              background: 'var(--bg-secondary, #fff)',
              borderRadius: '12px',
              border: '1px solid var(--border-color, #e5e7eb)',
              padding: '20px',
            }}>
              <p style={{ marginBottom: '16px', color: 'var(--text-secondary, #6b7280)' }}>
                Invalidate all active sessions for all users. This will force everyone to log in again.
              </p>
              <button
                onClick={invalidateAllSessions}
                style={{
                  padding: '10px 20px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#b91c1c'}
                onMouseOut={(e) => e.currentTarget.style.background = '#dc2626'}
              >
                Invalidate All Sessions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

