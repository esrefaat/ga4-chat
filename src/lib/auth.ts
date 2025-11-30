/**
 * Authentication configuration
 * 
 * Credentials are stored here. For production, use environment variables.
 */

// Default credentials (can be overridden by environment variables)
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'GA4@Chat2024!Secure#Pass';

export const AUTH_CONFIG = {
  username: process.env.AUTH_USERNAME || DEFAULT_USERNAME,
  password: process.env.AUTH_PASSWORD || DEFAULT_PASSWORD,
  sessionCookieName: 'ga4-chat-auth',
  sessionMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

/**
 * Validates login credentials
 */
export function validateCredentials(username: string, password: string): boolean {
  return username === AUTH_CONFIG.username && password === AUTH_CONFIG.password;
}

/**
 * Generates a simple session token
 */
export function generateSessionToken(): string {
  return Buffer.from(`${Date.now()}-${Math.random()}`).toString('base64');
}

