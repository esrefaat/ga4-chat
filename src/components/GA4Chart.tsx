'use client';

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from '@/contexts/ThemeContext';

export interface ChartData {
  date?: string;
  [key: string]: string | number | undefined;
}

interface GA4ChartProps {
  data: ChartData[];
  metrics: string[];
  dimensions: string[];
  chartType?: 'line' | 'bar' | 'pie' | 'doughnut';
}

export default function GA4Chart({ data, metrics, dimensions, chartType }: GA4ChartProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  if (!data || data.length === 0 || !metrics || metrics.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">
        No chart data available
      </div>
    );
  }

  // Determine chart type based on dimensions and data structure
  const hasDateDimension = dimensions.includes('date');
  const firstDimension = dimensions[0] || '';
  const isChannelDimension = firstDimension === 'sessionDefaultChannelGroup' || 
                             firstDimension === 'sessionSource' ||
                             firstDimension === 'country' ||
                             firstDimension === 'deviceCategory';
  
  // Auto-detect chart type if not specified
  let finalChartType: 'line' | 'bar' | 'pie' | 'doughnut' = chartType || 'line';
  
  if (!chartType) {
    // Use pie/doughnut for categorical breakdowns (channels, countries, devices) without date
    if (isChannelDimension && !hasDateDimension && data.length <= 10) {
      finalChartType = 'doughnut';
    } else if (hasDateDimension) {
      finalChartType = 'line';
    } else {
      finalChartType = 'bar';
    }
  }

  // Format metric names for display
  const formatMetricName = (metric: string): string => {
    const metricNames: Record<string, string> = {
      activeUsers: 'Active Users',
      sessions: 'Sessions',
      screenPageViews: 'Page Views',
      bounceRate: 'Bounce Rate',
      bounces: 'Bounces',
      eventCount: 'Events',
      totalRevenue: 'Revenue',
      averageSessionDuration: 'Avg Session Duration',
    };
    return metricNames[metric] || metric;
  };

  // Format dimension values for display
  const formatDimensionValue = (value: string, dimension: string): string => {
    if (dimension === 'date' && value.length === 8) {
      // Format YYYYMMDD to readable date (e.g., "Nov 7")
      const year = value.slice(0, 4);
      const month = value.slice(4, 6);
      const day = value.slice(6, 8);
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    // Truncate long labels
    if (value.length > 20) {
      return value.substring(0, 17) + '...';
    }
    return value;
  };

  // Determine X-axis data key (use first dimension, or 'date' if available)
  const xAxisKey = dimensions.includes('date') ? 'date' : dimensions[0] || 'date';
  
  // Prepare data for Recharts (array of objects format)
  const chartData = data.map((row) => {
    const formattedRow: Record<string, any> = {};
    
    // Add dimensions - use the first dimension as the primary key for X-axis
    dimensions.forEach((dim, index) => {
      const dimKey = `dimension_${index}`;
      const value = row[dimKey] || row[dim] || '';
      const formattedValue = formatDimensionValue(String(value), dim);
      
      // Use first dimension as primary key (for X-axis)
      if (index === 0) {
        formattedRow[dim] = formattedValue;
        // Also set as 'date' for compatibility if it's the date dimension
        if (dim === 'date') {
          formattedRow.date = formattedValue;
        }
      } else {
        // Additional dimensions as separate fields
        formattedRow[dim] = formattedValue;
      }
    });
    
    // Add metrics
    metrics.forEach((metric) => {
      const metricKey = `metric_${metric}`;
      const value = row[metricKey] || row[metric] || 0;
      const metricName = formatMetricName(metric);
      formattedRow[metricName] = typeof value === 'string' ? parseFloat(value) || 0 : value;
    });
    
    return formattedRow;
  });

  // Enhanced color palette
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#EC4899', // Pink
    '#14B8A6', // Teal
  ];

  // Format Y-axis tick values
  const formatYAxisTick = (value: number): string => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  };

  // Theme colors
  const textColor = isDarkMode ? '#cbd5e1' : '#6B7280';
  const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#F3F4F6';
  const tooltipBg = isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)';
  const tooltipText = isDarkMode ? '#f1f5f9' : '#111827';
  const tooltipBorder = isDarkMode ? 'rgba(255, 255, 255, 0.2)' : '#E5E7EB';

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: tooltipBg,
            border: `1px solid ${tooltipBorder}`,
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
        >
          <p style={{ color: tooltipText, fontWeight: 600, marginBottom: '8px' }}>
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              style={{
                color: entry.color,
                margin: '4px 0',
                fontSize: '14px',
              }}
            >
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render Line Chart
  if (finalChartType === 'line') {
    return (
      <div className="h-[400px] w-full min-h-[400px]">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey={xAxisKey}
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fill: textColor, fontSize: 11 }}
              stroke={gridColor}
            />
            <YAxis
              tick={{ fill: textColor, fontSize: 11 }}
              tickFormatter={formatYAxisTick}
              stroke={gridColor}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
              formatter={(value) => <span style={{ color: textColor, fontSize: 12 }}>{value}</span>}
            />
            {metrics.map((metric, index) => {
              const metricName = formatMetricName(metric);
              return (
                <Line
                  key={metricName}
                  type="monotone"
                  dataKey={metricName}
                  stroke={colors[index % colors.length]}
                  strokeWidth={3}
                  dot={{ fill: isDarkMode ? '#ffffff' : colors[index % colors.length], r: 4 }}
                  activeDot={{ r: 6 }}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.1}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Render Bar Chart
  if (finalChartType === 'bar') {
    return (
      <div className="h-[400px] w-full min-h-[400px]">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey={xAxisKey}
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fill: textColor, fontSize: 11 }}
              stroke={gridColor}
            />
            <YAxis
              tick={{ fill: textColor, fontSize: 11 }}
              tickFormatter={formatYAxisTick}
              stroke={gridColor}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => <span style={{ color: textColor, fontSize: 12 }}>{value}</span>}
            />
            {metrics.map((metric, index) => {
              const metricName = formatMetricName(metric);
              return (
                <Bar
                  key={metricName}
                  dataKey={metricName}
                  fill={colors[index % colors.length]}
                  radius={[4, 4, 0, 0]}
                />
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Render Pie/Doughnut Chart
  if (finalChartType === 'pie' || finalChartType === 'doughnut') {
    const pieData = chartData.map((row, index) => ({
      name: String(row[xAxisKey] || `Item ${index + 1}`),
      value: row[formatMetricName(metrics[0])] as number || 0,
    }));

    const total = pieData.reduce((sum, item) => sum + item.value, 0);

    // Custom label for pie chart
    const renderLabel = (entry: any) => {
      const percent = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;
      return `${entry.name}: ${entry.value.toLocaleString()} (${percent}%)`;
    };

    return (
      <div className="h-[400px] w-full min-h-[400px]">
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={finalChartType === 'doughnut' ? 100 : 120}
              innerRadius={finalChartType === 'doughnut' ? 60 : 0}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0];
                  const percent = total > 0 ? ((data.value as number / total) * 100).toFixed(1) : 0;
                  return (
                    <div
                      style={{
                        backgroundColor: tooltipBg,
                        border: `1px solid ${tooltipBorder}`,
                        borderRadius: '8px',
                        padding: '12px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      }}
                    >
                      <p style={{ color: tooltipText, fontWeight: 600, marginBottom: '4px' }}>
                        {data.name}
                      </p>
                      <p style={{ color: data.payload.fill, margin: 0, fontSize: '14px' }}>
                        {formatMetricName(metrics[0])}: {data.value?.toLocaleString()} ({percent}%)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => <span style={{ color: textColor, fontSize: 12 }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return null;
}
