import { NextRequest, NextResponse } from 'next/server';
import { getActivityLogs, getActivityStats } from '@/lib/activity-logger';
import { cookies } from 'next/headers';
import { AUTH_CONFIG } from '@/lib/auth';

/**
 * GET /api/activity - Get activity logs
 * Query params:
 * - username: Filter by username (optional)
 * - limit: Number of logs to return (default: 100)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(AUTH_CONFIG.sessionCookieName);
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const logs = getActivityLogs(username, limit);
    const stats = getActivityStats();

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

