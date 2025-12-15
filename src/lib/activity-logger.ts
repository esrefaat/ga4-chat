/**
 * Activity Logger
 * 
 * Logs user activities for audit purposes.
 * Uses PostgreSQL for persistent storage.
 */

import { query } from './db';

export interface ActivityLog {
  id?: number;
  timestamp: string;
  username: string;
  action: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log a user activity
 */
export async function logActivity(
  username: string,
  action: string,
  details?: Record<string, any>,
  request?: { ip?: string; userAgent?: string }
): Promise<void> {
  const timestamp = new Date().toISOString();

  try {
    // Insert into PostgreSQL
    await query(
      `INSERT INTO activity_logs (timestamp, username, action, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        timestamp,
        username,
        action,
        details ? JSON.stringify(details) : null,
        request?.ip || null,
        request?.userAgent || null,
      ]
    );

    // Also log to console for debugging
    console.log(`[ACTIVITY] ${timestamp} | ${username} | ${action}`, details || '');
  } catch (error) {
    // Log error but don't fail the request
    console.error('Failed to log activity to database:', error);
    // Fallback to console logging
    console.log(`[ACTIVITY] ${timestamp} | ${username} | ${action}`, details || '');
  }
}

/**
 * Get activity logs (for admin viewing)
 */
export async function getActivityLogs(
  username?: string,
  limit: number = 100
): Promise<ActivityLog[]> {
  try {
    let result;
    if (username) {
      result = await query<ActivityLog>(
        `SELECT id, timestamp, username, action, details, ip_address as "ipAddress", user_agent as "userAgent"
         FROM activity_logs
         WHERE username = $1
         ORDER BY timestamp DESC
         LIMIT $2`,
        [username, limit]
      );
    } else {
      result = await query<ActivityLog>(
        `SELECT id, timestamp, username, action, details, ip_address as "ipAddress", user_agent as "userAgent"
         FROM activity_logs
         ORDER BY timestamp DESC
         LIMIT $1`,
        [limit]
      );
    }

    // Parse JSON details
    return result.rows.map((row) => {
      const timestamp = row.timestamp as any;
      let timestampStr: string;
      
      if (timestamp instanceof Date) {
        timestampStr = timestamp.toISOString();
      } else if (typeof timestamp === 'string') {
        timestampStr = timestamp;
      } else {
        timestampStr = new Date(timestamp).toISOString();
      }
      
      return {
        ...row,
        details: row.details ? (typeof row.details === 'string' ? JSON.parse(row.details) : row.details) : undefined,
        timestamp: timestampStr,
      };
    });
  } catch (error) {
    console.error('Failed to fetch activity logs from database:', error);
    return [];
  }
}

/**
 * Get activity statistics
 */
export async function getActivityStats(): Promise<{
  totalActions: number;
  uniqueUsers: number;
  actionsByUser: Record<string, number>;
  recentActions: ActivityLog[];
}> {
  try {
    // Get total count
    const totalResult = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM activity_logs'
    );
    const totalActions = parseInt(totalResult.rows[0]?.count || '0', 10);

    // Get unique users count
    const uniqueResult = await query<{ count: string }>(
      'SELECT COUNT(DISTINCT username) as count FROM activity_logs'
    );
    const uniqueUsers = parseInt(uniqueResult.rows[0]?.count || '0', 10);

    // Get actions by user
    const actionsByUserResult = await query<{ username: string; count: string }>(
      `SELECT username, COUNT(*) as count
       FROM activity_logs
       GROUP BY username
       ORDER BY count DESC`
    );
    const actionsByUser: Record<string, number> = {};
    actionsByUserResult.rows.forEach((row) => {
      actionsByUser[row.username] = parseInt(row.count, 10);
    });

    // Get recent actions
    const recentResult = await query<ActivityLog>(
      `SELECT id, timestamp, username, action, details, ip_address as "ipAddress", user_agent as "userAgent"
       FROM activity_logs
       ORDER BY timestamp DESC
       LIMIT 10`
    );
    const recentActions = recentResult.rows.map((row) => {
      const timestamp = row.timestamp as any;
      let timestampStr: string;
      
      if (timestamp instanceof Date) {
        timestampStr = timestamp.toISOString();
      } else if (typeof timestamp === 'string') {
        timestampStr = timestamp;
      } else {
        timestampStr = new Date(timestamp).toISOString();
      }
      
      return {
        ...row,
        details: row.details ? (typeof row.details === 'string' ? JSON.parse(row.details) : row.details) : undefined,
        timestamp: timestampStr,
      };
    });

    return {
      totalActions,
      uniqueUsers,
      actionsByUser,
      recentActions,
    };
  } catch (error) {
    console.error('Failed to fetch activity stats from database:', error);
    return {
      totalActions: 0,
      uniqueUsers: 0,
      actionsByUser: {},
      recentActions: [],
    };
  }
}

