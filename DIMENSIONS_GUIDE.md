# GA4 Dimensions Quick Reference Guide

This guide shows all the dimensions you can use in your queries and how to specify them.

## How to Use Dimensions in Queries

Simply mention the dimension in your query! For example:
- "Show me pageviews by country"
- "Get users by device and country"
- "Show sessions by city for property 358809672"

## Available Dimensions

### Time Dimensions
- **date** - Daily breakdown
  - Keywords: `date`, `day`, `daily`
  - Example: "Show pageviews by date"

- **week** - Weekly breakdown
  - Keywords: `week`, `weekly`
  - Example: "Get users by week"

- **month** - Monthly breakdown
  - Keywords: `month`, `monthly`
  - Example: "Show sessions by month"

- **year** - Yearly breakdown
  - Keywords: `year`, `yearly`
  - Example: "Get data by year"

- **hour** - Hourly breakdown
  - Keywords: `hour`, `hourly`
  - Example: "Show traffic by hour"

### Geographic Dimensions
- **country** - Country name
  - Keywords: `country`, `countries`
  - Example: "Show pageviews by country"

- **city** - City name
  - Keywords: `city`, `cities`
  - Example: "Get users by city"

- **region** - Geographic region
  - Keywords: `region`, `regions`
  - Example: "Show sessions by region"

- **continent** - Continent
  - Keywords: `continent`, `continents`
  - Example: "Get data by continent"

### Device Dimensions
- **deviceCategory** - Device type (desktop, mobile, tablet)
  - Keywords: `device`, `devices`, `device category`, `mobile`, `desktop`, `tablet`
  - Example: "Show pageviews by device"

- **operatingSystem** - Operating system
  - Keywords: `operating system`, `os`, `platform`
  - Example: "Get users by operating system"

- **browser** - Browser name
  - Keywords: `browser`, `browsers`
  - Example: "Show sessions by browser"

### Language Dimensions
- **language** - User language
  - Keywords: `language`, `languages`
  - Example: "Show pageviews by language"

- **languageCode** - Language code
  - Keywords: `locale`, `language code`
  - Example: "Get users by locale"

### Traffic Source Dimensions
- **sessionSource** - Traffic source
  - Keywords: `source`, `traffic source`, `referrer`
  - Example: "Show pageviews by source"

- **sessionMedium** - Traffic medium
  - Keywords: `medium`
  - Example: "Get users by medium"

- **sessionCampaignName** - Campaign name
  - Keywords: `campaign`
  - Example: "Show sessions by campaign"

### Page Dimensions
- **pagePath** - Page URL path
  - Keywords: `page path`, `pagepath`, `url`, `page` (when not part of "pageviews")
  - Example: "Show pageviews by page path"
  - ⚠️ Note: Not available for realtime reports

- **pageTitle** - Page title
  - Keywords: `page title`, `pagetitle`
  - Example: "Get users by page title"

### User Dimensions
- **newVsReturning** - New vs returning users
  - Keywords: `user type`, `new vs returning`
  - Example: "Show pageviews by user type"

### Event Dimensions
- **eventName** - Event name
  - Keywords: `event name`, `eventname`, `event`
  - Example: "Show events by event name"

### Content Dimensions
- **contentGroup1** - Content group
  - Keywords: `content group`, `contentgroup`
  - Example: "Show pageviews by content group"

## Examples

### Single Dimension
```
"Show me pageviews by country for property 358809672"
"Get users by device for the last 30 days"
"Show sessions by city"
```

### Multiple Dimensions
```
"Show pageviews by country and device"
"Get users by date and country"
"Show sessions by device, country, and language"
```

### Combined with Metrics
```
"Show pageviews and sessions by country"
"Get users and bounce rate by device"
"Show pageviews by country for property 358809672 for last month"
```

### With Date Ranges
```
"Show pageviews by country for property 358809672 from 1/8/2025 to 31/8/2025"
"Get users by device for the last 7 days"
"Show sessions by city this week"
```

## Automatic Features

1. **Automatic Date Ordering**: Data is automatically sorted by date (or first dimension) in ascending order
2. **Date Dimension**: If you specify other dimensions, date is automatically added as the first dimension for proper chronological ordering
3. **Smart Parsing**: The system recognizes dimension keywords in natural language

## Tips

- You can combine multiple dimensions: "by country and device"
- Date is always included for proper ordering (unless you explicitly exclude it)
- Dimensions are case-insensitive
- Use natural language - just mention what you want to see!

## Common Use Cases

- **Geographic Analysis**: "Show pageviews by country and city"
- **Device Analysis**: "Get users by device and operating system"
- **Traffic Analysis**: "Show sessions by source and medium"
- **Content Analysis**: "Show pageviews by page path"
- **Time Series**: "Show pageviews by date" (automatic)

