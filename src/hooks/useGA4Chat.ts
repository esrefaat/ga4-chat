import { useState, useRef, useEffect, useCallback } from 'react';
import { useCurrentUser } from './useCurrentUser';

export interface ChartData {
  date?: string;
  [key: string]: string | number | undefined;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  chartData?: ChartData[];
  metrics?: string[];
  dimensions?: string[];
  propertyId?: string;
  propertyName?: string;
  mcpData?: any;
  mcpParams?: any;
  chartType?: 'line' | 'bar' | 'pie' | 'doughnut';
  comprehensiveData?: any; // Comprehensive report data
}

export function useGA4Chat() {
  const { user } = useCurrentUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = useCallback((role: 'user' | 'assistant', text: string) => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      role,
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  }, []);

  const sendToGA4 = useCallback(async (prompt: string) => {
    if (!prompt.trim() || isLoading) return;

    // Add user message
    addMessage('user', prompt);
    setIsLoading(true);

    try {
      // Call the API route which will interface with the MCP tool
      // Add cache-busting to ensure fresh data
      const response = await fetch('/api/ga4', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        body: JSON.stringify({ 
          prompt,
          propertyId: user?.username 
            ? localStorage.getItem(`ga4_selected_property_id_${user.username}`) || undefined
            : undefined,
          timestamp: Date.now(), // Add timestamp to ensure unique request
        }),
        cache: 'no-store', // Disable caching
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      const result = data.result || data.response || JSON.stringify(data);
      
      // Extract chart data if available
      const mcpData = data.data?.mcpData;
      const params = data.data?.mcpParams || {};
      const parsedData = data.data?.parsed || {};
      const comprehensiveData = data.data?.comprehensiveData; // Comprehensive report data
      
      let chartData: ChartData[] | undefined;
      let metrics: string[] | undefined;
      let dimensions: string[] | undefined;
      let propertyId: string | undefined;
      let propertyName: string | undefined;
      
      // Extract property info from params or parsed data
      propertyId = params.property_id?.toString() || parsedData.propertyId;
      propertyName = parsedData.propertyName || params.property_name;
      
      // Extract chart type from parsed data
      const chartType = parsedData.chartType;
      
      if (mcpData && mcpData.rows && Array.isArray(mcpData.rows)) {
        // Parse GA4 data into chart format
        metrics = params.metrics || [];
        dimensions = params.dimensions || [];
        
        chartData = mcpData.rows.map((row: any) => {
          const chartRow: ChartData = {};
          
          // Extract dimension values
          if (row.dimension_values && Array.isArray(row.dimension_values) && dimensions) {
            const dims = dimensions; // Type narrowing
            row.dimension_values.forEach((dv: any, index: number) => {
              const dimName = dims[index] || `dimension_${index}`;
              chartRow[`dimension_${index}`] = dv.value || '';
              chartRow[dimName] = dv.value || '';
            });
          }
          
          // Extract metric values
          if (row.metric_values && Array.isArray(row.metric_values) && metrics) {
            const mets = metrics; // Type narrowing
            row.metric_values.forEach((mv: any, index: number) => {
              const metricName = mets[index] || `metric_${index}`;
              chartRow[`metric_${metricName}`] = mv.value || 0;
              chartRow[metricName] = mv.value || 0;
            });
          }
          
          return chartRow;
        });
      }
      
      // Ensure property info is set (should already be set above, but double-check)
      if (!propertyId) {
        propertyId = parsedData?.propertyId || params?.property_id?.toString();
      }
      if (!propertyName) {
        propertyName = parsedData?.propertyName || params?.property_name;
      }
      
      // Add assistant response with chart data
      const assistantMessage: Message = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        text: result,
        timestamp: new Date(),
        chartData,
        metrics,
        dimensions,
        propertyId,
        propertyName,
        mcpData: data.data?.mcpData,
        mcpParams: data.data?.mcpParams,
        chartType: chartType, // Include chart type
        comprehensiveData: comprehensiveData, // Include comprehensive data
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? `Error: ${error.message}` 
        : 'An unknown error occurred while querying GA4 data.';
      addMessage('assistant', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [addMessage, isLoading]);

  return {
    messages,
    isLoading,
    addMessage,
    sendToGA4,
    messagesEndRef,
  };
}

