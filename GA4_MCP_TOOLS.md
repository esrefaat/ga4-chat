# GA4 MCP Tools Documentation

This document lists all available Google Analytics 4 (GA4) MCP tools and their parameters.

## Available Tools

### 1. `mcp_analytics-mcp_get_account_summaries`

**Description:** Retrieves information about the user's Google Analytics accounts and properties.

**Parameters:**
- None (no parameters required)

**Returns:**
- Account summaries with property information
- Includes account IDs, display names, and property lists

**Example Usage:**
```typescript
const result = await mcp_analytics-mcp_get_account_summaries();
```

**Response Structure:**
```json
{
  "name": "accountSummaries/{accountId}",
  "account": "accounts/{accountId}",
  "display_name": "Account Name",
  "property_summaries": [
    {
      "property": "properties/{propertyId}",
      "display_name": "Property Name",
      "property_type": "PROPERTY_TYPE_ORDINARY",
      "parent": "accounts/{accountId}"
    }
  ]
}
```

---

### 2. `mcp_analytics-mcp_get_property_details`

**Description:** Returns details about a specific GA4 property.

**Parameters:**
- `property_id` (required): The Google Analytics property ID
  - Type: `string | number`
  - Format: Can be a number (e.g., `358690483`) or a string with prefix (e.g., `"properties/358690483"`)

**Example Usage:**
```typescript
const result = await mcp_analytics-mcp_get_property_details({
  property_id: 358690483
});
// or
const result = await mcp_analytics-mcp_get_property_details({
  property_id: "properties/358690483"
});
```

**Response Structure:**
- Property details including name, display name, timezone, currency, etc.

---

### 3. `mcp_analytics-mcp_run_report`

**Description:** Runs a Google Analytics Data API report for historical data.

**Parameters:**
- `property_id` (required): The Google Analytics property ID
  - Type: `string | number`
  - Format: Can be a number or string with "properties/" prefix

- `date_ranges` (required): Array of date ranges
  - Type: `Array<{ start_date: string; end_date: string; name: string }>`
  - `start_date`: Can be:
    - Absolute date: `"2025-01-01"`
    - Relative: `"yesterday"`, `"today"`, `"7daysAgo"`, `"30daysAgo"`
  - `end_date`: Can be:
    - Absolute date: `"2025-01-31"`
    - Relative: `"yesterday"`, `"today"`
  - `name`: Optional name for the date range (e.g., `"Last30Days"`)

- `metrics` (required): Array of metric names
  - Type: `string[]`
  - Common metrics:
    - `"activeUsers"` - Active users
    - `"sessions"` - Sessions
    - `"screenPageViews"` - Page views
    - `"bounceRate"` - Bounce rate
    - `"bounces"` - Bounces
    - `"eventCount"` - Event count
    - `"totalRevenue"` - Total revenue
    - See [GA4 Metrics](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema#metrics) for full list

- `dimensions` (required): Array of dimension names
  - Type: `string[]`
  - Common dimensions:
    - `"date"` - Date
    - `"country"` - Country
    - `"city"` - City
    - `"deviceCategory"` - Device category
    - `"browser"` - Browser
    - `"sessionSource"` - Traffic source
    - `"pagePath"` - Page path (NOT valid for realtime reports)
    - See [GA4 Dimensions](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema#dimensions) for full list

- `dimension_filter` (optional): Filter expression for dimensions
  - Type: `object`
  - See [Filter Expression Format](https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/FilterExpression)

- `metric_filter` (optional): Filter expression for metrics
  - Type: `object`
  - See [Filter Expression Format](https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/FilterExpression)

- `order_bys` (optional): Array of ordering specifications
  - Type: `Array<object>`
  - See [OrderBy Format](https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/OrderBy)

- `limit` (optional): Maximum number of rows to return
  - Type: `number`
  - Default: None
  - Maximum: 250,000

- `offset` (optional): Row count of the start row (for pagination)
  - Type: `number`
  - Default: 0

- `currency_code` (optional): Currency code for currency values
  - Type: `string`
  - Format: ISO 4217 (e.g., `"USD"`, `"SAR"`, `"EUR"`)
  - Default: Property's default currency

- `return_property_quota` (optional): Whether to return property quota
  - Type: `boolean`
  - Default: `false`

**Example Usage:**
```typescript
const result = await mcp_analytics-mcp_run_report({
  property_id: 358690483,
  date_ranges: [
    {
      start_date: "30daysAgo",
      end_date: "yesterday",
      name: "Last30Days"
    }
  ],
  metrics: ["activeUsers", "sessions", "screenPageViews"],
  dimensions: ["date"],
  limit: 100
});
```

**Response Structure:**
```json
{
  "dimension_headers": [
    { "name": "date" }
  ],
  "metric_headers": [
    { "name": "activeUsers", "type_": "TYPE_INTEGER" }
  ],
  "rows": [
    {
      "dimension_values": [
        { "value": "20251117" }
      ],
      "metric_values": [
        { "value": "13951" }
      ]
    }
  ],
  "row_count": 7,
  "metadata": {
    "currency_code": "SAR",
    "time_zone": "Asia/Riyadh",
    "data_loss_from_other_row": false,
    "sampling_metadatas": []
  },
  "kind": "analyticsData#runReport",
  "totals": [],
  "maximums": [],
  "minimums": []
}
```

---

### 4. `mcp_analytics-mcp_run_realtime_report`

**Description:** Runs a Google Analytics Data API realtime report for current data.

**Parameters:**
- `property_id` (required): The Google Analytics property ID
  - Type: `string | number`

- `dimensions` (required): Array of realtime dimension names
  - Type: `string[]`
  - **Important:** Only realtime dimensions are allowed
  - Common realtime dimensions:
    - `"country"` - Country
    - `"city"` - City
    - `"deviceCategory"` - Device category
    - `"browser"` - Browser
    - `"sessionSource"` - Traffic source
    - **Note:** `"date"` and `"pagePath"` are NOT valid for realtime reports
  - See [Realtime Dimensions](https://developers.google.com/analytics/devguides/reporting/data/v1/realtime-api-schema#dimensions)

- `metrics` (required): Array of realtime metric names
  - Type: `string[]`
  - **Important:** Only realtime metrics are allowed
  - Common realtime metrics:
    - `"activeUsers"` - Active users
    - `"screenPageViews"` - Page views
    - See [Realtime Metrics](https://developers.google.com/analytics/devguides/reporting/data/v1/realtime-api-schema#metrics)

- `dimension_filter` (optional): Filter expression for dimensions
  - Type: `object`

- `metric_filter` (optional): Filter expression for metrics
  - Type: `object`

- `order_bys` (optional): Array of ordering specifications
  - Type: `Array<object>`

- `limit` (optional): Maximum number of rows to return
  - Type: `number`
  - Maximum: 250,000

- `offset` (optional): Row count of the start row
  - Type: `number`
  - Default: 0

- `return_property_quota` (optional): Whether to return realtime property quota
  - Type: `boolean`
  - Default: `false`

**Example Usage:**
```typescript
const result = await mcp_analytics-mcp_run_realtime_report({
  property_id: 358690483,
  dimensions: ["country", "deviceCategory"],
  metrics: ["activeUsers", "screenPageViews"],
  limit: 50
});
```

**Important Notes:**
- Realtime reports only show data from the last 30 minutes
- Not all dimensions/metrics available in regular reports are available in realtime
- `pagePath` dimension is NOT valid for realtime reports (use `run_report` instead)

---

### 5. `mcp_analytics-mcp_list_google_ads_links`

**Description:** Returns a list of links to Google Ads accounts for a property.

**Parameters:**
- `property_id` (required): The Google Analytics property ID
  - Type: `string | number`
  - Format: Can be a number or string with "properties/" prefix

**Example Usage:**
```typescript
const result = await mcp_analytics-mcp_list_google_ads_links({
  property_id: 358690483
});
```

**Response Structure:**
- Array of Google Ads links associated with the property

---

### 6. `mcp_analytics-mcp_get_custom_dimensions_and_metrics`

**Description:** Returns the property's custom dimensions and metrics.

**Parameters:**
- `property_id` (required): The Google Analytics property ID
  - Type: `string | number`
  - Format: Can be a number or string with "properties/" prefix

**Example Usage:**
```typescript
const result = await mcp_analytics-mcp_get_custom_dimensions_and_metrics({
  property_id: 358690483
});
```

**Response Structure:**
- Custom dimensions and metrics defined for the property
- Includes API names, display names, and descriptions

---

## Common Date Range Formats

### Relative Dates
- `"today"` - Today's date
- `"yesterday"` - Yesterday's date
- `"7daysAgo"` - 7 days ago
- `"30daysAgo"` - 30 days ago
- `"365daysAgo"` - 365 days ago

### Absolute Dates
- Format: `"YYYY-MM-DD"` (e.g., `"2025-01-01"`)

### Date Range Examples
```typescript
// Last 7 days
{
  start_date: "7daysAgo",
  end_date: "yesterday",
  name: "Last7Days"
}

// Last month (30 days)
{
  start_date: "30daysAgo",
  end_date: "yesterday",
  name: "Last30Days"
}

// Specific date range
{
  start_date: "2025-01-01",
  end_date: "2025-01-31",
  name: "January2025"
}
```

## Common Metrics

- `activeUsers` - Number of active users
- `sessions` - Number of sessions
- `screenPageViews` - Number of page views
- `bounceRate` - Bounce rate (percentage)
- `bounces` - Number of bounces
- `eventCount` - Number of events
- `totalRevenue` - Total revenue
- `averageSessionDuration` - Average session duration (in seconds)
- `conversions` - Number of conversions

## Common Dimensions

- `date` - Date (YYYYMMDD format)
- `country` - Country name
- `city` - City name
- `deviceCategory` - Device category (desktop, mobile, tablet)
- `browser` - Browser name
- `sessionSource` - Traffic source
- `pagePath` - Page path (NOT valid for realtime reports)
- `pageTitle` - Page title
- `eventName` - Event name

## Filter Expression Examples

### Simple Filter
```json
{
  "filter": {
    "field_name": "country",
    "string_filter": {
      "match_type": 2,
      "value": "United States",
      "case_sensitive": false
    }
  }
}
```

### AND Group Filter
```json
{
  "and_group": {
    "expressions": [
      {
        "filter": {
          "field_name": "deviceCategory",
          "string_filter": {
            "match_type": 1,
            "value": "mobile",
            "case_sensitive": false
          }
        }
      },
      {
        "filter": {
          "field_name": "country",
          "string_filter": {
            "match_type": 1,
            "value": "Saudi Arabia",
            "case_sensitive": false
          }
        }
      }
    ]
  }
}
```

## Order By Examples

### Order by Metric (Descending)
```json
{
  "metric": {
    "metric_name": "activeUsers"
  },
  "desc": true
}
```

### Order by Dimension (Ascending)
```json
{
  "dimension": {
    "dimension_name": "date"
  },
  "desc": false
}
```

## Error Handling

Common errors you may encounter:

1. **Invalid Dimension for Realtime Reports**
   - Error: `"Field pagePath is not a valid dimension"`
   - Solution: Use `run_report` instead of `run_realtime_report` for historical data with `pagePath`

2. **Invalid Property ID**
   - Error: `"Property not found"`
   - Solution: Verify the property ID using `get_account_summaries`

3. **Invalid Metric/Dimension**
   - Error: `"Field X is not a valid metric/dimension"`
   - Solution: Check the [GA4 API Schema](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema) for valid fields

4. **Date Range Issues**
   - Error: `"Invalid date range"`
   - Solution: Ensure `start_date` is before `end_date` and dates are in correct format

## References

- [GA4 Data API Documentation](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [GA4 API Schema - Dimensions](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema#dimensions)
- [GA4 API Schema - Metrics](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema#metrics)
- [Realtime API Schema](https://developers.google.com/analytics/devguides/reporting/data/v1/realtime-api-schema)
- [Filter Expression Format](https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/FilterExpression)

