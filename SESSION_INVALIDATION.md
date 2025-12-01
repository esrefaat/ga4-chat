# Session Invalidation

The application supports invalidating active sessions for security purposes.

## How It Works

Sessions are tracked in memory with a blacklist system. When a session is invalidated:
- The session token is added to a blacklist
- All subsequent requests with that token are rejected
- Users are forced to log in again

## API Endpoint

**POST** `/api/auth/invalidate`

### Invalidate Current Session

Invalidates only the current user's session:

```bash
curl -X POST http://your-domain/api/auth/invalidate \
  -H "Content-Type: application/json" \
  -d '{"type": "current"}'
```

### Invalidate All Sessions for a User

Invalidates all active sessions for a specific user:

```bash
curl -X POST http://your-domain/api/auth/invalidate \
  -H "Content-Type: application/json" \
  -d '{"type": "user", "username": "user1"}'
```

### Invalidate All Sessions

Invalidates all sessions for all users (global logout):

```bash
curl -X POST http://your-domain/api/auth/invalidate \
  -H "Content-Type: application/json" \
  -d '{"type": "all"}'
```

## Use Cases

1. **Password Change**: When a user changes their password, invalidate all their sessions
2. **Security Breach**: If a user's account is compromised, invalidate their sessions
3. **Admin Action**: Admin can force logout specific users
4. **Maintenance**: Force all users to re-authenticate after system updates

## Implementation Details

- Sessions are validated on every authenticated request
- Invalidated sessions return 401 Unauthorized
- Session invalidation is logged in the activity log
- Blacklist is stored in memory (cleared on restart)
- For production with multiple pods, consider using Redis for distributed blacklist

## Example: Invalidate User Sessions After Password Change

```typescript
// After password change
import { invalidateUserSessions } from '@/lib/auth';

// Invalidate all sessions for the user
invalidateUserSessions(username);
```

## Limitations

- **Memory-based**: Blacklist is stored in memory, so it's cleared on server restart
- **Single Instance**: Works within one pod/instance. For multi-pod deployments, use Redis
- **No persistent**: For production, consider storing invalidated tokens in a database

