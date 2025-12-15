import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_CONFIG, isSessionValid, getUsernameFromToken, getUserByUsername, createUser, updateUser, deleteUser, getAllUsers } from '@/lib/auth';
import { logActivity } from '@/lib/activity-logger';

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
    const user = await getUserByUsername(username);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get all users from database
    const users = await getAllUsers();

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

/**
 * POST /api/users - Create a new user (Admin only)
 */
export async function POST(request: NextRequest) {
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
    const user = await getUserByUsername(username);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username: newUsername, password, role, default_property_id } = body;

    if (!newUsername || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const result = await createUser(newUsername, password, role || 'user', default_property_id);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    await logActivity(username, 'USER_CREATED', { newUsername, role: role || 'user' }, {
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('Create user API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users - Update a user (Admin only)
 */
export async function PUT(request: NextRequest) {
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
    const user = await getUserByUsername(username);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username: targetUsername, password, role, default_property_id } = body;

    if (!targetUsername) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const updates: { password?: string; role?: string; default_property_id?: string } = {};
    if (password !== undefined) updates.password = password;
    if (role !== undefined) updates.role = role;
    if (default_property_id !== undefined) updates.default_property_id = default_property_id;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'At least one field (password or role) must be provided' },
        { status: 400 }
      );
    }

    const result = await updateUser(targetUsername, updates);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    await logActivity(username, 'USER_UPDATED', { targetUsername, updates }, {
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Update user API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users - Delete a user (Admin only)
 */
export async function DELETE(request: NextRequest) {
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
    const user = await getUserByUsername(username);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const targetUsername = searchParams.get('username');

    if (!targetUsername) {
      return NextResponse.json(
        { error: 'Username parameter is required' },
        { status: 400 }
      );
    }

    // Prevent self-deletion
    if (targetUsername === username) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    const result = await deleteUser(targetUsername);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    await logActivity(username, 'USER_DELETED', { targetUsername }, {
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

