# GA4 Chat - Chat with Your Google Analytics

A modern React + TypeScript web application that allows you to interact with your Google Analytics data using natural language queries through the GA4 MCP tool.

## Features

- 🎨 Modern, clean UI with chat interface
- 💬 Real-time conversation with GA4 data
- 🔄 Auto-scrolling message area
- ⚡ Built with Next.js 14 and TypeScript
- 🎯 Direct integration with GA4 MCP tool

## Getting Started

### Prerequisites

- Node.js 18+ installed
- GA4 MCP tool configured in Cursor

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── ga4/
│   │       └── route.ts          # API route for MCP tool calls
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Main chat page
│   └── globals.css                # Global styles
├── components/
│   ├── ChatMessage.tsx            # Message bubble component
│   └── ChatInput.tsx              # Input field with send button
├── hooks/
│   └── useGA4Chat.ts              # Chat state management hook
├── lib/
│   └── mcp-client.ts              # MCP client utility
└── styles/
    └── chat.css                   # Chat-specific styles
```

## MCP Integration

The application connects to the GA4 MCP tool through the API route at `/api/ga4`. 

To complete the MCP integration:

1. Ensure the GA4 MCP tool is configured in your Cursor MCP settings
2. Update `src/lib/mcp-client.ts` to use your actual MCP client implementation
3. The MCP tool should be called with:
   ```typescript
   await mcpClient.tools.call("google-analytics", "query", { prompt: userMessage })
   ```

## Usage

1. Type your question about Google Analytics data in the input field
2. Press Enter or click Send
3. The query is sent to the GA4 MCP tool
4. The response is displayed as an assistant message

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Design

- **Font**: Inter (Google Fonts)
- **Colors**: 
  - Background: #f6f6f6
  - User messages: #0073E6 (blue)
  - Assistant messages: White with subtle border
- **Layout**: Centered container, max-width 900px
- **Responsive**: Works on desktop and mobile devices

## License

MIT

