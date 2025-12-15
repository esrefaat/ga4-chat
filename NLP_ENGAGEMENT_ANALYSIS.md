# NLP Engagement Query Analysis

## Problem Statement
User query: **"show me top authors for the past 12 months in terms of engagement"**

The query returned inaccurate results with very low numbers.

## Root Cause Analysis

### 1. NLP System Used
- **Model**: OpenAI GPT-5.1 (`gpt-5.1`)
- **Location**: `src/lib/ga4-llm-service.ts`
- **Function**: `extractGA4Params()` - Extracts GA4 parameters from natural language queries

### 2. What the System Prepared for GA4 MCP

The LLM system prompt (`SYSTEM_PROMPT`) extracts:
- ✅ **Dimension**: `customEvent:article_author` (correctly mapped from "authors")
- ✅ **Date Range**: `365daysAgo` to `yesterday` (correctly mapped from "past 12 months")
- ❌ **Metrics**: **MISSING engagement metrics mapping!**

### 3. The Critical Gap

**Current SYSTEM_PROMPT metrics section (lines 73-86):**
```typescript
## METRICS:
Extract metrics array. Supported metrics:
- "active users", "users", "user" → "activeUsers"
- "sessions", "session" → "sessions"
- "pageviews", "page views", "pageview", "page view", "views" → "screenPageViews"
- "bounce rate" → "bounceRate"
- "bounces" → "bounces"
- "events" → "eventCount"
- "revenue" → "totalRevenue"

**Smart defaults based on context:**
- Traffic source/channel queries → ["sessions", "activeUsers"]
- Pageview queries → ["screenPageViews", "sessions"]
- Default → ["activeUsers", "sessions", "screenPageViews"]
```

**Missing Engagement Metrics:**
- ❌ No mapping for "engagement" keyword
- ❌ No mapping for "engagement rate"
- ❌ No mapping for "engaged sessions"
- ❌ No smart defaults for engagement queries

### 4. What Actually Happened

When the user said **"in terms of engagement"**, the LLM:
1. ✅ Correctly extracted dimension: `customEvent:article_author`
2. ✅ Correctly extracted date range: `365daysAgo` to `yesterday`
3. ❌ **Failed to recognize "engagement"** → Defaulted to `["activeUsers", "sessions", "screenPageViews"]`
4. ❌ Used wrong metrics → Query returned low numbers because:
   - `activeUsers` counts unique users, not engagement
   - `sessions` counts sessions, not engagement quality
   - `screenPageViews` counts views, not engagement depth

### 5. What Should Have Happened

For "engagement" queries, the system should use:
- `engagementRate` - Percentage of engaged sessions
- `engagedSessions` - Number of engaged sessions  
- `eventCount` - Total events (indicates user interaction)
- `screenPageViews` - Page views (content consumption)
- `averageSessionDuration` - Time spent (engagement depth)

**Proper engagement metrics for author analysis:**
```json
{
  "metrics": ["engagementRate", "engagedSessions", "eventCount", "screenPageViews"],
  "dimensions": ["customEvent:article_author"],
  "date_ranges": [{"start_date": "365daysAgo", "end_date": "yesterday", "name": "Last12Months"}],
  "order_bys": [{"metric": {"metric_name": "engagementRate"}, "desc": true}]
}
```

### 6. Why Numbers Were Low

1. **Wrong Metric Focus**: Using `activeUsers` instead of `engagementRate` means:
   - Counting unique users per author (low numbers)
   - Not measuring engagement quality (high engagement rate = better content)

2. **Missing Engagement Context**: Without `engagementRate` or `engagedSessions`, the query can't properly rank authors by engagement quality.

3. **Incorrect Ordering**: Without engagement-specific `order_bys`, results aren't sorted by engagement metrics.

## Solution

### Fix 1: Add Engagement Metrics to SYSTEM_PROMPT

Add to metrics section:
```typescript
- "engagement" → ["engagementRate", "engagedSessions", "eventCount"]
- "engagement rate" → "engagementRate"
- "engaged sessions" → "engagedSessions"
- "events" → "eventCount"
- "session duration" → "averageSessionDuration"
```

### Fix 2: Add Smart Defaults for Engagement Queries

Add to smart defaults:
```typescript
- Engagement/author queries → ["engagementRate", "engagedSessions", "eventCount", "screenPageViews"]
- "in terms of engagement" → ["engagementRate", "engagedSessions", "eventCount"]
```

### Fix 3: Add Ordering Logic

When engagement metrics are detected, automatically add:
```typescript
order_bys: [{
  metric: { metric_name: "engagementRate" },
  desc: true
}]
```

## Impact

**Before Fix:**
- Query: "top authors in terms of engagement"
- Metrics: `["activeUsers", "sessions", "screenPageViews"]`
- Result: Low numbers, wrong ranking

**After Fix:**
- Query: "top authors in terms of engagement"  
- Metrics: `["engagementRate", "engagedSessions", "eventCount", "screenPageViews"]`
- Order: By `engagementRate` descending
- Result: Accurate engagement-based ranking










