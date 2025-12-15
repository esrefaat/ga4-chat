import { NextRequest, NextResponse } from 'next/server';
import { processGA4Query } from '@/lib/ga4-query-handler';
import { callGA4Report, getCustomDimensionsAndMetrics, callGA4AccountSummaries } from './mcp-bridge';
import { logActivity } from '@/lib/activity-logger';
import { getUsernameFromToken, AUTH_CONFIG, isSessionValid } from '@/lib/auth';
import { cookies } from 'next/headers';

// Disable caching to ensure fresh data on every request
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * API Route for GA4 Chat
 * 
 * This route processes natural language queries and calls the appropriate
 * GA4 MCP tool functions. The MCP tools are available in the Cursor environment.
 * 
 * For report queries, this route will actually call the MCP tool to get real data.
 */
export async function POST(request: NextRequest) {
  try {
    const { prompt, propertyId } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      );
    }

    // Get username from session and validate
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(AUTH_CONFIG.sessionCookieName);
    
    // Check if session is valid (not invalidated)
    if (sessionToken && !isSessionValid(sessionToken.value)) {
      // Session was invalidated, delete cookie
      cookieStore.delete(AUTH_CONFIG.sessionCookieName);
      return NextResponse.json(
        { error: 'Session has been invalidated. Please log in again.' },
        { status: 401 }
      );
    }
    
    const username = sessionToken ? getUsernameFromToken(sessionToken.value) : 'anonymous';

    // Get user's default property if available
    let defaultPropertyId = propertyId; // Use propertyId from request if provided
    if (!defaultPropertyId && username && username !== 'anonymous') {
      try {
        const { getUserByUsername } = await import('@/lib/auth');
        const user = await getUserByUsername(username);
        if (user?.default_property_id) {
          defaultPropertyId = user.default_property_id;
        }
      } catch (error) {
        console.error('Failed to get user default property:', error);
      }
    }

    // Log the incoming prompt for debugging
    console.log('📝 Incoming prompt:', prompt);
    console.log('🕐 Request timestamp:', new Date().toISOString());
    console.log('🏠 Request property ID:', propertyId);
    console.log('🏠 Final default property ID:', defaultPropertyId);
    
    // Log user activity
    await logActivity(
      username || 'anonymous',
      'GA4_QUERY',
      {
        prompt: prompt.substring(0, 200), // Limit prompt length in logs
        queryLength: prompt.length,
        propertyId: propertyId,
        defaultPropertyId: defaultPropertyId,
      },
      {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      }
    );
    
    // Process the query using the GA4 query handler
    // This will interpret the query, parse parameters, and for report queries,
    // it will attempt to call the MCP tool to get real data
    const queryResult = await processGA4Query(prompt, defaultPropertyId);
    
    // Log the parsed query result
    console.log('🔍 Parsed query result:', JSON.stringify(queryResult, null, 2));
    
    // Log successful query processing
    await logActivity(
      username || 'anonymous',
      'GA4_QUERY_PROCESSED',
      {
        queryType: queryResult.data?.type || 'unknown',
        hasData: !!queryResult.data,
      }
    );

    // If it's a list properties query, call the MCP tool
    if (queryResult.data?.type === 'list_properties') {
      // Always return the hardcoded list first, then try to fetch live data
      // This ensures the user always gets a response even if MCP fails
      const fallbackResult = queryResult.result;
      
      try {
        console.log('📊 Fetching account summaries...');
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('MCP call timeout')), 10000)
        );
        
        const accountSummariesResult = await Promise.race([
          callGA4AccountSummaries(),
          timeoutPromise
        ]) as any;
        
        const formattedResult = formatAccountSummariesResult(accountSummariesResult);
        
        // If formatting returned null, use fallback
        if (formattedResult === null) {
          console.log('Using fallback list due to empty MCP response');
          return NextResponse.json({
            result: fallbackResult,
            data: queryResult.data
          });
        }
        
        return NextResponse.json({
          result: formattedResult,
          data: { ...queryResult.data, accountSummariesData: accountSummariesResult }
        });
      } catch (mcpError) {
        const errorMsg = mcpError instanceof Error ? mcpError.message : 'Unknown error';
        console.error('Error fetching account summaries, using fallback:', errorMsg);
        // Return the hardcoded list as fallback
        return NextResponse.json({
          result: fallbackResult,
          data: queryResult.data
        });
      }
    }

    // If it's a custom dimensions query, call the MCP tool
    if (queryResult.data?.type === 'customDimensions' && queryResult.data?.propertyId) {
      try {
        console.log('📊 Fetching custom dimensions for property:', queryResult.data.propertyId);
        const customDimsResult = await getCustomDimensionsAndMetrics(queryResult.data.propertyId);
        return NextResponse.json({
          result: formatCustomDimensionsResult(customDimsResult, queryResult.data.propertyId),
          data: { ...queryResult.data, customDimensionsData: customDimsResult }
        });
      } catch (mcpError) {
        const errorMsg = mcpError instanceof Error ? mcpError.message : 'Unknown error';
        return NextResponse.json({
          result: queryResult.result + `\n\n⚠️ **Error:** ${errorMsg}`,
          data: queryResult.data
        });
      }
    }

    // Check if this is a comprehensive report request
    if (queryResult.data?.type === 'report' && queryResult.data?.parsed?.isComprehensiveReport) {
      const { generateComprehensiveReport } = await import('@/lib/ga4-comprehensive-report');
      const propertyId = queryResult.data.parsed.propertyId;
      const dateRange = queryResult.data.parsed.dateRanges[0];
      
      try {
        console.log('📊 Generating comprehensive report...');
        console.log('📊 Property ID:', propertyId);
        console.log('📊 Date Range:', JSON.stringify(dateRange, null, 2));
        
        if (!propertyId) {
          throw new Error('Property ID is required for comprehensive report');
        }
        if (!dateRange || !dateRange.start_date || !dateRange.end_date) {
          throw new Error('Date range is required for comprehensive report');
        }
        
        const comprehensiveData = await generateComprehensiveReport(propertyId, dateRange);
        console.log('✅ Comprehensive report generated successfully');
        console.log('📊 Comprehensive data structure:', {
          hasOverview: !!comprehensiveData.overview,
          hasEngagement: !!comprehensiveData.engagement,
          hasChannels: !!comprehensiveData.channels,
          hasCountries: !!comprehensiveData.countries,
          hasBrowsers: !!comprehensiveData.browsers,
          hasDevices: !!comprehensiveData.devices,
          hasDailyTrend: !!comprehensiveData.dailyTrend,
        });
        
        // Check if we have at least some data
        const hasAnyData = comprehensiveData.overview || comprehensiveData.engagement || 
                          comprehensiveData.channels || comprehensiveData.countries;
        
        if (!hasAnyData) {
          console.warn('⚠️ Comprehensive report generated but no data sections are available');
        }
        
        return NextResponse.json({
          result: `📊 **Comprehensive Traffic Report Generated**\n\nFull breakdown with all sections ready!`,
          data: {
            ...queryResult.data,
            type: 'comprehensive_report',
            comprehensiveData,
            mcpData: comprehensiveData.overview || {}, // Use overview as primary data for BeautifulReport
            mcpParams: {
              property_id: propertyId,
              date_ranges: [dateRange],
              isComprehensiveReport: true,
            },
            parsed: {
              ...queryResult.data.parsed,
              isComprehensiveReport: true,
            },
          },
        });
      } catch (error) {
        console.error('❌ Error generating comprehensive report:', error);
        console.error('❌ Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace',
          propertyId,
          dateRange,
        });
        return NextResponse.json(
          {
            result: `Error generating comprehensive report: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check the server logs for more details.`,
            data: queryResult.data,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    }

    // If it's a report query and we have the parsed data, try to call MCP tool with iterative refinement
    if (queryResult.data?.type === 'report' && queryResult.data?.mcpParams) {
      // REFINEMENT DISABLED: refineGA4Params import commented out but kept for future use
      // const { refineGA4Params, formatMCPParams } = await import('@/lib/ga4-llm-service');
      const { formatMCPParams } = await import('@/lib/ga4-llm-service');
      let mcpParams = queryResult.data.mcpParams;
      let mcpResult: any = null;
      let lastError: Error | null = null;
      const maxRetries = 2; // Allow up to 2 refinements

      // Try calling MCP, with refinement on error
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          // Log the MCP parameters being used
          console.log(`📊 MCP Parameters (attempt ${attempt + 1}/${maxRetries + 1}):`, JSON.stringify(mcpParams, null, 2));
          
          // Call the MCP tool with the parsed parameters
          mcpResult = await callGA4Report(mcpParams);
          
          // Log that we got a result
          console.log('✅ MCP Result received, row count:', mcpResult?.rows?.length || 0);
          
          // Success! Break out of retry loop
          break;
        } catch (mcpError) {
          lastError = mcpError instanceof Error ? mcpError : new Error(String(mcpError));
          const errorMsg = lastError.message;
          
          console.log(`❌ MCP call failed (attempt ${attempt + 1}/${maxRetries + 1}):`, errorMsg);
          
          // REFINEMENT DISABLED: Skip refinement logic but keep code for future use
          // If we have retries left and it's a parameter error, try to refine
          // if (attempt < maxRetries && (
          //   errorMsg.includes('invalid') ||
          //   errorMsg.includes('not found') ||
          //   errorMsg.includes('property') ||
          //   errorMsg.includes('dimension') ||
          //   errorMsg.includes('metric') ||
          //   errorMsg.includes('filter')
          // )) {
          //   console.log('🔄 Attempting to refine parameters with LLM...');
          //   try {
          //     // Extract original extracted params from the query result
          //     const extractedParams = {
          //       property_id: mcpParams.property_id,
          //       date_ranges: mcpParams.date_ranges,
          //       metrics: mcpParams.metrics,
          //       dimensions: mcpParams.dimensions,
          //       dimension_filter: mcpParams.dimension_filter,
          //       limit: mcpParams.limit,
          //     };
          //     
          //     // Refine parameters based on error
          //     const refinedParams = await refineGA4Params(prompt, extractedParams, errorMsg);
          //     
          //     // Format refined params to MCP format
          //     mcpParams = formatMCPParams(refinedParams, prompt);
          //     
          //     console.log('✨ Refined parameters:', JSON.stringify(mcpParams, null, 2));
          //     
          //     // Continue to next iteration to retry with refined params
          //     continue;
          //   } catch (refineError) {
          //     console.error('Failed to refine parameters:', refineError);
          //     // If refinement fails, break and return error
          //     break;
          //   }
          // } else {
          //   // No more retries or not a parameter error, break
          //   break;
          // }
          
          // No refinement - break on first error
          break;
        }
      }

      // If we got a successful result, return it
      if (mcpResult) {
        const parsedData = queryResult.data?.parsed || {};
        return NextResponse.json({ 
          result: formatMCPReportResult(mcpResult, mcpParams),
          data: { 
            ...queryResult.data, 
            mcpData: mcpResult,
            parsed: {
              ...parsedData,
              propertyId: parsedData.propertyId || mcpParams?.property_id,
              propertyName: parsedData.propertyName,
              chartType: parsedData.chartType,
            },
            mcpParams: {
              ...mcpParams,
              property_name: parsedData.propertyName || mcpParams?.property_name,
              parsed: {
                ...parsedData,
                chartType: parsedData.chartType,
              }
            }
          }
        });
      }

      // If we got here, all attempts failed
      const errorMsg = lastError?.message || 'Unknown error';
      return NextResponse.json({ 
        result: queryResult.result + `\n\n⚠️ **Error:** ${errorMsg}\n\nAfter ${maxRetries + 1} attempt(s), the query could not be executed. Please check your parameters and try again.`,
        data: queryResult.data 
      });
    }

    return NextResponse.json({ 
      result: queryResult.result,
      data: queryResult.data 
    });
  } catch (error) {
    console.error('Error processing GA4 query:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process GA4 query', 
        details: error instanceof Error ? error.message : 'Unknown error',
        result: `Error: ${error instanceof Error ? error.message : 'Failed to process your query. Please try again.'}`
      },
      { status: 500 }
    );
  }
}


/**
 * Formats MCP report result into a readable string
 */
function formatMCPReportResult(mcpResult: any, params: any): string {
  // Log the result structure for debugging
  console.log('formatMCPReportResult - mcpResult:', JSON.stringify(mcpResult, null, 2));
  console.log('formatMCPReportResult - params:', JSON.stringify(params, null, 2));
  
  // Check for different possible response structures
  if (!mcpResult) {
    return 'No data returned from MCP tool (null/undefined result).';
  }
  
  // The MCP response might be wrapped in different structures
  // Try to find the actual data
  let reportData = mcpResult;
  
  // If it's wrapped in a text field, try to parse it
  if (mcpResult.text && typeof mcpResult.text === 'string') {
    try {
      reportData = JSON.parse(mcpResult.text);
    } catch {
      // If parsing fails, use the text as-is
      return `MCP Response (text):\n\n${mcpResult.text}`;
    }
  }
  
  // If it's wrapped in a raw field
  if (mcpResult.raw && typeof mcpResult.raw === 'string') {
    try {
      reportData = JSON.parse(mcpResult.raw);
    } catch {
      return `MCP Response (raw):\n\n${mcpResult.raw}`;
    }
  }
  
  // Check if we have rows in the report data
  if (!reportData.rows) {
    // Return the full structure for debugging
    return `No rows found in MCP response.\n\n**Response Structure:**\n\`\`\`json\n${JSON.stringify(mcpResult, null, 2)}\n\`\`\`\n\n**Report Data:**\n\`\`\`json\n${JSON.stringify(reportData, null, 2)}\n\`\`\``;
  }

  const propertyName = params.property_name || '';
  const dateRange = params.date_ranges?.[0] || {};
  const metrics = params.metrics || [];
  const dimensions = params.dimensions || [];
  
  // Use reportData instead of mcpResult for the rest of the function
  const rows = reportData.rows;

  let response = `📊 **GA4 Analytics Report**\n\n`;
  response += `**Property:** ${params.property_id}${propertyName ? ` (${propertyName})` : ''}\n`;
  response += `**Date Range:** ${dateRange.start_date} to ${dateRange.end_date}\n`;
  response += `**Metrics:** ${metrics.join(', ')}\n`;
  response += `**Dimensions:** ${dimensions.join(', ')}\n\n`;

  // Format the data as a table
  response += `**Report Data:**\n\n`;
  
  // Format header names nicely
  const formatHeaderName = (name: string): string => {
    // Handle camelCase: activeUsers -> Active Users
    return name
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
      .trim();
  };
  
  // Header row - format headers nicely
  const rawHeaders = [...dimensions, ...metrics];
  const formattedHeaders = rawHeaders.map(formatHeaderName);
  response += `| ${formattedHeaders.join(' | ')} |\n`;
  response += `| ${formattedHeaders.map(() => '---').join(' | ')} |\n`;
  
  // Data rows
  rows.forEach((row: any) => {
    const dimValues = row.dimension_values?.map((dv: any) => dv.value || '') || [];
    const metValues = row.metric_values?.map((mv: any) => mv.value || '') || [];
    const allValues = [...dimValues, ...metValues];
    response += `| ${allValues.join(' | ')} |\n`;
  });

  // Add totals if available
  if (reportData.totals && reportData.totals.length > 0) {
    response += `\n**Totals:**\n`;
    reportData.totals[0].metric_values?.forEach((mv: any, idx: number) => {
      response += `${metrics[idx]}: ${mv.value}\n`;
    });
  }

  // Add metadata
  if (reportData.metadata) {
    response += `\n**Metadata:**\n`;
    response += `- Time Zone: ${reportData.metadata.time_zone || 'N/A'}\n`;
    response += `- Currency: ${reportData.metadata.currency_code || 'N/A'}\n`;
    response += `- Total Rows: ${reportData.row_count || rows.length}\n`;
  }

  return response;
}

/**
 * Formats account summaries result into a readable string
 */
function formatAccountSummariesResult(accountSummariesResult: any): string {
  // Log the raw result for debugging
  console.log('Raw account summaries result:', JSON.stringify(accountSummariesResult, null, 2));
  
  let response = `📊 **Your GA4 Properties**\n\n`;

  // Handle different possible response structures
  let accounts: any[] = [];
  
  // Check if result has accountSummaries array
  if (accountSummariesResult.accountSummaries && Array.isArray(accountSummariesResult.accountSummaries)) {
    accounts = accountSummariesResult.accountSummaries;
  } else if (Array.isArray(accountSummariesResult)) {
    accounts = accountSummariesResult;
  } else if (accountSummariesResult.content && Array.isArray(accountSummariesResult.content)) {
    // If wrapped in content array
    accounts = accountSummariesResult.content;
  } else if (accountSummariesResult.text) {
    // If it's a text response, try to parse it
    try {
      const parsed = JSON.parse(accountSummariesResult.text);
      if (parsed.accountSummaries && Array.isArray(parsed.accountSummaries)) {
        accounts = parsed.accountSummaries;
      } else if (Array.isArray(parsed)) {
        accounts = parsed;
      }
    } catch (e) {
      console.error('Failed to parse text response:', e);
    }
  }

  console.log('Parsed accounts:', accounts.length, accounts);

  if (accounts.length === 0) {
    // If no accounts found, return null to signal fallback
    console.log('No accounts found in MCP response, using fallback');
    return null as any; // Signal to use fallback
  }

  let totalProperties = 0;
  let hasValidProperties = false;

  accounts.forEach((account: any, accountIndex: number) => {
    // Try multiple ways to get account name
    const accountName = account.displayName || account.display_name || account.name || account.accountName || `Account ${accountIndex + 1}`;
    
    // Try multiple ways to get account ID
    let accountId = 'N/A';
    if (account.account) {
      accountId = account.account.replace('accounts/', '').replace('accountSummaries/', '');
    } else if (account.accountId) {
      accountId = account.accountId;
    } else if (account.account_id) {
      accountId = account.account_id;
    }
    
    // Try multiple ways to get properties
    const properties = account.propertySummaries || account.property_summaries || account.properties || [];

    console.log(`Account ${accountIndex + 1}: ${accountName} (${accountId}), Properties: ${properties.length}`);

    if (properties.length > 0) {
      hasValidProperties = true;
    }

    totalProperties += properties.length;

    response += `**Account ${accountIndex + 1}: ${accountName}** (Account ID: ${accountId})\n`;
    response += `Contains **${properties.length} properties**${properties.length > 0 ? ':' : ''}\n\n`;

    if (properties.length > 0) {
      properties.forEach((property: any) => {
        // Try multiple ways to get property name
        const propertyName = property.displayName || property.display_name || property.name || property.propertyName || 'Unnamed Property';
        
        // Try multiple ways to get property ID
        let propertyId = 'N/A';
        if (property.property) {
          propertyId = property.property.replace('properties/', '');
        } else if (property.propertyId) {
          propertyId = property.propertyId;
        } else if (property.property_id) {
          propertyId = property.property_id;
        }
        
        const propertyType = property.propertyType || property.property_type || '';
        const status = propertyType === 'PROPERTY_TYPE_GA4' || propertyType === 'PROPERTY_TYPE_ORDINARY' ? '🟢' : '🟠';
        response += `• ${status} ${propertyName} (${propertyId})\n`;
      });
      response += '\n';
    } else {
      response += 'No properties found.\n\n';
    }
  });

  // If no valid properties found, use fallback
  if (!hasValidProperties || totalProperties === 0) {
    console.log('No valid properties found in MCP response, using fallback');
    return null as any; // Signal to use fallback
  }

  response += `**Total: ${totalProperties} properties across ${accounts.length} account${accounts.length === 1 ? '' : 's'}**\n\n`;
  response += `💡 **Tip:** Ask for specific property details using the property ID or name!`;

  return response;
}

/**
 * Formats custom dimensions and metrics result into a readable string
 */
function formatCustomDimensionsResult(customDimsResult: any, propertyId: string): string {
  console.log('Formatting custom dimensions result:', JSON.stringify(customDimsResult, null, 2));

  let response = `📊 **Custom Dimensions & Metrics for Property ${propertyId}**\n\n`;

  // Handle different possible response structures
  let dimensions: any[] = [];
  let metrics: any[] = [];

  // Check if result has customDimensions and customMetrics arrays
  if (customDimsResult.customDimensions && Array.isArray(customDimsResult.customDimensions)) {
    dimensions = customDimsResult.customDimensions;
  } else if (Array.isArray(customDimsResult) && customDimsResult.length > 0) {
    // If it's an array, try to separate dimensions and metrics
    dimensions = customDimsResult.filter((item: any) => 
      item.scope === 'EVENT' || item.scope === 'USER' || item.scope === 'SESSION' || 
      item.apiName?.includes('dimension')
    );
    metrics = customDimsResult.filter((item: any) => 
      item.scope === 'METRIC' || item.apiName?.includes('metric')
    );
  } else if (customDimsResult.dimensions && Array.isArray(customDimsResult.dimensions)) {
    dimensions = customDimsResult.dimensions;
  }

  if (customDimsResult.customMetrics && Array.isArray(customDimsResult.customMetrics)) {
    metrics = customDimsResult.customMetrics;
  } else if (customDimsResult.metrics && Array.isArray(customDimsResult.metrics)) {
    metrics = customDimsResult.metrics;
  }

  // Format dimensions
  if (dimensions.length > 0) {
    response += `## Custom Dimensions (${dimensions.length})\n\n`;
    response += `| API Name | Display Name | Scope | Description |\n`;
    response += `| --- | --- | --- | --- |\n`;
    
    dimensions.forEach((dim: any) => {
      const apiName = dim.apiName || dim.name || 'N/A';
      const displayName = dim.displayName || dim.uiName || 'N/A';
      const scope = dim.scope || 'N/A';
      const description = dim.description || dim.uiName || 'N/A';
      response += `| \`${apiName}\` | ${displayName} | ${scope} | ${description} |\n`;
    });
    response += `\n`;
  } else {
    response += `## Custom Dimensions\n\nNo custom dimensions found.\n\n`;
  }

  // Format metrics
  if (metrics.length > 0) {
    response += `## Custom Metrics (${metrics.length})\n\n`;
    response += `| API Name | Display Name | Scope | Description |\n`;
    response += `| --- | --- | --- | --- |\n`;
    
    metrics.forEach((met: any) => {
      const apiName = met.apiName || met.name || 'N/A';
      const displayName = met.displayName || met.uiName || 'N/A';
      const scope = met.scope || 'N/A';
      const description = met.description || met.uiName || 'N/A';
      response += `| \`${apiName}\` | ${displayName} | ${scope} | ${description} |\n`;
    });
    response += `\n`;
  } else {
    response += `## Custom Metrics\n\nNo custom metrics found.\n\n`;
  }

  // Add usage examples
  if (dimensions.length > 0) {
    response += `## Usage Examples\n\n`;
    response += `To use these custom dimensions in queries, use their API names:\n\n`;
    
    // Show author-related dimensions if found
    const authorDims = dimensions.filter((dim: any) => 
      (dim.apiName || '').toLowerCase().includes('author') ||
      (dim.displayName || '').toLowerCase().includes('author')
    );
    
    if (authorDims.length > 0) {
      response += `**Author Dimensions:**\n`;
      authorDims.forEach((dim: any) => {
        const apiName = dim.apiName || dim.name;
        response += `- "Show pageviews by ${apiName} for property ${propertyId}"\n`;
      });
      response += `\n`;
    }
    
    // Show first few dimensions as examples
    const exampleDims = dimensions.slice(0, 3);
    if (exampleDims.length > 0) {
      response += `**Example Queries:**\n`;
      exampleDims.forEach((dim: any) => {
        const apiName = dim.apiName || dim.name;
        const displayName = dim.displayName || dim.uiName || apiName;
        response += `- "Show pageviews by ${apiName} for property ${propertyId}"\n`;
        response += `  (Dimension: \`${apiName}\` - ${displayName})\n`;
      });
    }
  }

  // If no data found, show raw result for debugging
  if (dimensions.length === 0 && metrics.length === 0) {
    response += `\n**Raw Response:**\n\`\`\`json\n${JSON.stringify(customDimsResult, null, 2)}\n\`\`\`\n`;
  }

  return response;
}

