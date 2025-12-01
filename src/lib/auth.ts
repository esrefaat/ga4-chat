/**
 * Authentication configuration
 * 
 * Credentials are stored here. For production, use environment variables.
 */

export interface User {
  username: string;
  password: string;
  role?: string;
}

// Default users (can be overridden by environment variables)
const DEFAULT_USERS: User[] = [
  {
    username: 'admin',
    password: 'Admin@GA4Chat2024!NewPass',
    role: 'admin',
  },
  {
    username: 'user1',
    password: 'User1@GA4Chat2024!Secure',
    role: 'user',
  },
  {
    username: 'user2',
    password: 'User2@GA4Chat2024!Secure',
    role: 'user',
  },
  {
    username: 'user3',
    password: 'User3@GA4Chat2024!Secure',
    role: 'user',
  },
];

// Parse users from environment variable (JSON format) or use defaults
function getUsers(): User[] {
  if (process.env.AUTH_USERS) {
    try {
      return JSON.parse(process.env.AUTH_USERS);
    } catch (error) {
      console.error('Failed to parse AUTH_USERS, using defaults');
    }
  }
  return DEFAULT_USERS;
}

export const AUTH_CONFIG = {
  users: getUsers(),
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
export function invalidateAllSessions(): void {
  sessionBlacklist.clear();
  userSessionBlacklist.clear();
  // Set a timestamp for all users
  AUTH_CONFIG.users.forEach((user) => {
    userSessionBlacklist.set(user.username, Date.now());
  });
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
export function validateCredentials(username: string, password: string): User | null {
  const user = AUTH_CONFIG.users.find(
    (u) => u.username === username && u.password === password
  );
  return user || null;
}

/**
 * Get user by username
 */
export function getUserByUsername(username: string): User | undefined {
  return AUTH_CONFIG.users.find((u) => u.username === username);
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

