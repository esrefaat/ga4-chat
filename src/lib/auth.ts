/**
 * Authentication configuration
 * 
 * Uses PostgreSQL for user management persistence.
 */

import { query } from './db';

export interface User {
  username: string;
  password: string;
  role?: string;
  default_property_id?: string;
}

export const AUTH_CONFIG = {
  sessionCookieName: 'ga4-chat-auth',
  sessionMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

// Session blacklist for invalidated sessions
// In production, use Redis or database for distributed systems
const sessionBlacklist = new Set<string>();
const userSessionBlacklist = new Map<string, number>(); // username -> timestamp when invalidated

/**
 * Invalidates a specific session token
 */
export function invalidateSessionToken(token: string): void {
  sessionBlacklist.add(token);
}

/**
 * Invalidates all sessions for a specific user
 */
export function invalidateUserSessions(username: string): void {
  userSessionBlacklist.set(username, Date.now());
}

/**
 * Invalidates all sessions (global logout)
 */
export async function invalidateAllSessions(): Promise<void> {
  sessionBlacklist.clear();
  userSessionBlacklist.clear();
  
  // Set a timestamp for all users from database
  try {
    const users = await getAllUsers();
    users.forEach((user) => {
      userSessionBlacklist.set(user.username, Date.now());
    });
  } catch (error) {
    console.error('Failed to get users for session invalidation:', error);
  }
}

/**
 * Checks if a session token is valid (not blacklisted)
 */
export function isSessionValid(token: string): boolean {
  // Check if token is in blacklist
  if (sessionBlacklist.has(token)) {
    return false;
  }

  // Check if user's sessions were invalidated
  try {
    const username = getUsernameFromToken(token);
    if (username) {
      const invalidatedAt = userSessionBlacklist.get(username);
      if (invalidatedAt) {
        // Check if token was created before invalidation
        const payload = JSON.parse(Buffer.from(token, 'base64').toString());
        if (payload.timestamp && payload.timestamp < invalidatedAt) {
          return false;
        }
      }
    }
  } catch (error) {
    // Invalid token format
    return false;
  }

  return true;
}

/**
 * Validates login credentials
 */
export async function validateCredentials(username: string, password: string): Promise<User | null> {
  try {
    const result = await query<User>(
      'SELECT username, password, role, default_property_id FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    if (user.password === password) {
      return {
        username: user.username,
        password: user.password,
        role: user.role || 'user',
        default_property_id: user.default_property_id || undefined,
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to validate credentials:', error);
    return null;
  }
}

/**
 * Get user by username
 */
export async function getUserByUsername(username: string): Promise<User | undefined> {
  try {
    const result = await query<User>(
      'SELECT username, password, role, default_property_id FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return undefined;
    }

    const user = result.rows[0];
    return {
      username: user.username,
      password: user.password,
      role: user.role || 'user',
      default_property_id: user.default_property_id || undefined,
    };
  } catch (error) {
    console.error('Failed to get user by username:', error);
    return undefined;
  }
}

/**
 * Get all users (without passwords)
 */
export async function getAllUsers(): Promise<Omit<User, 'password'>[]> {
  try {
    const result = await query<{ username: string; role: string; default_property_id?: string }>(
      'SELECT username, role, default_property_id FROM users ORDER BY username'
    );

    return result.rows.map((row) => ({
      username: row.username,
      role: row.role || 'user',
      default_property_id: row.default_property_id || undefined,
    }));
  } catch (error) {
    console.error('Failed to get all users:', error);
    return [];
  }
}

/**
 * Create a new user
 */
export async function createUser(username: string, password: string, role: string = 'user', default_property_id?: string): Promise<{ success: boolean; error?: string }> {
  // Validate username
  if (!username || username.trim().length === 0) {
    return { success: false, error: 'Username is required' };
  }

  // Validate password
  if (!password || password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters' };
  }

  // Validate role
  if (role !== 'admin' && role !== 'user') {
    return { success: false, error: 'Role must be "admin" or "user"' };
  }

  try {
    // Check if user already exists
    const existingUser = await getUserByUsername(username.trim());
    if (existingUser) {
      return { success: false, error: 'Username already exists' };
    }

    // Insert user into database
    await query(
      'INSERT INTO users (username, password, role, default_property_id) VALUES ($1, $2, $3, $4)',
      [username.trim(), password, role, default_property_id || null]
    );

    return { success: true };
  } catch (error: any) {
    console.error('Failed to create user:', error);
    if (error.code === '23505') { // Unique violation
      return { success: false, error: 'Username already exists' };
    }
    return { success: false, error: 'Failed to create user' };
  }
}

/**
 * Update an existing user
 */
export async function updateUser(username: string, updates: { password?: string; role?: string; default_property_id?: string | null }): Promise<{ success: boolean; error?: string }> {
  // Validate password if provided
  if (updates.password !== undefined && updates.password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters' };
  }

  // Validate role if provided
  if (updates.role !== undefined && updates.role !== 'admin' && updates.role !== 'user') {
    return { success: false, error: 'Role must be "admin" or "user"' };
  }

  try {
    // Check if user exists
    const user = await getUserByUsername(username);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.password !== undefined) {
      updateFields.push(`password = $${paramIndex++}`);
      values.push(updates.password);
    }

    if (updates.role !== undefined) {
      updateFields.push(`role = $${paramIndex++}`);
      values.push(updates.role);
    }

    if (updates.default_property_id !== undefined) {
      updateFields.push(`default_property_id = $${paramIndex++}`);
      values.push(updates.default_property_id || null);
    }

    if (updateFields.length === 0) {
      return { success: false, error: 'No fields to update' };
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(username);

    await query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE username = $${paramIndex}`,
      values
    );

    return { success: true };
  } catch (error) {
    console.error('Failed to update user:', error);
    return { success: false, error: 'Failed to update user' };
  }
}

/**
 * Delete a user
 */
export async function deleteUser(username: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user exists
    const user = await getUserByUsername(username);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Prevent deleting the last admin user
    const adminUsersResult = await query<{ count: string }>(
      "SELECT COUNT(*) as count FROM users WHERE role = 'admin'"
    );
    const adminCount = parseInt(adminUsersResult.rows[0]?.count || '0', 10);

    if (user.role === 'admin' && adminCount === 1) {
      return { success: false, error: 'Cannot delete the last admin user' };
    }

    // Invalidate user sessions before deletion
    invalidateUserSessions(username);

    // Delete user from database
    await query('DELETE FROM users WHERE username = $1', [username]);

    return { success: true };
  } catch (error) {
    console.error('Failed to delete user:', error);
    return { success: false, error: 'Failed to delete user' };
  }
}

/**
 * Generates a session token with username encoded
 */
export function generateSessionToken(username: string): string {
  const payload = {
    username,
    timestamp: Date.now(),
    random: Math.random(),
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Decodes session token to get username
 */
export function getUsernameFromToken(token: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    return payload.username || null;
  } catch (error) {
    return null;
  }
}

