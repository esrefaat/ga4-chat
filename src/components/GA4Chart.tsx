'use client';

import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { useTheme } from '@/contexts/ThemeContext';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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
  
  // Prepare data for chart
  const chartData = data.map((row) => {
    const formattedRow: ChartData = {};
    
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
      formattedRow[formatMetricName(metric)] = typeof value === 'string' ? parseFloat(value) || 0 : value;
    });
    
    return formattedRow;
  });

  // Extract labels (X-axis) and datasets
  const labels = chartData.map(row => String(row[xAxisKey] || ''));
  
  // Enhanced color palette
  const colors = [
    { border: '#3B82F6', background: 'rgba(59, 130, 246, 0.1)' }, // Blue
    { border: '#10B981', background: 'rgba(16, 185, 129, 0.1)' }, // Green
    { border: '#F59E0B', background: 'rgba(245, 158, 11, 0.1)' }, // Amber
    { border: '#EF4444', background: 'rgba(239, 68, 68, 0.1)' }, // Red
    { border: '#8B5CF6', background: 'rgba(139, 92, 246, 0.1)' }, // Purple
    { border: '#06B6D4', background: 'rgba(6, 182, 212, 0.1)' }, // Cyan
    { border: '#EC4899', background: 'rgba(236, 72, 153, 0.1)' }, // Pink
    { border: '#14B8A6', background: 'rgba(20, 184, 166, 0.1)' }, // Teal
  ];

  const datasets = metrics.map((metric, index) => {
    const metricName = formatMetricName(metric);
    const color = colors[index % colors.length];
    
    // Adjust colors for dark mode - use brighter, more vibrant colors
    const borderColor = isDarkMode ? color.border : color.border;
    const backgroundColor = finalChartType === 'line' 
      ? (isDarkMode ? color.border + '20' : color.background) // 20 = ~12% opacity in hex
      : color.border;
    
    return {
      label: metricName,
      data: chartData.map(row => row[metricName] as number || 0),
      borderColor: borderColor,
      backgroundColor: backgroundColor,
      borderWidth: 3,
      fill: finalChartType === 'line',
      tension: 0.4, // Smooth curves for line charts
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: isDarkMode ? '#ffffff' : color.border, // White markers in dark mode
      pointBorderColor: isDarkMode ? borderColor : '#fff', // Blue border in dark mode
      pointBorderWidth: 2,
    };
  });

  const chartDataConfig = {
    labels,
    datasets,
  };

  // Dark mode color scheme
  const textColor = isDarkMode ? '#cbd5e1' : '#6B7280';
  const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#F3F4F6';
  const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.2)' : '#E5E7EB';
  const tooltipBg = isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)';
  const tooltipText = isDarkMode ? '#f1f5f9' : '#111827';
  const tooltipBody = isDarkMode ? '#cbd5e1' : '#374151';
  const tooltipBorder = isDarkMode ? 'rgba(255, 255, 255, 0.2)' : '#E5E7EB';

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            weight: 500,
          },
          color: textColor,
        },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tooltipBody,
        borderColor: tooltipBorder,
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y || context.parsed;
            return `${context.dataset.label}: ${typeof value === 'number' ? value.toLocaleString() : value}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: isDarkMode, // Show grid in dark mode
          color: gridColor,
          borderDash: isDarkMode ? [5, 5] : undefined, // Dashed lines in dark mode
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 11,
          },
          color: textColor,
        },
        border: {
          color: borderColor,
        },
      },
      y: {
        grid: {
          color: gridColor,
          borderDash: isDarkMode ? [5, 5] : undefined, // Dashed lines in dark mode
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          color: textColor,
          callback: function(value: any) {
            if (value >= 1000000) {
              return (value / 1000000).toFixed(1) + 'M';
            } else if (value >= 1000) {
              return (value / 1000).toFixed(1) + 'K';
            }
            return value;
          },
        },
        border: {
          color: borderColor,
        },
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart' as const,
    },
  };

  // Prepare pie/doughnut chart data (single metric, categorical dimension)
  const pieChartData = finalChartType === 'pie' || finalChartType === 'doughnut' ? {
    labels: labels,
    datasets: [{
      label: formatMetricName(metrics[0]),
      data: chartData.map(row => row[formatMetricName(metrics[0])] as number || 0),
      backgroundColor: colors.map(c => c.border),
      borderColor: isDarkMode ? '#1e293b' : '#ffffff', // Dark border in dark mode
      borderWidth: 2,
    }],
  } : null;

  // Pie/Doughnut specific options
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            weight: 500,
          },
          color: textColor,
        },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tooltipBody,
        borderColor: tooltipBorder,
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value.toLocaleString()} (${percentage}%)`;
          },
        },
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
    },
  };

  return (
    <div className="h-[400px] w-full">
      {finalChartType === 'line' ? (
        <Line data={chartDataConfig} options={chartOptions} />
      ) : finalChartType === 'bar' ? (
        <Bar data={chartDataConfig} options={chartOptions} />
      ) : finalChartType === 'pie' ? (
        <Pie data={pieChartData!} options={pieChartOptions} />
      ) : (
        <Doughnut data={pieChartData!} options={pieChartOptions} />
      )}
    </div>
  );
}
