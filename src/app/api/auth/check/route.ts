import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_CONFIG } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(AUTH_CONFIG.sessionCookieName);

    return NextResponse.json({
      authenticated: !!sessionToken,
    });
  } catch (error) {
    return NextResponse.json({
      authenticated: false,
    });
  }
}

