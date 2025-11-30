# Dimensions vs Filters - Understanding the Difference

## Key Concept

The same field (like `country`, `city`, `deviceCategory`) can be used in **two different ways**:

1. **As a Dimension** - Breaks down/group data
2. **As a Filter** - Restricts/filters data

## Dimensions (Break Down Data)

**Purpose**: Group and break down your data

**Syntax**: "by [dimension]" or "by [dimension] and [dimension]"

**Examples**:
- "Show pageviews **by country**" → Groups data by country (shows all countries)
- "Get users **by device**" → Groups data by device type (shows mobile, desktop, tablet)
- "Show sessions **by country and device**" → Groups by both dimensions

**Result**: Returns multiple rows, one for each dimension value

## Filters (Restrict Data)

**Purpose**: Limit data to specific values

**Syntax**: "from [value]", "in [value]", "on [value]"

**Examples**:
- "Show pageviews **from saudi arabia**" → Only shows data for Saudi Arabia (one country)
- "Get users **on mobile**" → Only shows mobile device data
- "Show sessions **in riyadh**" → Only shows data for Riyadh city

**Result**: Returns filtered data (only matching the filter criteria)

## The Same Field, Different Uses

| Field | As Dimension | As Filter |
|-------|-------------|-----------|
| `country` | "by country" → Shows all countries | "from saudi arabia" → Only Saudi Arabia |
| `city` | "by city" → Shows all cities | "in riyadh" → Only Riyadh |
| `deviceCategory` | "by device" → Shows all devices | "on mobile" → Only mobile |
| `browser` | "by browser" → Shows all browsers | "from chrome" → Only Chrome |
| `sessionSource` | "by source" → Shows all sources | "from google" → Only Google |

## Combining Dimensions and Filters

You can use both together:

- "Show pageviews **by country** **from saudi arabia**" 
  - Dimension: country (groups by country)
  - Filter: saudi arabia (but since we're filtering to one country, this is redundant)
  
- "Show pageviews **by device** **on mobile**"
  - Dimension: device (groups by device)
  - Filter: mobile (but since we're filtering to mobile, this is redundant)

**Better examples**:
- "Show pageviews **by city** **from saudi arabia**" 
  - Filter: saudi arabia (only Saudi Arabia data)
  - Dimension: city (break down by cities within Saudi Arabia)

- "Show pageviews **by date** **on mobile**"
  - Filter: mobile (only mobile devices)
  - Dimension: date (break down by date)

## Current Implementation

### Supported Dimensions (from GA4_MCP_TOOLS.md)

✅ All dimensions from the documentation are supported:

1. ✅ `date` - Keywords: "date", "day", "daily"
2. ✅ `country` - Keywords: "country", "countries"
3. ✅ `city` - Keywords: "city", "cities"
4. ✅ `deviceCategory` - Keywords: "device", "devices", "device category"
5. ✅ `browser` - Keywords: "browser", "browsers"
6. ✅ `sessionSource` - Keywords: "source", "traffic source", "referrer"
7. ✅ `pagePath` - Keywords: "page path", "pagepath", "url"

### Supported Filters

✅ Filter detection for:
- **Country**: "from [country]", "in [country]"
- **City**: "in [city]"
- **Device**: "on mobile", "on desktop", "on tablet"

## Examples

### Dimension Only
```
"Show pageviews by country"
→ Returns: One row per country with pageviews
```

### Filter Only
```
"Show pageviews from saudi arabia"
→ Returns: Total pageviews for Saudi Arabia only
```

### Dimension + Filter
```
"Show pageviews by city from saudi arabia"
→ Returns: One row per city in Saudi Arabia with pageviews
```

### Multiple Dimensions
```
"Show pageviews by country and device"
→ Returns: One row per country-device combination
```

## How to Use

**To break down data** (dimension):
- Use "by [dimension]"
- Example: "by country", "by device", "by city"

**To filter data** (filter):
- Use "from [value]", "in [value]", "on [value]"
- Example: "from saudi arabia", "in riyadh", "on mobile"

**To do both**:
- Combine them: "by [dimension] from [value]"
- Example: "by city from saudi arabia"

