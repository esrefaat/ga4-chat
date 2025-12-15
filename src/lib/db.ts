/**
 * PostgreSQL Database Connection
 * 
 * Manages connection to PostgreSQL database for activity logs and user management
 */

import { Pool, PoolClient } from 'pg';

let pool: Pool | null = null;

/**
 * Get or create database connection pool
 */
function getPool(): Pool {
  if (!pool) {
    // In development, use localhost with port forward (5434)
    // In production, use the Kubernetes service DNS
    const isDevelopment = process.env.NODE_ENV === 'development';
    const host = isDevelopment 
      ? (process.env.POSTGRES_HOST || 'localhost')
      : (process.env.POSTGRES_HOST || 'postgres-service.shared-services.svc.cluster.local');
    const port = isDevelopment
      ? parseInt(process.env.POSTGRES_PORT || '5434', 10) // Port forward uses 5434
      : parseInt(process.env.POSTGRES_PORT || '5432', 10);
    
    pool = new Pool({
      host,
      port,
      database: process.env.POSTGRES_DB || 'ga4_chat',
      user: process.env.POSTGRES_USER || 'ga4_chat_user',
      password: process.env.POSTGRES_PASSWORD || '',
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });
  }

  return pool;
}

/**
 * Execute a query with automatic connection management
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return { rows: result.rows, rowCount: result.rowCount || 0 };
  } finally {
    client.release();
  }
}

/**
 * Execute a transaction
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close all database connections (for graceful shutdown)
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW()');
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

