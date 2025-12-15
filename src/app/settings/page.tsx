'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { GA4_PROPERTIES } from '@/lib/ga4-properties';
import '@/styles/chat.css';

interface User {
  username: string;
  role: string;
  default_property_id?: string;
}

interface UserFormData {
  username: string;
  password: string;
  role: string;
  default_property_id?: string;
}

export default function SettingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    password: '',
    role: 'user',
    default_property_id: '',
  });

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

  const createUser = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (!formData.username || !formData.password) {
        setError('Username and password are required');
        return;
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          role: formData.role,
          default_property_id: formData.default_property_id || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setSuccess('User created successfully');
      setShowCreateForm(false);
      setFormData({ username: '', password: '', role: 'user', default_property_id: '' });
      await loadData();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
      setTimeout(() => setError(null), 5000);
    }
  };

  const updateUser = async (username: string) => {
    try {
      setError(null);
      setSuccess(null);

      const updates: { password?: string; role?: string; default_property_id?: string | null } = {};
      if (formData.password) updates.password = formData.password;
      if (formData.role) updates.role = formData.role;
      if (formData.default_property_id !== undefined) updates.default_property_id = formData.default_property_id || null;

      if (Object.keys(updates).length === 0) {
        setError('No changes to save');
        return;
      }

      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          ...updates,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user');
      }

      setSuccess('User updated successfully');
      setEditingUser(null);
      setFormData({ username: '', password: '', role: 'user', default_property_id: '' });
      await loadData();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
      setTimeout(() => setError(null), 5000);
    }
  };

  const deleteUser = async (username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/users?username=${encodeURIComponent(username)}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      setSuccess('User deleted successfully');
      await loadData();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
      setTimeout(() => setError(null), 5000);
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user.username);
    setFormData({
      username: user.username,
      password: '',
      role: user.role,
      default_property_id: user.default_property_id || '',
    });
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setFormData({ username: '', password: '', role: 'user', default_property_id: '' });
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: '#1f2937' }}>Users</h2>
              <button
                onClick={() => {
                  setShowCreateForm(!showCreateForm);
                  setEditingUser(null);
                  setFormData({ username: '', password: '', role: 'user', default_property_id: '' });
                }}
                style={{
                  padding: '8px 16px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
                onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
              >
                {showCreateForm ? 'Cancel' : '+ Add User'}
              </button>
            </div>

            {showCreateForm && (
              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                padding: '20px',
                marginBottom: '16px',
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>Create New User</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Username
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#1f2937',
                        background: '#ffffff',
                      }}
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Password
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#1f2937',
                        background: '#ffffff',
                      }}
                      placeholder="Enter password (min 8 characters)"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#1f2937',
                        background: '#ffffff',
                      }}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Default Property
                    </label>
                    <select
                      value={formData.default_property_id || ''}
                      onChange={(e) => setFormData({ ...formData, default_property_id: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#1f2937',
                        background: '#ffffff',
                      }}
                    >
                      <option value="">None (use first property)</option>
                      {GA4_PROPERTIES.map((prop) => (
                        <option key={prop.id} value={prop.id}>
                          {prop.name} ({prop.id})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={createUser}
                    style={{
                      padding: '8px 16px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      alignSelf: 'flex-start',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#059669'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#10b981'}
                  >
                    Create User
                  </button>
                </div>
              </div>
            )}

            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              overflow: 'hidden',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Username</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Role</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={user.username} style={{ borderBottom: index < users.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                      <td style={{ padding: '12px 16px', color: '#1f2937' }}>
                        {editingUser === user.username ? (
                          <input
                            type="text"
                            value={formData.username}
                            disabled
                            style={{
                              padding: '4px 8px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '4px',
                              fontSize: '14px',
                              background: '#f3f4f6',
                              color: '#1f2937',
                            }}
                          />
                        ) : (
                          user.username
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {editingUser === user.username ? (
                          <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            style={{
                              padding: '4px 8px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '4px',
                              fontSize: '12px',
                              color: '#1f2937',
                              background: '#ffffff',
                            }}
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                        ) : (
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
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {editingUser === user.username ? (
                          <select
                            value={formData.default_property_id || ''}
                            onChange={(e) => setFormData({ ...formData, default_property_id: e.target.value })}
                            style={{
                              padding: '4px 8px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '4px',
                              fontSize: '12px',
                              color: '#1f2937',
                              background: '#ffffff',
                              width: '200px',
                            }}
                          >
                            <option value="">None</option>
                            {GA4_PROPERTIES.map((prop) => (
                              <option key={prop.id} value={prop.id}>
                                {prop.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>
                            {user.default_property_id ? GA4_PROPERTIES.find(p => p.id === user.default_property_id)?.name || user.default_property_id : 'None'}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {editingUser === user.username ? (
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <input
                              type="password"
                              value={formData.password}
                              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                              placeholder="New password (optional)"
                              style={{
                                padding: '4px 8px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '4px',
                                fontSize: '12px',
                                width: '150px',
                                color: '#1f2937',
                                background: '#ffffff',
                              }}
                            />
                            <button
                              onClick={() => updateUser(user.username)}
                              style={{
                                padding: '4px 12px',
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '500',
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = '#059669'}
                              onMouseOut={(e) => e.currentTarget.style.background = '#10b981'}
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              style={{
                                padding: '4px 12px',
                                background: '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '500',
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = '#4b5563'}
                              onMouseOut={(e) => e.currentTarget.style.background = '#6b7280'}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => startEdit(user)}
                              style={{
                                padding: '6px 12px',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '500',
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
                              onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => invalidateUserSessions(user.username)}
                              style={{
                                padding: '6px 12px',
                                background: '#f59e0b',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '500',
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = '#d97706'}
                              onMouseOut={(e) => e.currentTarget.style.background = '#f59e0b'}
                            >
                              Invalidate
                            </button>
                            {user.username !== currentUser?.username && (
                              <button
                                onClick={() => deleteUser(user.username)}
                                style={{
                                  padding: '6px 12px',
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#dc2626'}
                                onMouseOut={(e) => e.currentTarget.style.background = '#ef4444'}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>Global Actions</h2>
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              padding: '20px',
            }}>
              <p style={{ marginBottom: '16px', color: '#6b7280' }}>
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

