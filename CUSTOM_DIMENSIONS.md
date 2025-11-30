# Custom Dimensions Support

## Article Author Dimension

The system now supports querying by article author. The author dimension is typically a custom dimension in GA4.

### Supported Keywords

You can use any of these phrases to query by author:
- "author"
- "authors"
- "article author"
- "article authors"
- "writer"
- "writers"
- "by author"
- "by authors"

### Example Queries

```
"Show me pageviews by author for property 358809672 last month"
"Get pageviews by article author for 358809672"
"Show me top 20 authors by pageviews for property 358809672"
"Get sessions by author for last 30 days"
```

## Custom Dimension Format

The system uses `customEvent:article_author` as the format for the author dimension. This is the actual dimension name configured in your GA4 property.

### Custom Dimension Scopes

GA4 custom dimensions can have different scopes:
- **Event-scoped**: `customEvent:dimensionName` (most common for article author)
- **User-scoped**: `customUser:dimensionName`
- **Parameter-scoped**: `customParameter:dimensionName`

### Current Author Dimension

The author dimension is configured as: **`customEvent:article_author`**

This is the actual dimension name in your GA4 property. All author-related queries will use this dimension.

### If You Need to Change It

If you need to use a different author dimension name:

1. **Check your GA4 property's custom dimensions**:
   - Go to GA4 Admin → Custom Definitions → Custom Dimensions
   - Find your author dimension
   - Note the exact API name

2. **Update the dimension name in code**:
   - Edit `/src/lib/ga4-query-handler.ts`
   - Find the author dimension mappings (around line 652)
   - Change `'customEvent:article_author'` to your actual dimension name

3. **Or use the MCP tool to discover custom dimensions**:
   ```typescript
   // You can call this to see all custom dimensions for a property
   const customDims = await mcp_analytics-mcp_get_custom_dimensions_and_metrics({
     property_id: 358809672
   });
   ```

## Finding Your Custom Dimensions

You can query your property's custom dimensions using the GA4 MCP tool:

**Query**: "Get custom dimensions for property 358809672"

This will show you all available custom dimensions and their exact API names.

## Common Custom Dimensions

Besides author, you might have other custom dimensions like:
- Article category
- Article tags
- Content type
- Section
- etc.

To add support for these, follow the same pattern in `/src/lib/ga4-query-handler.ts`.

