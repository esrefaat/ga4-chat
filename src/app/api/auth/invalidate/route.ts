import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_CONFIG, invalidateSessionToken, invalidateUserSessions, invalidateAllSessions, getUsernameFromToken } from '@/lib/auth';
import { logActivity } from '@/lib/activity-logger';

/**
 * POST /api/auth/invalidate
 * Invalidates sessions
 * 
 * Body options:
 * - { "type": "current" } - Invalidate current session
 * - { "type": "user", "username": "user1" } - Invalidate all sessions for a user
 * - { "type": "all" } - Invalidate all sessions (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(AUTH_CONFIG.sessionCookieName);
    const currentUsername = sessionToken ? getUsernameFromToken(sessionToken.value) : null;

    const body = await request.json();
    const { type, username } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'Type is required. Options: "current", "user", or "all"' },
        { status: 400 }
      );
    }

    switch (type) {
      case 'current':
        // Invalidate current session
        if (sessionToken) {
          invalidateSessionToken(sessionToken.value);
          cookieStore.delete(AUTH_CONFIG.sessionCookieName);
          
          await logActivity(
            currentUsername || 'unknown',
            'SESSION_INVALIDATED',
            { type: 'current' },
            {
              ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
              userAgent: request.headers.get('user-agent') || undefined,
            }
          );
        }
        return NextResponse.json({
          success: true,
          message: 'Current session invalidated',
        });

      case 'user':
        // Invalidate all sessions for a specific user
        if (!username) {
          return NextResponse.json(
            { error: 'Username is required for user invalidation' },
            { status: 400 }
          );
        }
        
        invalidateUserSessions(username);
        
        await logActivity(
          currentUsername || 'unknown',
          'SESSION_INVALIDATED',
          { type: 'user', targetUser: username },
          {
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
            userAgent: request.headers.get('user-agent') || undefined,
          }
        );
        
        return NextResponse.json({
          success: true,
          message: `All sessions for user "${username}" invalidated`,
        });

      case 'all':
        // Invalidate all sessions (admin only - check if needed)
        await invalidateAllSessions();
        
        await logActivity(
          currentUsername || 'unknown',
          'SESSION_INVALIDATED',
          { type: 'all' },
          {
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
            userAgent: request.headers.get('user-agent') || undefined,
          }
        );
        
        // Also delete current session cookie
        cookieStore.delete(AUTH_CONFIG.sessionCookieName);
        
        return NextResponse.json({
          success: true,
          message: 'All sessions invalidated',
        });

      default:
        return NextResponse.json(
          { error: 'Invalid type. Options: "current", "user", or "all"' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Session invalidation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

