import React from 'react';
import { Message } from '@/hooks/useGA4Chat';
import GA4Chart from './GA4Chart';
import { MarkdownTable, extractTablesFromMarkdown } from './MarkdownTable';
import BeautifulReport from './BeautifulReport';

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const hasChartData = message.chartData && message.chartData.length > 0 && 
                       message.metrics && message.metrics.length > 0;
  const hasReportData = (message as any).mcpData && (message as any).mcpParams;

  // Extract tables from markdown text
  const { textWithoutTables, tables } = extractTablesFromMarkdown(message.text);
  
  // Debug: Log table extraction
  if (!isUser && tables.length > 0) {
    console.log('Found tables:', tables.length, tables);
  }
  
  // Split text by table placeholders and render accordingly
  const renderMessageContent = () => {
    if (tables.length === 0) {
      // If no tables found, check if there's markdown table syntax and render as plain text
      // This helps debug why tables aren't being parsed
      return <div className="message-text whitespace-pre-wrap">{message.text}</div>;
    }

    const parts: React.ReactNode[] = [];
    let currentText = textWithoutTables;
    let tableIndex = 0;

    // Split by table placeholders and render text + tables
    const segments = currentText.split(/\[TABLE_\d+\]/);
    
    segments.forEach((segment, index) => {
      if (segment.trim()) {
        parts.push(
          <div key={`text-${index}`} className="message-text whitespace-pre-wrap mb-4">
            {segment.trim()}
          </div>
        );
      }
      
      if (tableIndex < tables.length) {
        parts.push(
          <MarkdownTable
            key={`table-${tableIndex}`}
            headers={tables[tableIndex].headers}
            rows={tables[tableIndex].rows}
            propertyId={message.propertyId}
            propertyName={message.propertyName}
          />
        );
        tableIndex++;
      }
    });

    return <>{parts}</>;
  };

  return (
    <div className={`chat-message ${isUser ? 'user-message' : 'assistant-message'}`}>
      <div className="message-bubble">
        {/* Render beautiful report FIRST if available */}
        {hasReportData && !isUser && (
          <BeautifulReport
            mcpData={(message as any).mcpData}
            mcpParams={(message as any).mcpParams}
            propertyId={message.propertyId}
            propertyName={message.propertyName}
            comprehensiveData={(message as any).comprehensiveData}
          />
        )}
        
        {/* Render chart if data is available (but no full report) */}
        {hasChartData && !hasReportData && (
          <div className="chart-container mb-6 w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 shadow-md">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Data Visualization</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {message.metrics?.map(m => {
                  const names: Record<string, string> = {
                    activeUsers: 'Active Users',
                    sessions: 'Sessions',
                    screenPageViews: 'Page Views',
                    bounceRate: 'Bounce Rate',
                  };
                  return names[m] || m;
                }).join(', ')}
                {message.dimensions && message.dimensions.length > 0 && (
                  <span> by {message.dimensions[0]}</span>
                )}
              </p>
            </div>
            <GA4Chart
              data={message.chartData!}
              metrics={message.metrics!}
              dimensions={message.dimensions || ['date']}
              chartType={message.chartType}
            />
          </div>
        )}
        
        {/* Then render text content and tables */}
        {renderMessageContent()}
        
        <div className="message-timestamp">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

