/**
 * Activity Logger
 * 
 * Logs user activities for audit purposes.
 * In production, consider using a proper logging service or database.
 */

export interface ActivityLog {
  timestamp: string;
  username: string;
  action: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

// In-memory log storage (for development)
// In production, use a database or logging service
const activityLogs: ActivityLog[] = [];
const MAX_LOGS = 10000; // Keep last 10k logs in memory

/**
 * Log a user activity
 */
export function logActivity(
  username: string,
  action: string,
  details?: Record<string, any>,
  request?: { ip?: string; userAgent?: string }
): void {
  const log: ActivityLog = {
    timestamp: new Date().toISOString(),
    username,
    action,
    details,
    ipAddress: request?.ip,
    userAgent: request?.userAgent,
  };

  // Add to in-memory storage
  activityLogs.push(log);

  // Keep only last MAX_LOGS entries
  if (activityLogs.length > MAX_LOGS) {
    activityLogs.shift();
  }

  // Also log to console (in production, send to logging service)
  console.log(`[ACTIVITY] ${log.timestamp} | ${username} | ${action}`, details || '');
}

/**
 * Get activity logs (for admin viewing)
 */
export function getActivityLogs(
  username?: string,
  limit: number = 100
): ActivityLog[] {
  let logs = [...activityLogs];

  // Filter by username if provided
  if (username) {
    logs = logs.filter((log) => log.username === username);
  }

  // Return most recent first, limited
  return logs.slice(-limit).reverse();
}

/**
 * Get activity statistics
 */
export function getActivityStats(): {
  totalActions: number;
  uniqueUsers: number;
  actionsByUser: Record<string, number>;
  recentActions: ActivityLog[];
} {
  const uniqueUsers = new Set(activityLogs.map((log) => log.username));
  const actionsByUser: Record<string, number> = {};

  activityLogs.forEach((log) => {
    actionsByUser[log.username] = (actionsByUser[log.username] || 0) + 1;
  });

  return {
    totalActions: activityLogs.length,
    uniqueUsers: uniqueUsers.size,
    actionsByUser,
    recentActions: activityLogs.slice(-10).reverse(),
  };
}

