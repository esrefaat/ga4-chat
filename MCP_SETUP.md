# MCP Tools Setup Guide

## Current Status

MCP tools are available in the Cursor AI environment and can be called successfully. However, they are not directly accessible from the Next.js server process.

## The Challenge

- ✅ MCP tools work in Cursor AI environment
- ❌ MCP tools are NOT available to Next.js server processes
- ❌ Next.js API routes run in a separate process from Cursor

## Solutions

### Option 1: MCP Server Bridge (Recommended for Production)

Set up a standalone MCP server that Next.js can connect to:

1. **Install MCP Server:**
   ```bash
   npm install -g @modelcontextprotocol/server-ga4
   ```

2. **Configure MCP Client in Next.js:**
   Update `src/app/api/ga4/mcp-proxy/route.ts` to connect to your MCP server:
   ```typescript
   import { Client } from '@modelcontextprotocol/sdk/client/index.js';
   import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
   
   const transport = new StdioClientTransport({
     command: 'npx',
     args: ['-y', '@modelcontextprotocol/server-ga4'],
   });
   
   const client = new Client({
     name: 'ga4-chat',
     version: '1.0.0',
   }, {
     capabilities: {},
   });
   
   await client.connect(transport);
   ```

### Option 2: Environment Variable Configuration

For development, you can enable the MCP proxy:

1. **Create `.env.local`:**
   ```bash
   ENABLE_MCP_PROXY=true
   NEXT_PUBLIC_APP_URL=http://localhost:3008
   ```

2. **Configure MCP Proxy:**
   The proxy endpoint at `/api/ga4/mcp-proxy` needs to be connected to an MCP server.

### Option 3: Serverless Functions

Use serverless functions (Vercel, AWS Lambda, etc.) that have access to MCP tools:

1. Create a serverless function that calls MCP tools
2. Update the Next.js API route to call the serverless function
3. The serverless function can have MCP tools configured

## Testing MCP Tools

The MCP tools are working! Here's a test call that was successful:

**Request:**
```json
{
  "property_id": "358690483",
  "date_ranges": [
    {
      "start_date": "7daysAgo",
      "end_date": "yesterday",
      "name": "Last7Days"
    }
  ],
  "metrics": ["activeUsers"],
  "dimensions": ["date"]
}
```

**Response:** ✅ Successfully returned 7 days of active user data

## Next Steps

1. Choose one of the solutions above
2. Configure the MCP server connection
3. Update `src/app/api/ga4/mcp-proxy/route.ts` with the actual implementation
4. Test the connection

## Current Implementation

The code is structured to:
- Parse natural language queries
- Extract GA4 parameters
- Call MCP tools via the bridge
- Format and return results

The only missing piece is the actual MCP server connection in the Next.js process.

