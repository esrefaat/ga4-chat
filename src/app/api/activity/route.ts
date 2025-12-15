import { NextRequest, NextResponse } from 'next/server';
import { getActivityLogs, getActivityStats } from '@/lib/activity-logger';
import { cookies } from 'next/headers';
import { AUTH_CONFIG, isSessionValid, getUsernameFromToken, getUserByUsername } from '@/lib/auth';

/**
 * GET /api/activity - Get activity logs (Admin only)
 * Query params:
 * - username: Filter by username (optional)
 * - limit: Number of logs to return (default: 100)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(AUTH_CONFIG.sessionCookieName);
    
    if (!sessionToken || !isSessionValid(sessionToken.value)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get username from session token
    const username = getUsernameFromToken(sessionToken.value);
    if (!username) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await getUserByUsername(username);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const filterUsername = searchParams.get('username') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const logs = await getActivityLogs(filterUsername, limit);
    const stats = await getActivityStats();

    return NextResponse.json({
      logs,
      stats,
      count: logs.length,
    });
  } catch (error) {
    console.error('Activity logs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

