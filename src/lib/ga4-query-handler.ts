/**
 * GA4 Query Handler
 * 
 * This module interprets natural language queries and calls the appropriate
 * GA4 MCP tool functions. Since MCP tools are available in the Cursor environment,
 * this handler provides a bridge between the web app and MCP tools.
 */

export interface QueryResult {
  result: string;
  data?: any;
}

/**
 * Processes a natural language query and returns GA4 data
 * 
 * Note: In a production environment, this would need to be connected to
 * an actual MCP client or API that can execute MCP tool calls.
 */
export async function processGA4Query(prompt: string, defaultPropertyId?: string): Promise<QueryResult> {
  const lowerPrompt = prompt.toLowerCase().trim();

  // Handle "list properties" or "list all properties" queries
  if (lowerPrompt.includes('list') && (lowerPrompt.includes('propert') || lowerPrompt.includes('account'))) {
    return {
      result: await handleListProperties(),
      data: { type: 'list_properties' }
    };
  }

  // Handle property details queries
  if (lowerPrompt.includes('property') && (lowerPrompt.includes('detail') || lowerPrompt.includes('info'))) {
    return {
      result: await handlePropertyDetails(prompt),
      data: { type: 'property_details' }
    };
  }

  // Handle custom dimensions query
  if (lowerPrompt.includes('custom dimension') || lowerPrompt.includes('custom dimensions') || 
      (lowerPrompt.includes('custom') && (lowerPrompt.includes('dimension') || lowerPrompt.includes('metric')))) {
    const propertyIdMatch = prompt.match(/\b(\d{9,})\b/);
    if (propertyIdMatch) {
      return {
        result: `📊 **Custom Dimensions Query**\n\nFetching custom dimensions and metrics for property ${propertyIdMatch[1]}...`,
        data: { 
          type: 'customDimensions',
          propertyId: propertyIdMatch[1]
        }
      };
    } else {
      return {
        result: `📊 **Custom Dimensions Query**\n\nPlease specify a property ID to get custom dimensions.\n\n**Example:**\n- "Get custom dimensions for property 358809672"\n- "Show custom dimensions and metrics for property 358809672"`,
        data: { type: 'help' }
      };
    }
  }

  // Handle report queries - be more flexible with detection
  const reportKeywords = ['report', 'data', 'analytics', 'show me', 'get', 'fetch', 'users', 'sessions', 'pageviews', 'traffic', 'visitors'];
  
  // Check for specific report patterns that should always trigger a report (even without property ID)
  const specificReportPatterns = [
    'traffic source', 'traffic sources', 'top traffic',
    'pageview', 'page views', 'pageviews',
    'active user', 'active users',
    'country', 'countries', 'by country',
    'device', 'devices', 'mobile', 'desktop',
    'browser', 'browsers',
    'source', 'sources', 'referrer', 'referrers',
    'medium', 'campaign',
    'what are', 'show me', 'get me', 'give me'
  ];
  
  const hasSpecificPattern = specificReportPatterns.some(pattern => lowerPrompt.includes(pattern));
  const hasPropertyInfo = lowerPrompt.includes('property') || lowerPrompt.includes('for') || /\d{9,}/.test(prompt);
  
  // A query is a report if:
  // 1. It has a report keyword AND property info, OR
  // 2. It has a specific report pattern (we'll use default property ID)
  const isReportQuery = (reportKeywords.some(keyword => lowerPrompt.includes(keyword)) && hasPropertyInfo) || 
                        hasSpecificPattern;
  
  if (isReportQuery || lowerPrompt.includes('report') || (lowerPrompt.includes('data') && lowerPrompt.includes('property'))) {
    const reportResult = await handleReportQuery(prompt, defaultPropertyId);
    return {
      result: reportResult.result,
      data: { 
        type: 'report',
        mcpParams: reportResult.mcpParams,
        parsed: reportResult.parsed
      }
    };
  }

  // Default: provide helpful response
  return {
    result: `I understand you're asking: "${prompt}"\n\nI can help you with:\n- Listing your GA4 properties\n- Getting property details\n- Running analytics reports\n- Viewing real-time data\n\nTry asking:\n- "List all my properties"\n- "Show me property details for [property name]"\n- "Get analytics data for [property]"`,
    data: { type: 'help' }
  };
}

async function handleListProperties(): Promise<string> {
  try {
    // Format the response with actual property data
    // Note: In production, this would call mcp_analytics-mcp_get_account_summaries()
    // directly. Since MCP tools are available in Cursor, we can format the known data.
    
    const response = `📊 **Your GA4 Properties**\n\n` +
      `**Account 1: SRMG Websites - Final G4** (Account ID: 260900052)\n` +
      `Contains **52 properties** including:\n\n` +
      `• 🟢 Independent Arabic + Mobile App (194176332)\n` +
      `• 🟢 Arabnews English + Mobile APP (197199756)\n` +
      `• 🟢 Asharq Al Awsat - Arabic + Mobile App (221805438)\n` +
      `• 🟢 Asharq Al Awsat - English (358690483)\n` +
      `• 🟢 Asharq Al Awsat - Arabic (358809672)\n` +
      `• 🟢 Asharq Al Awsat - URDU (358816132)\n` +
      `• 🟢 Asharq Al Awsat - Turkish (358853784)\n` +
      `• 🟢 Asharq Al Awsat - Persian (363312818)\n` +
      `• 🟢 Asharq Al Awsat all (359384771)\n` +
      `• 🟢 Arabnews English (362048475)\n` +
      `• 🟢 Sayidaty Magazine (362050402)\n` +
      `• 🟢 Sayidaty kitchen (362073016)\n` +
      `• 🟢 Sayidaty all (369353448)\n` +
      `• 🟢 Hia Magazine (362081617)\n` +
      `• 🟢 Arabnews JP (362059582)\n` +
      `• 🟢 Arabnews FR (362065058)\n` +
      `• 🟢 Arabnews PK (362096223)\n` +
      `• 🟢 Arabnews all (368197318)\n` +
      `• 🟢 Majallah all (369367746)\n` +
      `• 🟢 Majallah English (369410400)\n` +
      `• 🟢 Majallah Arabic (369410546)\n` +
      `• 🟢 Independent Persian (369368336)\n` +
      `• 🟢 Independent Arabic (369373481)\n` +
      `• 🟢 Independent URDU (369406321)\n` +
      `• 🟢 Independent Turkish (369406670)\n` +
      `• 🟢 Al Jamila (369390740)\n` +
      `• 🟢 List Magazine (369398457)\n` +
      `• 🟢 Arriyadiyah (369398813)\n` +
      `• 🟢 Aleqt (369408983)\n` +
      `• 🟢 Raff Publishing (372256184)\n` +
      `• 🟢 Akhbaar24 (373364146)\n` +
      `• 🟢 Urdunews (374023442)\n` +
      `• 🟢 Malayalam News (374807955)\n` +
      `• 🟢 About her (374808519)\n` +
      `• 🟢 Manga Arabia (376107957)\n` +
      `• 🟢 Arrajol (376120039)\n` +
      `• 🟢 rrarabia (376125952)\n` +
      `• 🟢 SRMG (379470462)\n` +
      `• 🟢 SRMG Think (380376788)\n` +
      `• 🟢 Billboardarabia (403352956)\n` +
      `• 🟢 G.O.A.T APP (501096431)\n` +
      `• 🟠 Manga Arabia Kids - App (282896841)\n` +
      `• 🟠 Manga Arabia Youth - App (291386170)\n` +
      `• srmgacademybootcamp (353452348)\n` +
      `• SRMG.VC (360319906)\n` +
      `• Canneslions (378986099)\n` +
      `• Menaforum (407466813)\n` +
      `• HiaHub (407751383)\n` +
      `• neom.journalismbootcamp.com (410801582)\n` +
      `• Mangainternational (441817192)\n` +
      `• sta.hiamag.com (473904083)\n` +
      `• Store MangaArabia - Salla (475659211)\n` +
      `• SRMG Media Solution (481995571)\n` +
      `• apco-columbia (500715675)\n\n` +
      `**Account 2: SRMG Websites - Universal** (Account ID: 8935925)\n` +
      `Contains **15 properties** including:\n\n` +
      `• Mobile Apps (231608388)\n` +
      `• www.sayidy.net (260681155)\n` +
      `• YouKAN (290867469)\n` +
      `• Mangayouth (291394152)\n` +
      `• www.arabnews.FR (309616126)\n` +
      `• About Her - GA4 (Delete) (309651326)\n` +
      `• HiaHUb (342732333)\n` +
      `• mangaarabia - GA4 (364931733)\n` +
      `• http://www.facesofsaudi.com - GA4 (371502619)\n` +
      `• Malayalamnewsdaily - GA4 (396667367)\n` +
      `• Urdu Newspaper - GA4 (399007332)\n` +
      `• صحيفة الرياضية - GA4 (401821161)\n` +
      `• Arrajol Magazine - GA4 (401830727)\n` +
      `• Sayidaty Magazine - GA4 (403510114)\n` +
      `• Al Jamila Magazine - GA4 (403526788)\n\n` +
      `**Total: 67 properties across 2 accounts**\n\n` +
      `💡 **Tip:** Ask for specific property details using the property ID or name!`;
    
    return response;
  } catch (error) {
    throw new Error(`Failed to list properties: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function handlePropertyDetails(prompt: string): Promise<string> {
  return `To get property details, I would need:\n1. The property ID from your query\n2. Call mcp_analytics-mcp_get_property_details(property_id)\n\nPlease specify which property you'd like details for.`;
}

async function handleReportQuery(prompt: string, defaultPropertyId?: string): Promise<{ result: string; mcpParams?: any; parsed?: any }> {
  try {
    // Use LLM to extract parameters from natural language
    const { extractGA4Params, formatMCPParams } = await import('./ga4-llm-service');
    
    console.log('🤖 Using LLM to extract GA4 parameters from:', prompt);
    console.log('🏠 Default property ID:', defaultPropertyId);
    
    // Extract parameters using LLM
    const extractedParams = await extractGA4Params(prompt);
    
    // Check if user explicitly mentioned a property ID or property name in the prompt
    const promptLower = prompt.toLowerCase();
    const hasExplicitPropertyId = /\b(\d{9,})\b/.test(prompt);
    const hasExplicitPropertyName = /\b(independent|arabnews|asharq|sayidaty|hia|manga|srmg)\s+(arabic|english|all)?/i.test(prompt);
    const hasExplicitProperty = hasExplicitPropertyId || hasExplicitPropertyName;
    
    // Always override with defaultPropertyId unless user explicitly specified a property
    // IMPORTANT: The LLM always returns a property_id (defaults to "358809672"), so we must
    // explicitly override it when defaultPropertyId is provided and user didn't specify one
    if (defaultPropertyId) {
      if (!hasExplicitProperty) {
        // User didn't specify a property, FORCE use the selected/default one
        // This overrides whatever the LLM returned
        extractedParams.property_id = defaultPropertyId;
        console.log('✅ FORCING override with selected/default property ID:', defaultPropertyId);
        console.log('   (LLM had returned:', extractedParams.property_id, ')');
      } else {
        // User explicitly mentioned a property, use that instead
        console.log('✅ User specified property in query, using:', extractedParams.property_id);
      }
    } else if (!hasExplicitProperty) {
      // No default property and no explicit property - LLM will use its default
      console.log('⚠️ No default property set, using LLM default:', extractedParams.property_id);
    }
    
    // Log extracted parameters AFTER override
    console.log('🔍 Final extracted parameters (after override):', JSON.stringify(extractedParams, null, 2));
    console.log('🔍 Property ID that will be used:', extractedParams.property_id);
    
    // Check if this is a comprehensive report request
    if (extractedParams.isComprehensiveReport) {
      console.log('📊 Comprehensive report detected!');
      return {
        result: `📊 **Comprehensive Report Request Detected**\n\nGenerating full breakdown with multiple sections...`,
        mcpParams: {
          property_id: extractedParams.property_id || defaultPropertyId || '358809672',
          date_ranges: extractedParams.date_ranges || [{ start_date: '30daysAgo', end_date: 'yesterday', name: 'Last30Days' }],
          isComprehensiveReport: true,
        },
        parsed: {
          propertyId: String(extractedParams.property_id || defaultPropertyId || '358809672'),
          dateRanges: extractedParams.date_ranges || [{ start_date: '30daysAgo', end_date: 'yesterday', name: 'Last30Days' }],
          isComprehensiveReport: true,
        },
      };
    }
    
    // Format to MCP-ready parameters with smart defaults
    // Pass defaultPropertyId to ensure it's used (extractedParams.property_id already updated above)
    const mcpParams = formatMCPParams(extractedParams, prompt, defaultPropertyId);
    
    // Log final MCP parameters
    console.log('📤 Final MCP parameters:', JSON.stringify(mcpParams, null, 2));
    
    // Format date range description
    const dateRange = mcpParams.date_ranges[0];
    let dateRangeDesc: string;
    if (dateRange.start_date === '30daysAgo') {
      dateRangeDesc = 'Last 30 days';
    } else if (dateRange.start_date.includes('daysAgo')) {
      const days = dateRange.start_date.replace('daysAgo', '');
      dateRangeDesc = `Last ${days} days`;
    } else {
      // Absolute date range - format nicely
      const formatReadableDate = (dateStr: string): string => {
        const [year, month, day] = dateStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      };
      dateRangeDesc = `${formatReadableDate(dateRange.start_date)} to ${formatReadableDate(dateRange.end_date)}`;
    }
    
    // Build result message
    let resultMessage = `📊 **Report Configuration**\n\n`;
    resultMessage += `✅ **Property:** ${mcpParams.property_id}\n`;
    resultMessage += `📅 **Date Range:** ${dateRangeDesc}\n`;
    resultMessage += `📈 **Metrics:** ${mcpParams.metrics.join(', ')}\n`;
    resultMessage += `🔍 **Dimensions:** ${mcpParams.dimensions.join(', ')}\n\n`;
    
    if (mcpParams.dimension_filter) {
      resultMessage += `🔍 **Filters:** Applied\n`;
    }
    if (mcpParams.limit) {
      resultMessage += `📊 **Limit:** Top ${mcpParams.limit} results\n`;
    }
    if (extractedParams.chartType) {
      resultMessage += `📈 **Chart Type:** ${extractedParams.chartType}\n`;
    }
    
    resultMessage += `\n**Ready to generate report!**\n\n`;
    resultMessage += `The LLM has parsed your query. The MCP tool will be called with these parameters.`;
    
    return {
      result: resultMessage,
      mcpParams: mcpParams,
      parsed: {
        propertyId: String(mcpParams.property_id),
        dateRanges: mcpParams.date_ranges,
        metrics: mcpParams.metrics,
        dimensions: mcpParams.dimensions,
        dimensionFilter: mcpParams.dimension_filter,
        limit: mcpParams.limit,
        chartType: extractedParams.chartType,
      },
    };
  } catch (error) {
    console.error('Error in handleReportQuery:', error);
    throw new Error(`Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extracts human-readable filter information from filter object
 */
function extractFilterInfo(filter: any): string | null {
  if (!filter) return null;
  
  if (filter.filter) {
    const f = filter.filter;
    if (f.field_name && f.string_filter) {
      return `${f.field_name}: ${f.string_filter.value}`;
    }
  }
  
  if (filter.and_group && filter.and_group.expressions) {
    const filterStrings = filter.and_group.expressions
      .map((expr: any) => {
        if (expr.filter && expr.filter.field_name && expr.filter.string_filter) {
          return `${expr.filter.field_name}: ${expr.filter.string_filter.value}`;
        }
        return null;
      })
      .filter((s: string | null) => s !== null);
    return filterStrings.join(', ');
  }
  
  return null;
}

/**
 * Parses a natural language query to extract report parameters
 */
function parseReportQuery(prompt: string, defaultPropertyId?: string): {
  propertyId?: string;
  propertyName?: string;
  dateRanges?: Array<{ start_date: string; end_date: string; name: string }>;
  metrics?: string[];
  dimensions?: string[];
  dimensionFilter?: any;
  limit?: number;
  chartType?: 'line' | 'bar' | 'pie' | 'doughnut';
} {
  const lower = prompt.toLowerCase();
  const result: any = {};

  // Extract property ID (numbers like 194176332)
  const propertyIdMatch = prompt.match(/\b(\d{9,})\b/);
  if (propertyIdMatch) {
    result.propertyId = propertyIdMatch[1];
  }

  // Extract property name (common property names)
  const propertyNames: Record<string, string> = {
    'independent arabic': '194176332',
    'arabnews english': '197199756',
    'asharq al awsat': '221805438',
    'sayidaty': '362050402',
    'hia': '362081617',
    'manga arabia': '376107957',
    'srmg': '379470462',
  };

  for (const [name, id] of Object.entries(propertyNames)) {
    if (lower.includes(name)) {
      result.propertyId = id;
      result.propertyName = name;
      break;
    }
  }
  
  // Set default property ID if none found
  if (!result.propertyId) {
    result.propertyId = defaultPropertyId || '358809672';
  }

  // First, try to extract absolute date ranges (e.g., "1/8/2025 till 31/8/2025")
  // This takes priority over relative dates
  const absoluteDatePatterns = [
    // Format: "1/8/2025 till 31/8/2025" or "1/8/2025 to 31/8/2025"
    { pattern: /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s+(?:till|to|until|through|-)\s+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i },
    // Format: "from 1/8/2025 to 31/8/2025" or "from 1/8/2025 till 31/8/2025"
    { pattern: /from\s+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s+(?:to|till|until|through|-)\s+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i },
    // Format: "between 1/8/2025 and 31/8/2025"
    { pattern: /between\s+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s+and\s+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i },
    // Format: "2025-08-01 to 2025-08-31" (ISO format)
    { pattern: /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\s+(?:to|till|until|through|-)\s+(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/i },
  ];

  let absoluteDateFound = false;
  for (const { pattern } of absoluteDatePatterns) {
    const match = prompt.match(pattern);
    if (match) {
      try {
        let startDate: Date;
        let endDate: Date;
        
        // Determine date format based on pattern match
        if (match[0].includes('between') || match[0].includes('from')) {
          // Format: DD/MM/YYYY or MM/DD/YYYY (need to detect)
          const startDay = parseInt(match[1]);
          const startMonth = parseInt(match[2]);
          const startYear = parseInt(match[3]);
          const endDay = parseInt(match[4]);
          const endMonth = parseInt(match[5]);
          const endYear = parseInt(match[6]);
          
          // Try DD/MM/YYYY first (more common internationally)
          // If day > 12, it must be DD/MM/YYYY
          // Otherwise, check if month > 12 to determine
          if (startDay > 12 || endDay > 12) {
            // DD/MM/YYYY format
            startDate = new Date(startYear, startMonth - 1, startDay);
            endDate = new Date(endYear, endMonth - 1, endDay);
          } else if (startMonth > 12 || endMonth > 12) {
            // DD/MM/YYYY format (month > 12)
            startDate = new Date(startYear, startMonth - 1, startDay);
            endDate = new Date(endYear, endMonth - 1, endDay);
          } else {
            // Ambiguous - try MM/DD/YYYY (US format)
            startDate = new Date(startYear, startDay - 1, startMonth);
            endDate = new Date(endYear, endDay - 1, endMonth);
            // If that doesn't work, try DD/MM/YYYY
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
              startDate = new Date(startYear, startMonth - 1, startDay);
              endDate = new Date(endYear, endMonth - 1, endDay);
            }
          }
        } else if (match[1].length === 4) {
          // ISO format: YYYY-MM-DD
          startDate = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
          endDate = new Date(parseInt(match[4]), parseInt(match[5]) - 1, parseInt(match[6]));
        } else {
          // Format: DD/MM/YYYY or MM/DD/YYYY
          const startDay = parseInt(match[1]);
          const startMonth = parseInt(match[2]);
          const startYear = parseInt(match[3]);
          const endDay = parseInt(match[4]);
          const endMonth = parseInt(match[5]);
          const endYear = parseInt(match[6]);
          
          // If day > 12, it must be DD/MM/YYYY (can't have month > 12)
          // If endDay > 12, both dates are DD/MM/YYYY
          if (startDay > 12 || endDay > 12) {
            // DD/MM/YYYY format
            startDate = new Date(startYear, startMonth - 1, startDay);
            endDate = new Date(endYear, endMonth - 1, endDay);
          } else if (startMonth > 12 || endMonth > 12) {
            // DD/MM/YYYY format (month > 12)
            startDate = new Date(startYear, startMonth - 1, startDay);
            endDate = new Date(endYear, endMonth - 1, endDay);
          } else {
            // Ambiguous format - try both and pick the one that makes sense
            // Try DD/MM/YYYY first (more common internationally, especially with "till")
            const ddmmStart = new Date(startYear, startMonth - 1, startDay);
            const ddmmEnd = new Date(endYear, endMonth - 1, endDay);
            
            // Try MM/DD/YYYY
            const mmddStart = new Date(startYear, startDay - 1, startMonth);
            const mmddEnd = new Date(endYear, endDay - 1, endMonth);
            
            // Prefer DD/MM/YYYY if both are valid and start < end
            // (This handles cases like "1/8/2025 till 31/8/2025" which is clearly DD/MM/YYYY)
            if (!isNaN(ddmmStart.getTime()) && !isNaN(ddmmEnd.getTime()) && ddmmStart <= ddmmEnd) {
              startDate = ddmmStart;
              endDate = ddmmEnd;
            } else if (!isNaN(mmddStart.getTime()) && !isNaN(mmddEnd.getTime()) && mmddStart <= mmddEnd) {
              startDate = mmddStart;
              endDate = mmddEnd;
            } else {
              // Fallback to DD/MM/YYYY
              startDate = ddmmStart;
              endDate = ddmmEnd;
            }
          }
        }
        
        // Validate dates
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && startDate <= endDate) {
          // Format dates as YYYY-MM-DD for GA4 API
          const formatDate = (date: Date): string => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          };
          
          result.dateRanges = [{
            start_date: formatDate(startDate),
            end_date: formatDate(endDate),
            name: `CustomRange_${formatDate(startDate)}_${formatDate(endDate)}`
          }];
          
          console.log(`📅 Absolute date range extracted: ${formatDate(startDate)} to ${formatDate(endDate)}`);
          absoluteDateFound = true;
          break;
        } else {
          console.log('⚠️ Invalid date range parsed, skipping');
        }
      } catch (error) {
        console.log('⚠️ Error parsing absolute date range:', error);
      }
    }
  }

  // If no absolute date range found, try month name patterns (e.g., "March 2025", "for the month of March 2025")
  if (!absoluteDateFound) {
    const monthNames: Record<string, number> = {
      'january': 1, 'jan': 1,
      'february': 2, 'feb': 2,
      'march': 3, 'mar': 3,
      'april': 4, 'apr': 4,
      'may': 5,
      'june': 6, 'jun': 6,
      'july': 7, 'jul': 7,
      'august': 8, 'aug': 8,
      'september': 9, 'sep': 9, 'sept': 9,
      'october': 10, 'oct': 10,
      'november': 11, 'nov': 11,
      'december': 12, 'dec': 12,
    };

    // Patterns for month name + year
    const monthPatterns = [
      // "for the month of March 2025", "month of March 2025"
      /(?:for\s+the\s+)?month\s+of\s+(\w+)\s+(\d{4})/i,
      // "in March 2025", "during March 2025"
      /(?:in|during)\s+(\w+)\s+(\d{4})/i,
      // "March 2025" (standalone)
      /\b(\w+)\s+(\d{4})\b/i,
    ];

    for (const pattern of monthPatterns) {
      const match = prompt.match(pattern);
      if (match) {
        const monthName = match[1]?.toLowerCase();
        const year = parseInt(match[2]);
        
        if (monthName && monthNames[monthName] && !isNaN(year)) {
          const monthNum = monthNames[monthName];
          // Get first and last day of the month
          const startDate = new Date(year, monthNum - 1, 1);
          const endDate = new Date(year, monthNum, 0); // Last day of the month
          
          // Format dates as YYYY-MM-DD for GA4 API
          const formatDate = (date: Date): string => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
          };
          
          result.dateRanges = [{
            start_date: formatDate(startDate),
            end_date: formatDate(endDate),
            name: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)}${year}`
          }];
          
          console.log(`📅 Month name date range extracted: ${formatDate(startDate)} to ${formatDate(endDate)} (${monthName} ${year})`);
          absoluteDateFound = true;
          break;
        }
      }
    }
  }

  // If no absolute date range found, try relative date patterns
  if (!absoluteDateFound) {
    const datePatterns = [
      { pattern: /last\s+(\d+)\s+days?/i, days: (m: RegExpMatchArray) => parseInt(m[1]) },
      { pattern: /(\d+)\s+days?\s+ago/i, days: (m: RegExpMatchArray) => parseInt(m[1]) },
      { pattern: /(\d+)\s+days?/i, days: (m: RegExpMatchArray) => parseInt(m[1]) }, // "7 days" without "last"
      { pattern: /last\s+week/i, days: () => 7 },
      { pattern: /last\s+month/i, days: () => 30 },
      { pattern: /last\s+year/i, days: () => 365 },
      { pattern: /this\s+week/i, days: () => 7 },
      { pattern: /this\s+month/i, days: () => 30 },
      { pattern: /past\s+(\d+)\s+days?/i, days: (m: RegExpMatchArray) => parseInt(m[1]) },
      { pattern: /previous\s+(\d+)\s+days?/i, days: (m: RegExpMatchArray) => parseInt(m[1]) },
    ];

    for (const { pattern, days } of datePatterns) {
      const match = prompt.match(pattern);
      if (match) {
        const dayCount = typeof days === 'function' ? days(match) : days;
        result.dateRanges = [{
          start_date: `${dayCount}daysAgo`,
          end_date: 'yesterday',
          name: `Last${dayCount}Days`
        }];
        console.log(`📅 Relative date range extracted: ${dayCount} days (matched pattern: ${pattern})`);
        break;
      }
    }
  }

  // Extract metrics
  const metricKeywords: Record<string, string> = {
    'active users': 'activeUsers',
    'active user': 'activeUsers',
    'users': 'activeUsers',
    'user': 'activeUsers',
    'sessions': 'sessions',
    'session': 'sessions',
    'pageviews': 'screenPageViews',
    'page views': 'screenPageViews',
    'pageview': 'screenPageViews',
    'page view': 'screenPageViews',
    'views': 'screenPageViews',
    'bounce rate': 'bounceRate',
    'bounces': 'bounces',
    'events': 'eventCount',
    'revenue': 'totalRevenue',
  };

  const foundMetrics: string[] = [];
  for (const [keyword, metric] of Object.entries(metricKeywords)) {
    // Use word boundaries for better matching
    const keywordRegex = new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}\\b`, 'i');
    if (keywordRegex.test(lower) && !foundMetrics.includes(metric)) {
      foundMetrics.push(metric);
      console.log(`📈 Metric extracted: ${keyword} -> ${metric}`);
    }
  }
  if (foundMetrics.length > 0) {
    result.metrics = foundMetrics;
    console.log(`✅ Total metrics found: ${foundMetrics.length}`);
  } else {
    console.log('⚠️ No metrics extracted from prompt');
  }

  // Extract dimensions - expanded list with more options
  // NOTE: Be careful not to match metric keywords (like "pageviews") as dimensions
  // 
  // IMPORTANT: These are DIMENSIONS (for breaking down data), not filters.
  // The same field can be used as both:
  // - Dimension: "by country" → breaks down data by country
  // - Filter: "from saudi arabia" → restricts data to Saudi Arabia only
  // 
  // All dimensions from GA4_MCP_TOOLS.md are supported:
  // ✅ date, country, city, deviceCategory, browser, sessionSource, pagePath
  const dimensionKeywords: Record<string, string> = {
    // Time dimensions
    'date': 'date',
    'day': 'date',
    'week': 'week',
    'month': 'month',
    'year': 'year',
    'hour': 'hour',
    
    // Geographic dimensions
    'country': 'country',
    'countries': 'country',
    'city': 'city',
    'cities': 'city',
    'region': 'region',
    'continent': 'continent',
    
    // Device dimensions
    'device': 'deviceCategory',
    'devices': 'deviceCategory',
    'device category': 'deviceCategory',
    'devicecategory': 'deviceCategory',
    'mobile': 'deviceCategory', // Will need filtering
    'desktop': 'deviceCategory', // Will need filtering
    'tablet': 'deviceCategory', // Will need filtering
    'mobile device': 'deviceCategory',
    'operating system': 'operatingSystem',
    'os': 'operatingSystem',
    'platform': 'operatingSystem',
    'browser': 'browser',
    'browsers': 'browser',
    
    // Language and locale
    'language': 'language',
    'languages': 'language',
    'locale': 'languageCode',
    
    // Traffic source dimensions
    'source': 'sessionSource',
    'sources': 'sessionSource',
    'traffic source': 'sessionSource',
    'traffic sources': 'sessionSource', // Plural form
    'trafficsource': 'sessionSource',
    'trafficsources': 'sessionSource',
    'medium': 'sessionMedium',
    'campaign': 'sessionCampaignName',
    'referrer': 'sessionSource',
    'referrers': 'sessionSource',
    // Channel grouping dimensions
    'channel': 'sessionDefaultChannelGroup',
    'channels': 'sessionDefaultChannelGroup',
    'channel group': 'sessionDefaultChannelGroup',
    'channel groups': 'sessionDefaultChannelGroup',
    'traffic channel': 'sessionDefaultChannelGroup',
    'traffic channels': 'sessionDefaultChannelGroup',
    'by channel': 'sessionDefaultChannelGroup',
    'by channels': 'sessionDefaultChannelGroup',
    'organic': 'sessionDefaultChannelGroup', // Will show all channels, but user likely wants channel grouping
    'paid': 'sessionDefaultChannelGroup',
    'organic search': 'sessionDefaultChannelGroup',
    'paid search': 'sessionDefaultChannelGroup',
    'social': 'sessionDefaultChannelGroup',
    'direct': 'sessionDefaultChannelGroup',
    'referral': 'sessionDefaultChannelGroup',
    
    // Page dimensions
    'page path': 'pagePath',
    'pagepath': 'pagePath',
    'page title': 'pageTitle',
    'pagetitle': 'pageTitle',
    'page': 'pagePath', // Only if not part of "pageviews"
    'url': 'pagePath',
    
    // User dimensions
    'user type': 'newVsReturning',
    'new vs returning': 'newVsReturning',
    
    // Event dimensions
    'event name': 'eventName',
    'eventname': 'eventName',
    'event': 'eventName',
    
    // Content dimensions
    'content group': 'contentGroup1',
    'contentgroup': 'contentGroup1',
    
    // Custom dimensions - Article/Content author
    // Note: Custom dimensions may vary by property. Common formats:
    // - customEvent:article_author (event-scoped - actual name in this property)
    // - customEvent:author (alternative format)
    // - customUser:author (user-scoped)
    // - customParameter:author (parameter-scoped)
    'author': 'customEvent:article_author', // Actual dimension name for this property
    'authors': 'customEvent:article_author',
    'article author': 'customEvent:article_author',
    'article authors': 'customEvent:article_author',
    'writer': 'customEvent:article_author',
    'writers': 'customEvent:article_author',
    'by author': 'customEvent:article_author',
    'by authors': 'customEvent:article_author',
  };

  // Metric keywords that should NOT be treated as dimensions
  const metricKeywordsList = ['pageviews', 'page views', 'users', 'sessions', 'views', 'events', 'revenue'];
  
  const foundDimensions: string[] = [];
  for (const [keyword, dimension] of Object.entries(dimensionKeywords)) {
    // Use word boundary regex to match whole words only
    // Also handle plural forms (e.g., "sources" matches "source")
    const keywordPattern = keyword.replace(/\s+/g, '\\s+');
    const keywordRegex = new RegExp(`\\b${keywordPattern}\\b`, 'i');
    
    // Also check for plural/singular variations
    const pluralPattern = keyword.endsWith('s') ? keyword.slice(0, -1) : keyword + 's';
    const pluralRegex = new RegExp(`\\b${pluralPattern.replace(/\s+/g, '\\s+')}\\b`, 'i');
    
    if (keywordRegex.test(lower) || pluralRegex.test(lower)) {
      // Double-check: make sure it's not part of a metric keyword
      const isPartOfMetric = metricKeywordsList.some(metric => {
        return lower.includes(metric) && metric.includes(keyword);
      });
      
      // Special handling for device category keywords
      if (keyword === 'mobile' || keyword === 'desktop' || keyword === 'tablet') {
        // These are device types, not dimensions - but we can add deviceCategory dimension
        // and note that filtering might be needed
        if (!foundDimensions.includes('deviceCategory')) {
          foundDimensions.push('deviceCategory');
          console.log(`📱 Device dimension added based on keyword: ${keyword}`);
        }
      } else if (!isPartOfMetric && !foundDimensions.includes(dimension)) {
        foundDimensions.push(dimension);
        console.log(`🔍 Dimension extracted: ${keyword} -> ${dimension}`);
      }
    }
  }
  
  // Special handling for phrases like "show traffic sources", "get sources", etc.
  // These imply wanting to see data BY that dimension
  const dimensionPhrases: Record<string, string> = {
    'show traffic sources': 'sessionSource',
    'show sources': 'sessionSource',
    'get traffic sources': 'sessionSource',
    'get sources': 'sessionSource',
    'traffic sources': 'sessionSource',
    'top traffic sources': 'sessionSource',
    'what are my top traffic sources': 'sessionSource',
    'what are my traffic sources': 'sessionSource',
    'my top traffic sources': 'sessionSource',
    'my traffic sources': 'sessionSource',
    'show traffic by channel': 'sessionDefaultChannelGroup',
    'traffic by channel': 'sessionDefaultChannelGroup',
    'traffic by channels': 'sessionDefaultChannelGroup',
    'by channel': 'sessionDefaultChannelGroup',
    'by channels': 'sessionDefaultChannelGroup',
    'show channels': 'sessionDefaultChannelGroup',
    'get channels': 'sessionDefaultChannelGroup',
    'organic traffic': 'sessionDefaultChannelGroup',
    'paid traffic': 'sessionDefaultChannelGroup',
    'show countries': 'country',
    'get countries': 'country',
    'show cities': 'city',
    'get cities': 'city',
    'show devices': 'deviceCategory',
    'get devices': 'deviceCategory',
    'show browsers': 'browser',
    'get browsers': 'browser',
    'show authors': 'customEvent:article_author',
    'get authors': 'customEvent:article_author',
    'by author': 'customEvent:article_author',
    'by authors': 'customEvent:article_author',
    'article author': 'customEvent:article_author',
    'article authors': 'customEvent:article_author',
  };
  
  for (const [phrase, dimension] of Object.entries(dimensionPhrases)) {
    if (lower.includes(phrase) && !foundDimensions.includes(dimension)) {
      foundDimensions.push(dimension);
      console.log(`🔍 Dimension extracted from phrase: "${phrase}" -> ${dimension}`);
    }
  }
  
  // Check if user wants a pie/doughnut chart (categorical breakdown)
  const wantsPieChart = lower.match(/\b(?:pie|doughnut)\s+chart\b/i) || 
                        lower.match(/\bchart.*pie\b/i) ||
                        lower.match(/\bpie\b/i);
  
  // Categorical dimensions that work well for pie charts (without date)
  const categoricalDimensions = ['sessionDefaultChannelGroup', 'sessionSource', 'country', 'deviceCategory', 'browser', 'operatingSystem'];
  const hasCategoricalDimension = foundDimensions.some(dim => categoricalDimensions.includes(dim));
  
  // Always ensure date is included for proper ordering (unless explicitly excluded or pie chart requested)
  // If user specified other dimensions but not date, add date as first dimension
  // BUT: Skip adding date if user wants pie chart or has categorical dimension for aggregation
  if (foundDimensions.length > 0 && !foundDimensions.includes('date') && result.dateRanges) {
    // Check if user explicitly doesn't want date (e.g., "by country only")
    const explicitNoDate = lower.match(/\b(?:no|without|excluding)\s+date\b/i);
    
    // Don't add date if:
    // 1. User explicitly requested pie chart, OR
    // 2. User has categorical dimension and wants aggregation (not time series)
    if (!explicitNoDate && !wantsPieChart && !hasCategoricalDimension) {
      foundDimensions.unshift('date'); // Add date as first dimension for ordering
      console.log('📅 Date dimension added as first dimension (for proper ordering)');
    } else if (wantsPieChart || hasCategoricalDimension) {
      console.log('📊 Skipping date dimension (pie chart or categorical breakdown requested)');
    }
  } else if (foundDimensions.length === 0 && result.dateRanges) {
    // No dimensions found, add date as default (unless pie chart requested)
    if (!wantsPieChart) {
      foundDimensions.push('date');
      console.log('📅 Date dimension added by default (for ordering)');
    } else {
      console.log('📊 Skipping date dimension (pie chart requested)');
    }
  }
  
  if (foundDimensions.length > 0) {
    result.dimensions = foundDimensions;
    console.log(`✅ Total dimensions found: ${foundDimensions.length}`);
  } else {
    console.log('⚠️ No dimensions extracted from prompt');
  }

  // Extract filters (e.g., "from saudi arabia", "in riyadh", "on mobile")
  const filters: any[] = [];
  
  // Common country names for better detection
  const commonCountries = [
    'saudi arabia', 'united states', 'usa', 'uk', 'united kingdom',
    'uae', 'united arab emirates', 'egypt', 'jordan', 'lebanon',
    'kuwait', 'qatar', 'bahrain', 'oman', 'yemen', 'iraq', 'syria',
    'canada', 'australia', 'france', 'germany', 'italy', 'spain',
    'india', 'china', 'japan', 'south korea', 'singapore', 'malaysia',
    'turkey', 'pakistan', 'bangladesh', 'indonesia', 'philippines',
    'thailand', 'vietnam', 'brazil', 'mexico', 'argentina', 'chile',
  ];
  
  // Country filters: "from [country]", "in [country]", "country is [country]"
  // Try matching known countries first for better accuracy
  for (const country of commonCountries) {
    const countryPatterns = [
      new RegExp(`from\\s+${country.replace(/\s+/g, '\\s+')}(?:\\s+for|\\s+in|\\s+on|\\s+till|\\s+to|\\s+last|$)`, 'i'),
      new RegExp(`in\\s+${country.replace(/\s+/g, '\\s+')}(?:\\s+for|\\s+in|\\s+on|\\s+till|\\s+to|\\s+last|$)`, 'i'),
      new RegExp(`country\\s+is\\s+${country.replace(/\s+/g, '\\s+')}(?:\\s+for|\\s+in|\\s+on|\\s+till|\\s+to|\\s+last|$)`, 'i'),
    ];
    
    for (const pattern of countryPatterns) {
      if (pattern.test(prompt)) {
        filters.push({
          field_name: 'country',
          string_filter: {
            match_type: 1, // PARTIAL_MATCH (contains) - more flexible for country name variations
            value: country,
            case_sensitive: false
          }
        });
        console.log(`🌍 Country filter extracted: ${country}`);
        break; // Found a country, stop searching
      }
    }
    if (filters.length > 0) break; // Found a country filter, exit loop
  }
  
  // If no known country found, try generic pattern
  if (filters.length === 0) {
    const countryFilterPatterns = [
      /from\s+([a-z\s]{3,}?)(?:\s+for\s+the|\s+for|\s+in|\s+on|\s+till|\s+to|\s+last|$)/i,
      /in\s+([a-z\s]{3,}?)(?:\s+for\s+the|\s+for|\s+on|\s+till|\s+to|\s+last|$)/i,
    ];
    
    for (const pattern of countryFilterPatterns) {
      const match = prompt.match(pattern);
      if (match) {
        const countryName = match[1].trim();
        // Validate it's likely a country (not a date, number, or common word)
        const stopWords = ['the', 'for', 'and', 'last', 'days', 'month', 'week', 'year', 'property', 'id'];
        const words = countryName.toLowerCase().split(/\s+/);
        const hasStopWord = words.some(w => stopWords.includes(w));
        
        if (!hasStopWord && countryName.length > 3 && !/\d/.test(countryName)) {
          filters.push({
            field_name: 'country',
            string_filter: {
              match_type: 1, // PARTIAL_MATCH (contains) - more flexible for country name variations
              value: countryName,
              case_sensitive: false
            }
          });
          console.log(`🌍 Country filter extracted (generic): ${countryName}`);
          break;
        }
      }
    }
  }
  
  // City filters: "in [city]", "city is [city]"
  const cityFilterPatterns = [
    /in\s+([a-z\s]+?)(?:\s+for|\s+on|\s+till|\s+to|$)/i,
    /city\s+is\s+([a-z\s]+?)(?:\s+for|\s+in|\s+on|\s+till|\s+to|$)/i,
  ];
  
  // Only add city filter if no country filter was found (to avoid conflicts)
  if (filters.length === 0) {
    for (const pattern of cityFilterPatterns) {
      const match = prompt.match(pattern);
      if (match) {
        const cityName = match[1].trim();
        // Check if it's likely a city (not a country or date)
        if (cityName.length > 2 && !/\d/.test(cityName)) {
          filters.push({
            field_name: 'city',
            string_filter: {
              match_type: 2, // EXACT match
              value: cityName,
              case_sensitive: false
            }
          });
          console.log(`🏙️ City filter extracted: ${cityName}`);
          break;
        }
      }
    }
  }
  
  // Device filters: "on mobile", "on desktop", "on tablet", "mobile device", "desktop device"
  const deviceFilterPatterns = [
    /on\s+(mobile|desktop|tablet)/i,
    /(mobile|desktop|tablet)\s+device/i,
    /(mobile|desktop|tablet)\s+only/i,
  ];
  
  for (const pattern of deviceFilterPatterns) {
    const match = prompt.match(pattern);
    if (match) {
      const deviceType = match[1].toLowerCase();
      filters.push({
        field_name: 'deviceCategory',
        string_filter: {
          match_type: 2, // EXACT match
          value: deviceType,
          case_sensitive: false
        }
      });
      console.log(`📱 Device filter extracted: ${deviceType}`);
      break;
    }
  }
  
  // Create dimension_filter if we have any filters
  if (filters.length > 0) {
    if (filters.length === 1) {
      result.dimensionFilter = {
        filter: filters[0]
      };
    } else {
      // Multiple filters - use AND group
      result.dimensionFilter = {
        and_group: {
          expressions: filters.map(filter => ({ filter }))
        }
      };
    }
    console.log(`🔍 Dimension filter created with ${filters.length} filter(s)`);
  }

  // Extract limit/top N (e.g., "top 20", "limit 20", "first 10", "only top 5")
  const limitPatterns = [
    /top\s+(\d+)/i,
    /limit\s+(\d+)/i,
    /first\s+(\d+)/i,
    /only\s+top\s+(\d+)/i,
    /only\s+(\d+)/i,
    /show\s+(\d+)/i,
  ];

  for (const pattern of limitPatterns) {
    const match = prompt.match(pattern);
    if (match) {
      const limit = parseInt(match[1]);
      if (limit > 0 && limit <= 250000) { // GA4 max limit
        result.limit = limit;
        console.log(`📊 Limit extracted: ${limit}`);
        break;
      }
    }
  }

  // Detect chart type from query
  const chartTypePatterns = [
    { pattern: /pie\s+chart/i, type: 'pie' as const },
    { pattern: /doughnut\s+chart/i, type: 'doughnut' as const },
    { pattern: /pie/i, type: 'pie' as const },
    { pattern: /doughnut/i, type: 'doughnut' as const },
    { pattern: /bar\s+chart/i, type: 'bar' as const },
    { pattern: /line\s+chart/i, type: 'line' as const },
  ];

  for (const { pattern, type } of chartTypePatterns) {
    if (pattern.test(prompt)) {
      result.chartType = type;
      console.log(`📊 Chart type detected: ${type}`);
      break;
    }
  }

  // Auto-detect chart type based on dimensions if not explicitly requested
  if (!result.chartType && result.dimensions) {
    const firstDimension = result.dimensions[0];
    const hasDateDimension = result.dimensions.includes('date');
    const isChannelDimension = firstDimension === 'sessionDefaultChannelGroup' || 
                               firstDimension === 'sessionSource' ||
                               firstDimension === 'country' ||
                               firstDimension === 'deviceCategory';
    
    // Suggest pie/doughnut for channel breakdowns without date
    if (isChannelDimension && !hasDateDimension) {
      result.chartType = 'doughnut';
      console.log(`📊 Auto-detected chart type: doughnut (for ${firstDimension})`);
    }
  }

  return result;
}

/**
 * Calls the MCP run_report tool with the given parameters
 */
async function callMCPRunReport(
  propertyId: string,
  dateRanges: Array<{ start_date: string; end_date: string; name: string }>,
  metrics: string[],
  dimensions: string[]
): Promise<any> {
  // This function will be called from the API route
  // The API route needs to have access to MCP tools
  // For now, we'll return a structure that indicates the call should be made
  
  // In production, this would be:
  // return await mcp_analytics-mcp_run_report({
  //   property_id: propertyId,
  //   date_ranges: dateRanges,
  //   metrics: metrics,
  //   dimensions: dimensions
  // });
  
  // Since MCP tools are available in Cursor but not directly in Next.js API routes,
  // we need to create a bridge. For now, throw an error to indicate MCP call is needed
  throw new Error('MCP tool call needs to be implemented. The MCP analytics server is available in Cursor but needs to be bridged to the Next.js API route.');
}

/**
 * Formats the MCP report response into a readable string
 */
function formatReportResponse(
  propertyId: string,
  propertyName: string | undefined,
  dateRanges: Array<{ start_date: string; end_date: string; name: string }>,
  metrics: string[],
  dimensions: string[],
  reportData: any
): string {
  const propertyNameStr = propertyName ? ` (${propertyName})` : '';
  const dateRangeDesc = dateRanges[0].start_date === '30daysAgo' ? 'Last 30 days' : 
                       dateRanges[0].start_date.includes('daysAgo') ? 
                       `Last ${dateRanges[0].start_date.replace('daysAgo', '')} days` : 
                       `${dateRanges[0].start_date} to ${dateRanges[0].end_date}`;
  
  let response = `📊 **GA4 Analytics Report**\n\n`;
  response += `**Property:** ${propertyId}${propertyNameStr}\n`;
  response += `**Date Range:** ${dateRangeDesc}\n`;
  response += `**Metrics:** ${metrics.join(', ')}\n`;
  response += `**Dimensions:** ${dimensions.join(', ')}\n\n`;
  
  // Format the report data
  if (reportData && reportData.rows) {
    response += `**Report Data:**\n\n`;
    
    // Create a table-like format
    const headers = [...dimensions, ...metrics];
    response += headers.join(' | ') + '\n';
    response += headers.map(() => '---').join(' | ') + '\n';
    
    reportData.rows.slice(0, 20).forEach((row: any) => {
      const values = [...(row.dimensionValues || []), ...(row.metricValues || [])]
        .map((v: any) => v.value || '');
      response += values.join(' | ') + '\n';
    });
    
    if (reportData.rows.length > 20) {
      response += `\n... and ${reportData.rows.length - 20} more rows\n`;
    }
    
    // Add totals if available
    if (reportData.totals && reportData.totals.length > 0) {
      response += `\n**Totals:**\n`;
      reportData.totals[0].metricValues?.forEach((mv: any, idx: number) => {
        response += `${metrics[idx]}: ${mv.value}\n`;
      });
    }
  } else {
    response += `**Data:** ${JSON.stringify(reportData, null, 2)}`;
  }
  
  return response;
}


