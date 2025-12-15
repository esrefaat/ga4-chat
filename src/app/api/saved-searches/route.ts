import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_CONFIG, isSessionValid, getUsernameFromToken } from '@/lib/auth';
import { getSavedSearches, addSavedSearch, deleteSavedSearch, updateSavedSearch, deleteAllSavedSearches, incrementUsageCount } from '@/lib/saved-searches';
import { logActivity } from '@/lib/activity-logger';

/**
 * GET /api/saved-searches - Get all saved searches for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(AUTH_CONFIG.sessionCookieName);

    if (!sessionToken || !isSessionValid(sessionToken.value)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const username = getUsernameFromToken(sessionToken.value);
    if (!username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const searches = await getSavedSearches(username, limit);

    return NextResponse.json({ searches });
  } catch (error) {
    console.error('Get saved searches error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/saved-searches - Add a new saved search
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(AUTH_CONFIG.sessionCookieName);

    if (!sessionToken || !isSessionValid(sessionToken.value)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const username = getUsernameFromToken(sessionToken.value);
    if (!username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { question } = body;

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const result = await addSavedSearch(username, question);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await logActivity(username, 'SAVED_SEARCH_ADDED', { question: question.substring(0, 100) }, {
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    console.error('Add saved search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/saved-searches - Delete a saved search or all searches
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(AUTH_CONFIG.sessionCookieName);

    if (!sessionToken || !isSessionValid(sessionToken.value)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const username = getUsernameFromToken(sessionToken.value);
    if (!username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const deleteAll = searchParams.get('all') === 'true';

    if (deleteAll) {
      const result = await deleteAllSavedSearches(username);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      await logActivity(username, 'SAVED_SEARCHES_DELETED_ALL', {}, {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });

      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const result = await deleteSavedSearch(username, parseInt(id, 10));
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await logActivity(username, 'SAVED_SEARCH_DELETED', { id }, {
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete saved search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/saved-searches - Update a saved search
 */
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(AUTH_CONFIG.sessionCookieName);

    if (!sessionToken || !isSessionValid(sessionToken.value)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const username = getUsernameFromToken(sessionToken.value);
    if (!username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, question } = body;

    if (!id || !question || typeof question !== 'string') {
      return NextResponse.json({ error: 'ID and question are required' }, { status: 400 });
    }

    const result = await updateSavedSearch(username, id, question);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await logActivity(username, 'SAVED_SEARCH_UPDATED', { id, question: question.substring(0, 100) }, {
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update saved search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/saved-searches - Increment usage count for a saved search
 */
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(AUTH_CONFIG.sessionCookieName);

    if (!sessionToken || !isSessionValid(sessionToken.value)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const username = getUsernameFromToken(sessionToken.value);
    if (!username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    // Convert id to number if it's a string
    const searchId = typeof id === 'string' ? parseInt(id, 10) : id;

    if (!searchId || (typeof searchId !== 'number' || isNaN(searchId))) {
      return NextResponse.json({ error: 'ID is required and must be a number' }, { status: 400 });
    }

    const result = await incrementUsageCount(username, searchId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Increment usage count error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

