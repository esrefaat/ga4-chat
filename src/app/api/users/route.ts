import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_CONFIG, isSessionValid, getUsernameFromToken, getUserByUsername } from '@/lib/auth';

/**
 * GET /api/users - Get all users (Admin only)
 */
export async function GET(request: NextRequest) {
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

    // Check if user is admin
    const user = getUserByUsername(username);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Return users without passwords
    const users = AUTH_CONFIG.users.map(({ password, ...user }) => ({
      ...user,
      role: user.role || 'user',
    }));

    return NextResponse.json({
      users,
    });
  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

