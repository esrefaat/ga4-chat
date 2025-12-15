import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_CONFIG, getUsernameFromToken } from '@/lib/auth';
import { logActivity } from '@/lib/activity-logger';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(AUTH_CONFIG.sessionCookieName);
    
    // Get username from session token
    const username = sessionToken ? (getUsernameFromToken(sessionToken.value) || 'unknown') : 'unknown';
    
    cookieStore.delete(AUTH_CONFIG.sessionCookieName);

    // Log logout activity
    await logActivity(
      username,
      'LOGOUT',
      {},
      {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

