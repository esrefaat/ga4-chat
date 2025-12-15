/**
 * GA4 LLM Service
 * 
 * This service uses OpenAI to extract GA4 report parameters from natural language queries
 * and can iteratively refine queries based on GA4 MCP API feedback.
 */

import OpenAI from 'openai';
import { GA4ReportParams } from '@/app/api/ga4/mcp-bridge';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ExtractedGA4Params {
  property_id?: string;
  date_ranges?: Array<{ start_date: string; end_date: string; name: string }>;
  metrics?: string[];
  dimensions?: string[];
  dimension_filter?: any;
  metric_filter?: any;
  order_bys?: any[];
  limit?: number;
  chartType?: 'line' | 'bar' | 'pie' | 'doughnut';
  isComprehensiveReport?: boolean; // Flag for comprehensive/full breakdown reports
}

/**
 * System prompt for GA4 parameter extraction
 */
const SYSTEM_PROMPT = `You are an expert at parsing natural language queries about Google Analytics 4 (GA4) and extracting structured parameters for MCP API calls.

## PROPERTY ID EXTRACTION:
1. Extract 9+ digit numbers as property_id
2. Property name mappings:
   - "independent arabic" → "194176332"
   - "arabnews english" → "197199756"
   - "asharq al awsat" → "221805438"
   - "sayidaty" → "362050402"
   - "hia" → "362081617"
   - "manga arabia" → "376107957"
   - "srmg" → "379470462"
3. Default: "358809672" if none found

## DATE RANGES:
Extract date_ranges array with start_date, end_date, and name:

**Absolute dates (priority):**
- "1/8/2025 till 31/8/2025" → {start_date: "2025-08-01", end_date: "2025-08-31", name: "CustomRange_2025-08-01_2025-08-31"}
- "from 1/8/2025 to 31/8/2025" → {start_date: "2025-08-01", end_date: "2025-08-31", name: "CustomRange"}
- "between 1/8/2025 and 31/8/2025" → {start_date: "2025-08-01", end_date: "2025-08-31", name: "CustomRange"}
- "2025-08-01 to 2025-08-31" → {start_date: "2025-08-01", end_date: "2025-08-31", name: "CustomRange"}

**Month names:**
- "March 2025" → {start_date: "2025-03-01", end_date: "2025-03-31", name: "March2025"}
- "for the month of March 2025" → {start_date: "2025-03-01", end_date: "2025-03-31", name: "March2025"}
- "in March 2025" → {start_date: "2025-03-01", end_date: "2025-03-31", name: "March2025"}

**Relative dates:**
- "last 7 days" → {start_date: "7daysAgo", end_date: "yesterday", name: "Last7Days"}
- "7 days ago" → {start_date: "7daysAgo", end_date: "yesterday", name: "Last7Days"}
- "last week" → {start_date: "7daysAgo", end_date: "yesterday", name: "Last7Days"}
- "last month" → {start_date: "30daysAgo", end_date: "yesterday", name: "Last30Days"}
- "last year" → {start_date: "365daysAgo", end_date: "yesterday", name: "Last365Days"}
- "this week" → {start_date: "7daysAgo", end_date: "yesterday", name: "Last7Days"}
- "this month" → {start_date: "30daysAgo", end_date: "yesterday", name: "Last30Days"}
- "past 7 days" → {start_date: "7daysAgo", end_date: "yesterday", name: "Last7Days"}
- "previous 7 days" → {start_date: "7daysAgo", end_date: "yesterday", name: "Last7Days"}

**Default:** {start_date: "30daysAgo", end_date: "yesterday", name: "Last30Days"}

## METRICS:
Extract metrics array. Supported metrics:
- "active users", "users", "user" → "activeUsers"
- "sessions", "session" → "sessions"
- "pageviews", "page views", "pageview", "page view", "views" → "screenPageViews"
- "bounce rate" → "bounceRate"
- "bounces" → "bounces"
- "events" → "eventCount"
- "revenue" → "totalRevenue"
- "engagement" → ["engagementRate", "engagedSessions", "eventCount"]
- "engagement rate" → "engagementRate"
- "engaged sessions" → "engagedSessions"
- "session duration" → "averageSessionDuration"
- "average session duration" → "averageSessionDuration"
- "time on site" → "averageSessionDuration"

**Smart defaults based on context:**
- Engagement queries ("in terms of engagement", "by engagement", "engagement") → ["engagementRate", "engagedSessions", "eventCount", "screenPageViews"]
- Author/content creator queries with engagement → ["engagementRate", "engagedSessions", "eventCount", "screenPageViews"]
- Traffic source/channel queries → ["sessions", "activeUsers"]
- Pageview queries → ["screenPageViews", "sessions"]
- Default → ["activeUsers", "sessions", "screenPageViews"]

## DIMENSIONS:
Extract dimensions array. Supported dimensions:

**Time:** date, week, month, year, hour
**Geographic:** country, city, region, continent
**Device:** deviceCategory, operatingSystem, browser
**Language:** language, languageCode
**Traffic:** sessionSource, sessionMedium, sessionCampaignName, sessionDefaultChannelGroup
**Page:** pagePath, pageTitle
**User:** newVsReturning
**Event:** eventName
**Content:** contentGroup1
**Custom:** customEvent:article_author (for "author", "authors", "article author", "by author")

**Special handling:**
- "traffic sources", "sources" → sessionSource
- "channels", "channel" → sessionDefaultChannelGroup
- "devices", "device" → deviceCategory
- "countries", "country" → country
- "browsers", "browser" → browser
- "authors", "author" → customEvent:article_author

**Smart date addition:**
- Add "date" as first dimension if:
  - No dimensions specified AND date range exists
  - Dimensions specified but no date AND not pie chart AND not categorical dimension
- Skip date if: pie chart requested OR categorical dimension without date

**Default:** ["date"]

## FILTERS:
Extract dimension_filter object:

**Country filters:**
- "from saudi arabia" → {filter: {field_name: "country", string_filter: {match_type: 1, value: "saudi arabia", case_sensitive: false}}}
- "in united states" → {filter: {field_name: "country", string_filter: {match_type: 1, value: "united states", case_sensitive: false}}}
- Common countries: saudi arabia, united states, usa, uk, uae, egypt, jordan, lebanon, kuwait, qatar, bahrain, oman, canada, australia, france, germany, italy, spain, india, china, japan, etc.

**City filters:**
- "in riyadh" → {filter: {field_name: "city", string_filter: {match_type: 2, value: "riyadh", case_sensitive: false}}}

**Device filters:**
- "on mobile" → {filter: {field_name: "deviceCategory", string_filter: {match_type: 2, value: "mobile", case_sensitive: false}}}
- "on desktop" → {filter: {field_name: "deviceCategory", string_filter: {match_type: 2, value: "desktop", case_sensitive: false}}}
- "on tablet" → {filter: {field_name: "deviceCategory", string_filter: {match_type: 2, value: "tablet", case_sensitive: false}}}

**Multiple filters:** Use and_group:
{and_group: {expressions: [{filter: {...}}, {filter: {...}}]}}

## LIMIT:
Extract limit number:
- "top 20" → limit: 20
- "limit 20" → limit: 20
- "first 10" → limit: 10
- "only top 5" → limit: 5
- "show 10" → limit: 10
- Max: 250000

## CHART TYPE:
Extract chartType (optional):
- "pie chart" → "pie"
- "doughnut chart" → "doughnut"
- "bar chart" → "bar"
- "line chart" → "line"

## COMPREHENSIVE REPORTS:
Detect when user requests a "full breakdown", "comprehensive report", "complete analysis", or similar.
CRITICAL: If the user asks for ANY of these phrases, set isComprehensiveReport: true:
- "full breakdown" or "full breakdown of" → isComprehensiveReport: true
- "comprehensive report" → isComprehensiveReport: true
- "complete report" → isComprehensiveReport: true
- "full analysis" → isComprehensiveReport: true
- "detailed report" → isComprehensiveReport: true
- "traffic metrics breakdown" → isComprehensiveReport: true
- "give me everything" → isComprehensiveReport: true
- "breakdown of my traffic" → isComprehensiveReport: true
- "complete breakdown" → isComprehensiveReport: true

Examples that should trigger comprehensive reports:
- "give me a full breakdown of my traffic metrics" → isComprehensiveReport: true
- "full breakdown of traffic" → isComprehensiveReport: true
- "comprehensive traffic report" → isComprehensiveReport: true

When isComprehensiveReport is true, the system will generate multiple queries for:
- Overview metrics (sessions, users, newUsers, screenPageViews, averageSessionDuration)
- Engagement metrics (engagementRate, bounceRate)
- Traffic by channel
- Top countries
- Browser usage
- Device distribution
- Daily trends

## OUTPUT FORMAT:
Return ONLY valid JSON with this structure:
{
  "property_id": "358809672",
  "date_ranges": [{"start_date": "30daysAgo", "end_date": "yesterday", "name": "Last30Days"}],
  "metrics": ["activeUsers", "sessions"],
  "dimensions": ["date"],
  "dimension_filter": {...},  // Optional
  "limit": 100,  // Optional
  "chartType": "line",  // Optional
  "isComprehensiveReport": false  // Optional, true for comprehensive reports
}

IMPORTANT: Return ONLY the JSON object, no explanations or markdown.`;

/**
 * Extracts GA4 parameters from natural language using LLM
 */
export async function extractGA4Params(prompt: string): Promise<ExtractedGA4Params> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-5.1',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from LLM');
    }

    // Parse JSON response
    let extractedParams: ExtractedGA4Params;
    try {
      extractedParams = JSON.parse(content);
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedParams = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error(`Failed to parse LLM response as JSON: ${content.substring(0, 200)}`);
      }
    }

    return extractedParams;
  } catch (error) {
    console.error('Error extracting GA4 params with LLM:', error);
    throw new Error(
      `Failed to extract GA4 parameters: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Refines GA4 parameters based on MCP API error feedback
 */
export async function refineGA4Params(
  originalPrompt: string,
  originalParams: ExtractedGA4Params,
  errorMessage: string
): Promise<ExtractedGA4Params> {
  const refinementPrompt = `The previous GA4 query failed with this error: ${errorMessage}

Original query: "${originalPrompt}"
Original parameters: ${JSON.stringify(originalParams, null, 2)}

Please refine the parameters to fix the error. Common issues:
- Invalid property_id (must be 9+ digits)
- Invalid dimension/metric names
- Date format issues
- Filter syntax errors

Return ONLY valid JSON with corrected parameters:`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-5.1',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: refinementPrompt },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from LLM refinement');
    }

    const refinedParams = JSON.parse(content);
    return refinedParams;
  } catch (error) {
    console.error('Error refining GA4 params:', error);
    // Return original params if refinement fails
    return originalParams;
  }
}

/**
 * Converts extracted params to MCP-ready format with smart defaults
 */
export function formatMCPParams(
  extractedParams: ExtractedGA4Params,
  originalPrompt: string,
  defaultPropertyId?: string
): GA4ReportParams {
  const lowerPrompt = originalPrompt.toLowerCase();

  // Smart metric defaults based on query context
  let defaultMetrics = ['activeUsers', 'sessions', 'screenPageViews'];
  
  // Check for engagement queries (highest priority)
  const isEngagementQuery = 
    lowerPrompt.includes('in terms of engagement') ||
    lowerPrompt.includes('by engagement') ||
    lowerPrompt.includes('engagement') ||
    (lowerPrompt.includes('author') && lowerPrompt.includes('engagement')) ||
    (lowerPrompt.includes('top') && lowerPrompt.includes('engagement'));
  
  if (isEngagementQuery) {
    defaultMetrics = ['engagementRate', 'engagedSessions', 'eventCount', 'screenPageViews'];
  } else if (
    lowerPrompt.includes('traffic source') ||
    lowerPrompt.includes('source') ||
    lowerPrompt.includes('referrer') ||
    lowerPrompt.includes('medium') ||
    lowerPrompt.includes('campaign') ||
    lowerPrompt.includes('channel') ||
    lowerPrompt.includes('organic') ||
    lowerPrompt.includes('paid')
  ) {
    defaultMetrics = ['sessions', 'activeUsers'];
  } else if (
    lowerPrompt.includes('pageview') ||
    lowerPrompt.includes('page view') ||
    (lowerPrompt.includes('view') && !lowerPrompt.includes('overview'))
  ) {
    defaultMetrics = ['screenPageViews', 'sessions'];
  }

  // Smart dimension defaults
  const categoricalDimensions = [
    'sessionDefaultChannelGroup',
    'sessionSource',
    'country',
    'deviceCategory',
    'browser',
    'operatingSystem',
  ];
  const hasCategoricalDimension = extractedParams.dimensions?.some((dim) =>
    categoricalDimensions.includes(dim)
  );
  const wantsPieChart =
    extractedParams.chartType === 'pie' ||
    extractedParams.chartType === 'doughnut' ||
    lowerPrompt.match(/\b(?:pie|doughnut)\s+chart\b/i) !== null ||
    lowerPrompt.match(/\bchart.*pie\b/i) !== null ||
    lowerPrompt.match(/\bpie\b/i) !== null;

  let defaultDimensions = ['date'];
  if (wantsPieChart || (hasCategoricalDimension && !extractedParams.dimensions?.includes('date'))) {
    defaultDimensions = extractedParams.dimensions || [];
  }

  // Build MCP-ready parameters
  // extractedParams.property_id should already be set correctly by handleReportQuery
  // Use it directly, with defaultPropertyId as fallback only if extractedParams.property_id is missing
  const finalPropertyId = extractedParams.property_id || defaultPropertyId || '358809672';
  const mcpParams: GA4ReportParams = {
    property_id: finalPropertyId,
    date_ranges:
      extractedParams.date_ranges || [
        {
          start_date: '30daysAgo',
          end_date: 'yesterday',
          name: 'Last30Days',
        },
      ],
    metrics: extractedParams.metrics || defaultMetrics,
    dimensions: extractedParams.dimensions || defaultDimensions,
    ...(extractedParams.dimension_filter && { dimension_filter: extractedParams.dimension_filter }),
    ...(extractedParams.metric_filter && { metric_filter: extractedParams.metric_filter }),
    ...(extractedParams.order_bys && { order_bys: extractedParams.order_bys }),
    ...(extractedParams.limit && extractedParams.limit <= 250000 && { limit: extractedParams.limit }),
  };

  // Smart date dimension addition
  // Skip date dimension for engagement queries with author/content dimensions (aggregate by author, not time)
  const hasAuthorDimension = mcpParams.dimensions.some(dim => 
    dim.includes('author') || dim.includes('article')
  );
  const shouldSkipDateForEngagement = isEngagementQuery && hasAuthorDimension;
  
  if (
    mcpParams.dimensions.length > 0 &&
    !mcpParams.dimensions.includes('date') &&
    mcpParams.date_ranges &&
    !shouldSkipDateForEngagement
  ) {
    const explicitNoDate = lowerPrompt.match(/\b(?:no|without|excluding)\s+date\b/i);
    if (!explicitNoDate && !wantsPieChart && !hasCategoricalDimension) {
      mcpParams.dimensions.unshift('date');
    }
  } else if (
    mcpParams.dimensions.length === 0 && 
    mcpParams.date_ranges && 
    !wantsPieChart && 
    !shouldSkipDateForEngagement
  ) {
    mcpParams.dimensions.push('date');
  }

  // Add default order_bys
  if (!mcpParams.order_bys) {
    // For engagement queries, order by engagementRate descending
    const hasEngagementMetrics = mcpParams.metrics.some(metric => 
      metric === 'engagementRate' || metric === 'engagedSessions'
    );
    
    if (hasEngagementMetrics && isEngagementQuery) {
      // Order by engagementRate descending for engagement queries
      mcpParams.order_bys = [
        {
          metric: { metric_name: 'engagementRate' },
          desc: true,
        },
      ];
    } else {
      // Default: order by primary dimension
      const primaryDimension = mcpParams.dimensions.includes('date')
        ? 'date'
        : mcpParams.dimensions[0];
      if (primaryDimension) {
        mcpParams.order_bys = [
          {
            dimension: { dimension_name: primaryDimension },
            desc: false,
          },
        ];
      }
    }
  }

  return mcpParams;
}

