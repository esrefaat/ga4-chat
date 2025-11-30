import { NextResponse } from 'next/server';

/**
 * Health check endpoint for Kubernetes liveness and readiness probes
 * 
 * This endpoint is used by Kubernetes to:
 * - Liveness probe: Check if the application is running
 * - Readiness probe: Check if the application is ready to serve traffic
 */
export async function GET() {
  try {
    // Basic health check - can be extended to check dependencies
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

