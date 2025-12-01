import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_CONFIG, isSessionValid } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(AUTH_CONFIG.sessionCookieName);

    if (!sessionToken) {
      return NextResponse.json({
        authenticated: false,
      });
    }

    // Check if session is valid (not blacklisted)
    const isValid = isSessionValid(sessionToken.value);

    return NextResponse.json({
      authenticated: isValid,
    });
  } catch (error) {
    return NextResponse.json({
      authenticated: false,
    });
  }
}

