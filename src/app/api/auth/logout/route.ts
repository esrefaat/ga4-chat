import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_CONFIG } from '@/lib/auth';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_CONFIG.sessionCookieName);

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

