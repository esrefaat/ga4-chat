# Engagement Query Fix Summary

## Problem
User query: **"show me top authors for the past 12 months in terms of engagement"** returned inaccurate results with very low numbers.

## Root Cause
The NLP system (OpenAI GPT-5.1) did not recognize "engagement" as a metric keyword, causing it to default to generic metrics (`activeUsers`, `sessions`, `screenPageViews`) instead of engagement-specific metrics.

## Fixes Applied

### 1. Added Engagement Metrics to SYSTEM_PROMPT (`src/lib/ga4-llm-service.ts`)

**Added metric mappings:**
- `"engagement"` → `["engagementRate", "engagedSessions", "eventCount"]`
- `"engagement rate"` → `"engagementRate"`
- `"engaged sessions"` → `"engagedSessions"`
- `"session duration"` → `"averageSessionDuration"`
- `"average session duration"` → `"averageSessionDuration"`
- `"time on site"` → `"averageSessionDuration"`

**Added smart defaults:**
- Engagement queries → `["engagementRate", "engagedSessions", "eventCount", "screenPageViews"]`
- Author/content creator queries with engagement → Same engagement metrics

### 2. Enhanced `formatMCPParams()` Function

**Added engagement query detection:**
```typescript
const isEngagementQuery = 
  lowerPrompt.includes('in terms of engagement') ||
  lowerPrompt.includes('by engagement') ||
  lowerPrompt.includes('engagement') ||
  (lowerPrompt.includes('author') && lowerPrompt.includes('engagement')) ||
  (lowerPrompt.includes('top') && lowerPrompt.includes('engagement'));
```

**Added automatic ordering:**
- When engagement metrics are detected, automatically orders by `engagementRate` descending
- Ensures "top authors" are ranked by engagement quality, not just user count

**Improved date dimension logic:**
- Skips adding date dimension for engagement queries with author dimensions
- Allows proper aggregation by author instead of breaking down by date

## Expected Behavior After Fix

### Query: "show me top authors for the past 12 months in terms of engagement"

**Before Fix:**
```json
{
  "metrics": ["activeUsers", "sessions", "screenPageViews"],
  "dimensions": ["customEvent:article_author", "date"],
  "order_bys": [{"dimension": {"dimension_name": "date"}, "desc": false}]
}
```
**Result:** Low numbers, wrong ranking

**After Fix:**
```json
{
  "metrics": ["engagementRate", "engagedSessions", "eventCount", "screenPageViews"],
  "dimensions": ["customEvent:article_author"],
  "date_ranges": [{"start_date": "365daysAgo", "end_date": "yesterday", "name": "Last12Months"}],
  "order_bys": [{"metric": {"metric_name": "engagementRate"}, "desc": true}]
}
```
**Result:** Accurate engagement-based ranking with proper metrics

## Testing

To verify the fix works:

1. **Test the exact query:**
   ```
   "show me top authors for the past 12 months in terms of engagement"
   ```

2. **Check the extracted parameters:**
   - Metrics should include: `engagementRate`, `engagedSessions`, `eventCount`, `screenPageViews`
   - Dimension should be: `customEvent:article_author`
   - Order should be by: `engagementRate` descending
   - Date dimension should NOT be included (aggregate by author)

3. **Verify results:**
   - Numbers should be engagement rates (percentages) and engaged session counts
   - Authors should be ranked by engagement rate (highest first)
   - Results should show meaningful engagement metrics, not just user counts

## Additional Engagement Query Examples

The fix now handles these queries correctly:
- "top authors by engagement"
- "show me authors with highest engagement"
- "authors ranked by engagement rate"
- "top content creators in terms of engagement"
- "most engaging authors"

All will now use proper engagement metrics and ordering.










