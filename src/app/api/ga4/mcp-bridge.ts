/**
 * MCP Bridge for GA4 API Route
 * 
 * This file provides a bridge to call MCP tools from Next.js API routes.
 * 
 * IMPORTANT: MCP tools are available in the Cursor AI environment.
 * This bridge provides the interface, but actual MCP calls need to be
 * configured based on your deployment setup.
 */

export interface GA4ReportParams {
  property_id: string | number;
  date_ranges: Array<{ start_date: string; end_date: string; name: string }>;
  metrics: string[];
  dimensions: string[];
  dimension_filter?: any;
  metric_filter?: any;
  order_bys?: any[];
  limit?: number;
  offset?: number;
  currency_code?: string;
}

// Import MCP SDK
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import * as path from 'path';
import * as fs from 'fs';

// Cache for MCP client to avoid reconnecting on every request
let mcpClient: Client | null = null;
let mcpClientPromise: Promise<Client> | null = null;

/**
 * Gets or creates an MCP client connection
 */
async function getMCPClient(): Promise<Client> {
  // If client already exists and is connected, return it
  if (mcpClient) {
    return mcpClient;
  }

  // If a connection is in progress, wait for it
  if (mcpClientPromise) {
    return mcpClientPromise;
  }

  // Create new connection
  mcpClientPromise = (async () => {
    try {
      // Use the same analytics MCP server configuration as Cursor
      // This matches the configuration in ~/.cursor/mcp.json
      // Determine credentials path - prioritize environment variable, then local dev path, then container path
      let credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      
      if (!credentialsPath) {
        // Default paths based on environment
        const defaultPath = process.env.NODE_ENV === 'development' 
          ? './credentials/ga4-credentials.json' 
          : '/app/credentials/ga4-credentials.json';
        credentialsPath = defaultPath;
      }
      
      // Resolve relative paths to absolute paths for MCP server
      if (!path.isAbsolute(credentialsPath)) {
        const projectRoot = process.cwd();
        credentialsPath = path.resolve(projectRoot, credentialsPath);
      }
      
      // Verify file exists (skip in production if mounted as volume - Kubernetes will handle it)
      if (process.env.NODE_ENV !== 'production' && !fs.existsSync(credentialsPath)) {
        throw new Error(
          `GA4 credentials file not found at: ${credentialsPath}\n` +
          `Please ensure GOOGLE_APPLICATION_CREDENTIALS is set correctly or credentials file exists`
        );
      }
      
      const transport = new StdioClientTransport({
        command: 'pipx',
        args: ['run', 'analytics-mcp'],
        env: {
          GOOGLE_APPLICATION_CREDENTIALS: credentialsPath,
          GOOGLE_PROJECT_ID: process.env.GOOGLE_PROJECT_ID || '',
        },
      });

      const client = new Client(
        {
          name: 'ga4-chat',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      await client.connect(transport);
      mcpClient = client;
      return client;
    } catch (error) {
      mcpClientPromise = null; // Reset on error so we can retry
      throw error;
    }
  })();

  return mcpClientPromise;
}

/**
 * Lists available tools from the MCP server
 * Useful for debugging to see what tools are available
 */
async function listAvailableTools(): Promise<string[]> {
  try {
    const client = await getMCPClient();
    const tools = await client.listTools();
    return tools.tools.map(tool => tool.name);
  } catch (error) {
    console.error('Failed to list tools:', error);
    return [];
  }
}

/**
 * Calls the GA4 MCP run_report tool
 * 
 * This function calls the MCP analytics tool to get GA4 report data.
 * It uses the MCP SDK to connect to the analytics MCP server.
 */
/**
 * Gets custom dimensions and metrics for a property
 */
export async function getCustomDimensionsAndMetrics(propertyId: string | number): Promise<any> {
  try {
    const client = await getMCPClient();
    const availableTools = await listAvailableTools();
    console.log('Available MCP tools for custom dimensions:', availableTools);

    // Try different tool name formats
    const toolNames = [
      'get_custom_dimensions_and_metrics',
      'mcp_analytics-mcp_get_custom_dimensions_and_metrics',
      'analytics-mcp_get_custom_dimensions_and_metrics',
    ];

    let prioritizedNames: string[] = [];
    if (availableTools.length > 0) {
      const customDimTools = availableTools.filter(name =>
        name.includes('custom') && (name.includes('dimension') || name.includes('metric'))
      );
      prioritizedNames = [...customDimTools, ...toolNames];
    } else {
      prioritizedNames = toolNames;
    }

    let result;
    let lastError;

    console.log('📤 Calling custom dimensions tool with property_id:', propertyId);
    console.log('🔧 Trying tool names in order:', prioritizedNames);

    for (const toolName of prioritizedNames) {
      try {
        console.log(`🔄 Attempting to call tool: ${toolName}`);
        result = await client.callTool({
          name: toolName,
          arguments: {
            property_id: propertyId,
          } as unknown as Record<string, unknown>,
        });
        console.log(`✅ Successfully called tool: ${toolName}`);
        break;
      } catch (error) {
        console.log(`❌ Tool ${toolName} failed:`, error instanceof Error ? error.message : error);
        lastError = error;
        continue;
      }
    }

    if (!result) {
      throw lastError || new Error(
        `Failed to call any custom dimensions tool. Available tools: ${availableTools.join(', ') || 'none found'}`
      );
    }

    console.log('📥 Custom dimensions result received');

    // Parse the result
    if (result.content && Array.isArray(result.content) && result.content.length > 0) {
      const content = result.content[0];
      if (content.type === 'text') {
        try {
          return JSON.parse(content.text);
        } catch {
          return { raw: content.text };
        }
      } else if (content.type === 'resource') {
        return content;
      }
    }

    return result;
  } catch (error) {
    console.error('Error getting custom dimensions:', error);
    throw new Error(
      `Failed to get custom dimensions: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function callGA4Report(params: GA4ReportParams): Promise<any> {
  try {
    const client = await getMCPClient();
    
    // First, try to list available tools to find the correct name
    // This helps with debugging and ensures we use the right tool name
    const availableTools = await listAvailableTools();
    console.log('Available MCP tools:', availableTools);
    
    // Try different tool name formats - analytics-mcp might use different naming
    // IMPORTANT: Prioritize run_report over run_realtime_report for historical data
    const toolNames = [
      'run_report',                     // Standard report (for historical data)
      'mcp_analytics-mcp_run_report',  // Full format (what I use as AI)
      'analytics-mcp_run_report',      // Alternative format
    ];
    
    // If we found tools, prioritize run_report over run_realtime_report
    let prioritizedNames: string[] = [];
    if (availableTools.length > 0) {
      // Explicitly prioritize run_report for historical queries
      const runReportTools = availableTools.filter(name => 
        name === 'run_report' || name.includes('run_report') && !name.includes('realtime')
      );
      const otherReportTools = availableTools.filter(name => 
        (name.includes('report') || name.includes('run')) && 
        !name.includes('realtime') && 
        !runReportTools.includes(name)
      );
      prioritizedNames = [...runReportTools, ...otherReportTools, ...toolNames];
    } else {
      prioritizedNames = toolNames;
    }
    
    let result;
    let lastError;
    
    // Log the exact parameters being sent to MCP
    console.log('📤 Calling MCP tool with parameters:', JSON.stringify(params, null, 2));
    console.log('🔧 Trying tool names in order:', prioritizedNames);
    
    for (const toolName of prioritizedNames) {
      try {
        // Create a fresh copy of params to avoid any reference issues
        const callParams = {
          property_id: params.property_id,
          date_ranges: params.date_ranges,
          metrics: params.metrics,
          dimensions: params.dimensions,
          ...(params.dimension_filter && { dimension_filter: params.dimension_filter }),
          ...(params.metric_filter && { metric_filter: params.metric_filter }),
          ...(params.order_bys && { order_bys: params.order_bys }),
          ...(params.limit && { limit: params.limit }),
          ...(params.offset && { offset: params.offset }),
          ...(params.currency_code && { currency_code: params.currency_code }),
        };
        
        console.log(`🔄 Attempting to call tool: ${toolName}`);
        console.log(`📋 Exact parameters being sent:`, JSON.stringify(callParams, null, 2));
        result = await client.callTool({
          name: toolName,
          arguments: callParams as unknown as Record<string, unknown>,
        });
        console.log(`✅ Successfully called tool: ${toolName}`);
        console.log(`📥 Result received at: ${new Date().toISOString()}`);
        break; // Success, exit loop
      } catch (error) {
        console.log(`❌ Tool ${toolName} failed:`, error instanceof Error ? error.message : error);
        lastError = error;
        // Try next tool name
        continue;
      }
    }
    
    if (!result) {
      throw lastError || new Error(
        `Failed to call any tool. Available tools: ${availableTools.join(', ') || 'none found'}`
      );
    }

    // Log the full result for debugging
    console.log('MCP tool result structure:', JSON.stringify(result, null, 2));
    
    // Return the result content
    // The result has a content array with text or other content types
    if (result.content && Array.isArray(result.content) && result.content.length > 0) {
      const content = result.content[0];
      console.log('MCP content type:', content.type);
      
      if (content.type === 'text') {
        try {
          const parsed = JSON.parse(content.text);
          console.log('Parsed MCP response:', JSON.stringify(parsed, null, 2));
          return parsed;
        } catch (parseError) {
          console.log('Failed to parse as JSON, returning text:', content.text);
          // If not JSON, return the text as-is wrapped in a structure
          return { text: content.text, raw: content.text };
        }
      } else {
        console.log('Non-text content:', content);
        return content;
      }
    }

    // Return the full result if content parsing didn't work
    console.log('No content array found, returning full result');
    return result;
  } catch (error) {
    console.error('MCP call error:', error);
    
    // If MCP client fails, provide helpful error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check if it's a connection error
    if (errorMessage.includes('ENOENT') || errorMessage.includes('command') || errorMessage.includes('spawn')) {
      throw new Error(
        `Failed to connect to MCP server. ` +
        `The MCP SDK requires a running MCP server. ` +
        `In Cursor, MCP tools are available to the AI assistant but need to be bridged to Next.js. ` +
        `Error: ${errorMessage}`
      );
    }
    
    throw new Error(
      `Failed to call GA4 MCP tool: ${errorMessage}. ` +
      `\n\nRequest parameters:\n${JSON.stringify(params, null, 2)}`
    );
  }
}

/**
 * Calls the GA4 MCP get_account_summaries tool
 */
export async function callGA4AccountSummaries(): Promise<any> {
  try {
    const client = await getMCPClient();
    const availableTools = await listAvailableTools();
    console.log('Available MCP tools for account summaries:', availableTools);

    // Try different tool name formats
    const toolNames = [
      'get_account_summaries',
      'mcp_analytics-mcp_get_account_summaries',
      'analytics-mcp_get_account_summaries',
    ];

    let prioritizedNames: string[] = [];
    if (availableTools.length > 0) {
      const accountTools = availableTools.filter(name =>
        name.includes('account') && (name.includes('summar') || name.includes('list'))
      );
      prioritizedNames = [...accountTools, ...toolNames];
    } else {
      prioritizedNames = toolNames;
    }

    let result;
    let lastError;

    console.log('📤 Calling account summaries tool');
    console.log('🔧 Trying tool names in order:', prioritizedNames);

    for (const toolName of prioritizedNames) {
      try {
        console.log(`🔄 Attempting to call tool: ${toolName}`);
        result = await client.callTool({
          name: toolName,
          arguments: {} as unknown as Record<string, unknown>,
        });
        console.log(`✅ Successfully called tool: ${toolName}`);
        break;
      } catch (error) {
        console.log(`❌ Tool ${toolName} failed:`, error instanceof Error ? error.message : error);
        lastError = error;
        continue;
      }
    }

    if (!result) {
      throw lastError || new Error('No result from account summaries tool');
    }

    return result;
  } catch (error) {
    console.error('Error calling account summaries:', error);
    throw new Error(
      `Failed to get account summaries: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Calls the GA4 MCP get_property_details tool
 */
export async function callGA4PropertyDetails(property_id: string | number): Promise<any> {
  // Would call: mcp_analytics-mcp_get_property_details({ property_id })
  throw new Error(`MCP client not configured for property details: ${property_id}`);
}

/**
 * Calls the GA4 MCP run_realtime_report tool
 */
export async function callGA4RealtimeReport(params: {
  property_id: string | number;
  dimensions: string[];
  metrics: string[];
  dimension_filter?: any;
  metric_filter?: any;
  limit?: number;
  offset?: number;
}): Promise<any> {
  // Would call: mcp_analytics-mcp_run_realtime_report(params)
  throw new Error('MCP client not configured for realtime reports');
}

