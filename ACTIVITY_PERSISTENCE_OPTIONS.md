# Activity Persistence Options

Currently, activity logs are stored in-memory and cleared on server restart. Here are options for persistent storage:

## Option 1: PostgreSQL Database (Recommended for Production)

**Pros:**
- Relational data with proper schema
- ACID compliance
- SQL queries for filtering/searching
- Works well with existing PostgreSQL infrastructure
- Supports complex queries and reporting

**Implementation:**
```typescript
// Create table:
CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  username VARCHAR(255) NOT NULL,
  action VARCHAR(255) NOT NULL,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_username ON activity_logs(username);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
```

**Libraries:** `pg`, `@prisma/client`, `typeorm`, `sequelize`

## Option 2: File-Based Storage (JSON/CSV)

**Pros:**
- Simple implementation
- No database required
- Easy to backup
- Human-readable format

**Cons:**
- Not suitable for high-volume
- File locking issues with multiple pods
- Limited query capabilities

**Implementation:**
- Write logs to `/app/logs/activity-YYYY-MM-DD.json`
- Rotate files daily
- Use file system with shared volume in Kubernetes

## Option 3: Redis (Fast, Temporary)

**Pros:**
- Very fast writes
- Built-in expiration
- Works across multiple pods
- Good for recent logs

**Cons:**
- Not permanent (unless configured)
- Limited query capabilities
- Memory-based

**Implementation:**
- Store logs with TTL (e.g., 30 days)
- Use Redis Lists or Streams
- Export to database periodically for long-term storage

## Option 4: External Logging Services

**Options:**
- **Datadog**: Structured logging, search, dashboards
- **LogRocket**: Session replay + logs
- **Sentry**: Error tracking + activity logs
- **CloudWatch** (AWS): Native AWS logging
- **Google Cloud Logging**: GCP native solution

**Pros:**
- Managed service
- Built-in search and analytics
- Alerting capabilities
- No infrastructure management

**Cons:**
- Cost per GB
- Vendor lock-in
- External dependency

## Option 5: MongoDB

**Pros:**
- Flexible schema (JSON-like)
- Good for unstructured logs
- Horizontal scaling
- Rich query capabilities

**Cons:**
- Additional infrastructure
- Learning curve if team uses SQL

## Option 6: Elasticsearch (For Search-Heavy Use Cases)

**Pros:**
- Excellent search capabilities
- Full-text search
- Aggregations and analytics
- Scalable

**Cons:**
- Complex setup
- Resource intensive
- Overkill for simple logging

## Recommendation

**For Production:**
1. **Primary**: PostgreSQL (you already have it)
   - Store all activity logs
   - Queryable and reliable
   - Integrates with existing infrastructure

2. **Optional**: Redis for recent logs cache
   - Fast access to last 1000 logs
   - Reduce database load

**Implementation Steps:**
1. Create `activity_logs` table in PostgreSQL
2. Update `activity-logger.ts` to write to database
3. Keep in-memory cache for recent logs (optional)
4. Add database connection pooling
5. Add migration scripts

**Quick Start (PostgreSQL):**
```sql
-- Run in your PostgreSQL database
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  username VARCHAR(255) NOT NULL,
  action VARCHAR(255) NOT NULL,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT
);

CREATE INDEX idx_activity_username ON activity_logs(username);
CREATE INDEX idx_activity_timestamp ON activity_logs(timestamp DESC);
CREATE INDEX idx_activity_action ON activity_logs(action);
```

**Environment Variables Needed:**
```env
POSTGRES_HOST=postgres-service.shared-services.svc.cluster.local
POSTGRES_PORT=5432
POSTGRES_DB=ga4_chat
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
```

## Current Status

- ✅ In-memory storage (10,000 logs max)
- ✅ Activity logging API endpoint
- ⚠️ Logs cleared on pod restart
- ⚠️ Not shared across pods

## Next Steps

1. Choose persistence option
2. Implement database/file storage
3. Update activity-logger.ts
4. Add migration scripts
5. Test with multiple pods
6. Add retention policies (e.g., keep logs for 90 days)

