/**
 * Script to fetch GA4 properties from MCP and output them as a hardcoded list
 * Run with: node scripts/fetch-properties.js
 */

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const path = require('path');
const fs = require('fs');

async function fetchProperties() {
  try {
    // Determine credentials path
    let credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    if (!credentialsPath) {
      credentialsPath = './credentials/ga4-credentials.json';
    }
    
    if (!path.isAbsolute(credentialsPath)) {
      credentialsPath = path.resolve(process.cwd(), credentialsPath);
    }
    
    if (!fs.existsSync(credentialsPath)) {
      throw new Error(`GA4 credentials file not found at: ${credentialsPath}`);
    }
    
    console.log('Connecting to MCP...');
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
        name: 'ga4-chat-properties-fetcher',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    await client.connect(transport);
    console.log('Connected to MCP');
    
    // List available tools
    const tools = await client.listTools();
    console.log('Available tools:', tools.tools.map(t => t.name));
    
    // Find account summaries tool
    const accountTool = tools.tools.find(t => 
      t.name.includes('account') && (t.name.includes('summar') || t.name.includes('list'))
    );
    
    if (!accountTool) {
      throw new Error('Account summaries tool not found');
    }
    
    console.log(`Calling tool: ${accountTool.name}`);
    const result = await client.callTool({
      name: accountTool.name,
      arguments: {},
    });
    
    console.log('\n=== RAW RESULT ===');
    console.log(JSON.stringify(result, null, 2));
    
    // Parse result - handle different response formats
    const accounts = [];
    
    // Check if result has content array with text items (each text item is a single account)
    if (result.content && Array.isArray(result.content)) {
      for (const contentItem of result.content) {
        if (contentItem.type === 'text') {
          try {
            const accountData = JSON.parse(contentItem.text);
            // Each text item contains a single account summary
            if (accountData.property_summaries || accountData.propertySummaries) {
              accounts.push(accountData);
            }
          } catch (e) {
            console.log('Text parsing failed:', e.message);
          }
        }
      }
    }
    
    // Also check structuredContent
    if (accounts.length === 0 && result.structuredContent && result.structuredContent.result) {
      const structuredAccounts = result.structuredContent.result;
      if (Array.isArray(structuredAccounts)) {
        accounts.push(...structuredAccounts);
      }
    }
    
    console.log('Parsed accounts count:', accounts.length);
    if (accounts.length > 0) {
      console.log('First account structure:', JSON.stringify(accounts[0], null, 2));
    }
    
    // Extract properties
    const properties = [];
    accounts.forEach((account) => {
      const accountName = account.displayName || account.display_name || account.name || account.displayName || 'Unknown Account';
      const accountProperties = account.propertySummaries || account.property_summaries || account.properties || [];
      
      console.log(`Account: ${accountName}, Properties: ${accountProperties.length}`);
      
      accountProperties.forEach((property) => {
        const propertyName = property.displayName || property.display_name || property.name || 'Unnamed Property';
        let propertyId = 'N/A';
        if (property.property) {
          propertyId = property.property.replace('properties/', '');
        } else if (property.propertyId) {
          propertyId = property.propertyId;
        } else if (property.property_id) {
          propertyId = property.property_id;
        }
        
        const propertyType = property.propertyType || property.property_type || '';
        if (propertyType === 'PROPERTY_TYPE_GA4' || propertyType === 'PROPERTY_TYPE_ORDINARY' || !propertyType) {
          properties.push({
            id: propertyId,
            name: propertyName,
            accountName: accountName,
          });
        }
      });
    });
    
    console.log('\n=== EXTRACTED PROPERTIES ===');
    console.log(JSON.stringify(properties, null, 2));
    
    // Generate TypeScript constant
    console.log('\n=== TYPESCRIPT CONSTANT ===');
    console.log('export const GA4_PROPERTIES = [');
    properties.forEach((prop, index) => {
      const comma = index < properties.length - 1 ? ',' : '';
      console.log(`  { id: '${prop.id}', name: '${prop.name.replace(/'/g, "\\'")}', accountName: '${prop.accountName.replace(/'/g, "\\'")}' }${comma}`);
    });
    console.log('];');
    
    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fetchProperties();

