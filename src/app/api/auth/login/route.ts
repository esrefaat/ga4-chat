import { NextRequest, NextResponse } from 'next/server';
import { validateCredentials, generateSessionToken, AUTH_CONFIG } from '@/lib/auth';
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
    if (!validateCredentials(username, password)) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Generate session token
    const sessionToken = generateSessionToken();
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

