import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_CONFIG, isSessionValid, getUsernameFromToken, getUserByUsername } from '@/lib/auth';

/**
 * GET /api/auth/me - Get current user information
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(AUTH_CONFIG.sessionCookieName);
    
    if (!sessionToken || !isSessionValid(sessionToken.value)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const username = getUsernameFromToken(sessionToken.value);
    if (!username) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = getUserByUsername(username);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      username: user.username,
      role: user.role || 'user',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

