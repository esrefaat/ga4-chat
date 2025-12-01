import { NextRequest, NextResponse } from 'next/server';
import { validateCredentials, generateSessionToken, AUTH_CONFIG } from '@/lib/auth';
import { logActivity } from '@/lib/activity-logger';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Validate credentials
    const user = validateCredentials(username, password);
    if (!user) {
      // Log failed login attempt
      logActivity(
        username,
        'LOGIN_FAILED',
        { reason: 'Invalid credentials' },
        {
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        }
      );
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Generate session token with username
    const sessionToken = generateSessionToken(user.username);
    const expiresAt = new Date(Date.now() + AUTH_CONFIG.sessionMaxAge);

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set(AUTH_CONFIG.sessionCookieName, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });

    // Log successful login
    logActivity(
      user.username,
      'LOGIN_SUCCESS',
      { role: user.role },
      {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

