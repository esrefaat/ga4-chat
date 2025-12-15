'use client';

import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowTrendUp, 
  faArrowTrendDown,
  faChartLine,
  faUsers,
  faUserPlus,
  faEye,
  faClock,
  faHeart,
  faArrowRight,
  faBolt,
  faChartBar,
} from '@fortawesome/free-solid-svg-icons';
import GA4Chart from './GA4Chart';
import ComprehensiveReport from './ComprehensiveReport';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';

interface BeautifulReportProps {
  mcpData: any;
  mcpParams: any;
  propertyId?: string;
  propertyName?: string;
  comprehensiveData?: any; // Comprehensive report data with multiple sections
}

// Format large numbers
function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
  if (isNaN(n)) return '0';
  
  if (n >= 1000000) {
    return (n / 1000000).toFixed(2) + 'M';
  } else if (n >= 1000) {
    return (n / 1000).toFixed(1) + 'K';
  }
  return n.toLocaleString('en-US');
}

// Format duration
function formatDuration(seconds: number | string): string {
  const sec = typeof seconds === 'string' ? parseFloat(seconds) : seconds;
  if (isNaN(sec)) return '0s';
  
  const mins = Math.floor(sec / 60);
  const secs = Math.floor(sec % 60);
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

export default function BeautifulReport({ mcpData, mcpParams, propertyId, propertyName, comprehensiveData }: BeautifulReportProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const dateRange = mcpParams?.date_ranges?.[0] || comprehensiveData?.dateRange || {};
  const metrics = mcpParams?.metrics || [];
  const dimensions = mcpParams?.dimensions || [];
  const rows = mcpData?.rows || [];
  const chartType = (mcpParams as any)?.parsed?.chartType;
  const hasDateDimension = dimensions.includes('date');
  
  // Check if this is a comprehensive report
  const isComprehensive = !!comprehensiveData;
  
  // Debug logging
  if (comprehensiveData) {
    console.log('📊 Comprehensive data received:', {
      hasOverview: !!comprehensiveData.overview,
      hasEngagement: !!comprehensiveData.engagement,
      hasChannels: !!comprehensiveData.channels,
      hasCountries: !!comprehensiveData.countries,
      overviewStructure: comprehensiveData.overview ? Object.keys(comprehensiveData.overview) : null,
    });
  }

  // If comprehensive report, use the dedicated component
  if (isComprehensive && comprehensiveData) {
    return (
      <ComprehensiveReport
        comprehensiveData={comprehensiveData}
        propertyId={propertyId || 'N/A'}
        propertyName={propertyName}
        dateRange={dateRange}
      />
    );
  }

  // Calculate totals and aggregates
  const totals = useMemo(() => {
    if (!mcpData?.totals?.[0]) {
      // Calculate from rows if totals not available
      const calculated: Record<string, number> = {};
      metrics.forEach((metric: string, idx: number) => {
        let sum = 0;
        rows.forEach((row: any) => {
          const value = row.metric_values?.[idx]?.value || '0';
          sum += parseFloat(value.toString().replace(/,/g, '')) || 0;
        });
        calculated[metric] = sum;
      });
      return calculated;
    }
    
    const totalsObj: Record<string, number> = {};
    mcpData.totals[0].metric_values?.forEach((mv: any, idx: number) => {
      const value = mv.value || '0';
      totalsObj[metrics[idx]] = parseFloat(value.toString().replace(/,/g, '')) || 0;
    });
    return totalsObj;
  }, [mcpData, metrics, rows]);

  // Format date range
  const dateRangeText = useMemo(() => {
    if (dateRange.start_date?.includes('daysAgo')) {
      const days = dateRange.start_date.replace('daysAgo', '');
      return `Last ${days} days`;
    }
    if (dateRange.start_date && dateRange.end_date) {
      const start = new Date(dateRange.start_date);
      const end = new Date(dateRange.end_date);
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return 'Date range not specified';
  }, [dateRange]);

  // Prepare chart data
  const chartData = useMemo(() => {
    return rows.map((row: any) => {
      const chartRow: Record<string, any> = {};
      
      // Add dimensions
      if (row.dimension_values && dimensions) {
        dimensions.forEach((dim: string, idx: number) => {
          chartRow[dim] = row.dimension_values[idx]?.value || '';
        });
      }
      
      // Add metrics
      if (row.metric_values && metrics) {
        metrics.forEach((metric: string, idx: number) => {
          const value = row.metric_values[idx]?.value || '0';
          chartRow[metric] = parseFloat(value.toString().replace(/,/g, '')) || 0;
        });
      }
      
      return chartRow;
    });
  }, [rows, dimensions, metrics]);

  // Get metric display names
  const getMetricDisplayName = (metric: string): string => {
    const names: Record<string, string> = {
      sessions: 'Sessions',
      activeUsers: 'Users',
      newUsers: 'New Users',
      screenPageViews: 'Page Views',
      averageSessionDuration: 'Avg Duration',
      engagementRate: 'Engagement Rate',
      bounceRate: 'Bounce Rate',
      eventCount: 'Events',
    };
    return names[metric] || metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  // Get Font Awesome icon for metric
  const getMetricIcon = (metric: string) => {
    const icons: Record<string, any> = {
      sessions: faChartLine,
      activeUsers: faUsers,
      newUsers: faUserPlus,
      screenPageViews: faEye,
      averageSessionDuration: faClock,
      engagementRate: faHeart,
      bounceRate: faArrowRight,
      eventCount: faBolt,
    };
    return icons[metric] || faChartBar;
  };

  // Get color for metric card (dark mode aware)
  const getMetricColor = (metric: string): string => {
    if (isDarkMode) {
      const colors: Record<string, string> = {
        sessions: 'text-blue-300 bg-blue-900/30',
        activeUsers: 'text-purple-300 bg-purple-900/30',
        newUsers: 'text-green-300 bg-green-900/30',
        screenPageViews: 'text-orange-300 bg-orange-900/30',
        averageSessionDuration: 'text-indigo-300 bg-indigo-900/30',
        engagementRate: 'text-pink-300 bg-pink-900/30',
        bounceRate: 'text-red-300 bg-red-900/30',
        eventCount: 'text-yellow-300 bg-yellow-900/30',
      };
      return colors[metric] || 'text-gray-300 bg-gray-800/30';
    } else {
      const colors: Record<string, string> = {
        sessions: 'text-blue-700 bg-blue-100',
        activeUsers: 'text-purple-700 bg-purple-100',
        newUsers: 'text-green-700 bg-green-100',
        screenPageViews: 'text-orange-700 bg-orange-100',
        averageSessionDuration: 'text-indigo-700 bg-indigo-100',
        engagementRate: 'text-pink-700 bg-pink-100',
        bounceRate: 'text-red-700 bg-red-100',
        eventCount: 'text-yellow-700 bg-yellow-100',
      };
      return colors[metric] || 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className={`beautiful-report w-full rounded-2xl overflow-hidden shadow-xl my-6 ${
      isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <div 
        className="gradient-header text-white py-6 px-6"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <i className="fas fa-chart-bar text-2xl" aria-hidden="true"></i>
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <i className="fas fa-analytics" aria-hidden="true"></i>
                GA4 Analytics Report
              </h1>
              <p className="text-purple-200 mt-1 text-sm flex items-center gap-2">
                <i className="fas fa-fingerprint" aria-hidden="true"></i>
                Property ID: {propertyId || 'N/A'}
                {propertyName && ` • ${propertyName}`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-semibold flex items-center justify-end gap-2">
              <i className="fas fa-calendar-alt" aria-hidden="true"></i>
              {dateRangeText}
            </p>
            <p className="text-purple-200 text-sm flex items-center justify-end gap-2 mt-1">
              <i className="fas fa-table" aria-hidden="true"></i>
              {rows.length} {rows.length === 1 ? 'row' : 'rows'}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Tiles */}
      {totals && Object.keys(totals).length > 0 && metrics.length > 0 && (
        <div className={`p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric: string, index: number) => {
              const total = totals[metric] || 0;
              const displayName = getMetricDisplayName(metric);
              const icon = getMetricIcon(metric);
              
              // Calculate trend if we have date dimension and multiple rows
              let trend: 'up' | 'down' | null = null;
              let change = '';
              
              if (hasDateDimension && rows.length >= 2) {
                const firstValue = parseFloat(rows[0]?.metric_values?.[index]?.value?.toString().replace(/,/g, '') || '0');
                const lastValue = parseFloat(rows[rows.length - 1]?.metric_values?.[index]?.value?.toString().replace(/,/g, '') || '0');
                
                if (firstValue > 0) {
                  const percentChange = ((lastValue - firstValue) / firstValue) * 100;
                  trend = percentChange >= 0 ? 'up' : 'down';
                  change = `${Math.abs(percentChange).toFixed(1)}%`;
                }
              }
              
              // Get color for icon background
              const colorMap: Record<string, string> = {
                sessions: 'blue',
                activeUsers: 'purple',
                newUsers: 'green',
                screenPageViews: 'orange',
                averageSessionDuration: 'indigo',
                engagementRate: 'pink',
                bounceRate: 'red',
                eventCount: 'yellow',
              };
              const color = colorMap[metric] || 'gray';
              
              // Format value
              const formattedValue = metric === 'averageSessionDuration' 
                ? formatDuration(total)
                : formatNumber(total);
              
              // Color styles for background and icon
              const bgColorStyle = isDarkMode
                ? (color === 'blue' ? { backgroundColor: 'rgba(30, 58, 138, 0.3)' } :
                   color === 'purple' ? { backgroundColor: 'rgba(88, 28, 135, 0.3)' } :
                   color === 'green' ? { backgroundColor: 'rgba(20, 83, 45, 0.3)' } :
                   color === 'orange' ? { backgroundColor: 'rgba(154, 52, 18, 0.3)' } :
                   color === 'indigo' ? { backgroundColor: 'rgba(55, 48, 163, 0.3)' } :
                   color === 'pink' ? { backgroundColor: 'rgba(157, 23, 77, 0.3)' } :
                   color === 'red' ? { backgroundColor: 'rgba(153, 27, 27, 0.3)' } :
                   color === 'yellow' ? { backgroundColor: 'rgba(161, 98, 7, 0.3)' } :
                   { backgroundColor: 'rgba(55, 65, 81, 0.3)' })
                : (color === 'blue' ? { backgroundColor: '#dbeafe' } :
                   color === 'purple' ? { backgroundColor: '#f3e8ff' } :
                   color === 'green' ? { backgroundColor: '#dcfce7' } :
                   color === 'orange' ? { backgroundColor: '#fed7aa' } :
                   color === 'indigo' ? { backgroundColor: '#e0e7ff' } :
                   color === 'pink' ? { backgroundColor: '#fce7f3' } :
                   color === 'red' ? { backgroundColor: '#fee2e2' } :
                   color === 'yellow' ? { backgroundColor: '#fef9c3' } :
                   { backgroundColor: '#f3f4f6' });
              
              const iconColorStyle = isDarkMode
                ? (color === 'blue' ? { color: '#93c5fd' } :
                   color === 'purple' ? { color: '#c4b5fd' } :
                   color === 'green' ? { color: '#86efac' } :
                   color === 'orange' ? { color: '#fdba74' } :
                   color === 'indigo' ? { color: '#a5b4fc' } :
                   color === 'pink' ? { color: '#f9a8d4' } :
                   color === 'red' ? { color: '#fca5a5' } :
                   color === 'yellow' ? { color: '#fde047' } :
                   { color: '#d1d5db' })
                : (color === 'blue' ? { color: '#2563eb' } :
                   color === 'purple' ? { color: '#9333ea' } :
                   color === 'green' ? { color: '#16a34a' } :
                   color === 'orange' ? { color: '#ea580c' } :
                   color === 'indigo' ? { color: '#4f46e5' } :
                   color === 'pink' ? { color: '#db2777' } :
                   color === 'red' ? { color: '#dc2626' } :
                   color === 'yellow' ? { color: '#ca8a04' } :
                   { color: '#6b7280' });
              
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {displayName}
                      </p>
                      <p className="text-2xl text-gray-900 dark:text-gray-100 mb-1">
                        {formattedValue}
                      </p>
                      {trend && change && (
                        <div className={`flex items-center gap-1 text-sm ${
                          trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          <FontAwesomeIcon 
                            icon={trend === 'up' ? faArrowTrendUp : faArrowTrendDown} 
                            className="w-3 h-3" 
                          />
                          <span>{change}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 rounded-lg" style={bgColorStyle}>
                      <FontAwesomeIcon 
                        icon={icon} 
                        className="w-5 h-5"
                        style={iconColorStyle}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Comprehensive Report Sections */}
      {isComprehensive && comprehensiveData && (
        <>
          {/* Overview Metrics */}
          {comprehensiveData.overview && comprehensiveData.overview.totals?.[0]?.metric_values && (
            <section className={`p-6 ${isDarkMode ? 'bg-gray-800/50' : 'bg-white'} border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <CardHeader className="p-0 mb-4">
                <CardTitle className={`text-lg font-semibold flex items-center gap-2 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  <i className="fas fa-chart-pie" aria-hidden="true"></i>
                  Overview
                </CardTitle>
              </CardHeader>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {comprehensiveData.overview.totals?.[0]?.metric_values?.map((mv: any, idx: number) => {
                  const metricNames = ['sessions', 'activeUsers', 'newUsers', 'screenPageViews', 'averageSessionDuration'];
                  const metric = metricNames[idx] || `metric_${idx}`;
                  const total = parseFloat(mv.value?.toString().replace(/,/g, '') || '0');
                  const displayName = getMetricDisplayName(metric);
                  const iconClass = getMetricIcon(metric);
                  const colorClass = getMetricColor(metric);
                  
                  return (
                    <Card
                      key={metric}
                      className={`hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass} shadow-md`}>
                            <i className={`fas ${iconClass} text-lg`} aria-hidden="true"></i>
                          </div>
                        </div>
                        <div>
                          <p className={`text-xs uppercase tracking-wide font-medium mb-2 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {displayName}
                          </p>
                          <p className={`text-2xl font-bold mb-1 ${
                            isDarkMode ? 'text-gray-100' : 'text-gray-900'
                          }`}>
                            {metric === 'averageSessionDuration' 
                              ? formatDuration(total)
                              : formatNumber(total)
                            }
                          </p>
                          <p className={`text-xs ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            {total.toLocaleString('en-US')}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {/* Engagement Metrics */}
          {comprehensiveData.engagement && (
            <section className={`p-6 border-t ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
              <CardHeader className="p-0 mb-4">
                <CardTitle className={`text-lg font-semibold flex items-center gap-2 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  <i className="fas fa-heart" aria-hidden="true"></i>
                  Engagement Metrics
                </CardTitle>
              </CardHeader>
              <div className="grid md:grid-cols-2 gap-6">
                {comprehensiveData.engagement.totals?.[0]?.metric_values && (
                  <>
                    {/* Engagement Rate Donut Chart */}
                    <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : 'border-gray-200'}>
                      <CardContent className="p-6">
                        <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                          Engagement Rate
                        </h3>
                        <div className="flex items-center justify-center">
                          <div className="relative w-40 h-40">
                            <GA4Chart
                              data={[{
                                engagementRate: parseFloat(comprehensiveData.engagement.totals[0].metric_values[0]?.value || '0'),
                                bounceRate: parseFloat(comprehensiveData.engagement.totals[0].metric_values[1]?.value || '0'),
                              }]}
                              metrics={['engagementRate', 'bounceRate']}
                              dimensions={[]}
                              chartType="doughnut"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className={`text-3xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                                {parseFloat(comprehensiveData.engagement.totals[0].metric_values[0]?.value || '0').toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                          <div>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Engaged Sessions</p>
                            <p className={`text-lg font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                              {formatNumber(parseFloat(comprehensiveData.engagement.totals[0].metric_values[2]?.value || '0'))}
                            </p>
                          </div>
                          <div>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Bounce Rate</p>
                            <p className={`text-lg font-semibold ${isDarkMode ? 'text-red-400' : 'text-red-500'}`}>
                              {parseFloat(comprehensiveData.engagement.totals[0].metric_values[1]?.value || '0').toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Device Distribution */}
                    {comprehensiveData.devices && (
                      <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : 'border-gray-200'}>
                        <CardContent className="p-6">
                          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                            Device Distribution
                          </h3>
                          <GA4Chart
                            data={comprehensiveData.devices.rows?.map((row: any) => ({
                              deviceCategory: row.dimension_values?.[0]?.value || '',
                              sessions: parseFloat(row.metric_values?.[0]?.value || '0'),
                            })) || []}
                            metrics={['sessions']}
                            dimensions={['deviceCategory']}
                            chartType="doughnut"
                          />
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            </section>
          )}

          {/* Traffic by Channel */}
          {comprehensiveData.channels && comprehensiveData.channels.rows && (
            <section className={`p-6 border-t ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
              <CardHeader className="p-0 mb-4">
                <CardTitle className={`text-lg font-semibold flex items-center gap-2 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  <i className="fas fa-share-alt" aria-hidden="true"></i>
                  Traffic by Channel
                </CardTitle>
              </CardHeader>
              <div className="grid lg:grid-cols-2 gap-8">
                <div>
                  <GA4Chart
                    data={comprehensiveData.channels.rows.map((row: any) => ({
                      sessionDefaultChannelGroup: row.dimension_values?.[0]?.value || '',
                      sessions: parseFloat(row.metric_values?.[0]?.value || '0'),
                    }))}
                    metrics={['sessions']}
                    dimensions={['sessionDefaultChannelGroup']}
                    chartType="bar"
                  />
                </div>
                <div className="space-y-4">
                  {comprehensiveData.channels.rows.map((row: any, idx: number) => {
                    const channel = row.dimension_values?.[0]?.value || '';
                    const sessions = parseFloat(row.metric_values?.[0]?.value || '0');
                    const totalSessions = comprehensiveData.channels.rows.reduce((sum: number, r: any) => 
                      sum + parseFloat(r.metric_values?.[0]?.value || '0'), 0
                    );
                    const percentage = totalSessions > 0 ? (sessions / totalSessions) * 100 : 0;
                    const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-pink-500', 'bg-gray-400'];
                    
                    return (
                      <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${
                        isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${colors[idx % colors.length]}`}></div>
                          <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{channel}</span>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                            {formatNumber(sessions)}
                          </p>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Top Countries */}
          {comprehensiveData.countries && comprehensiveData.countries.rows && (
            <section className={`p-6 border-t ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
              <CardHeader className="p-0 mb-4">
                <CardTitle className={`text-lg font-semibold flex items-center gap-2 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  <i className="fas fa-globe" aria-hidden="true"></i>
                  Top Countries
                </CardTitle>
              </CardHeader>
              <div className={`border rounded-xl overflow-hidden ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50'}>
                      <tr>
                        <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>Country</th>
                        <th className={`px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>Sessions</th>
                        <th className={`px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>Users</th>
                        <th className={`px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>Share</th>
                        <th className={`px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider w-32 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}></th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      {comprehensiveData.countries.rows.map((row: any, idx: number) => {
                        const country = row.dimension_values?.[0]?.value || '';
                        const sessions = parseFloat(row.metric_values?.[0]?.value || '0');
                        const users = parseFloat(row.metric_values?.[1]?.value || '0');
                        const totalSessions = comprehensiveData.countries.rows.reduce((sum: number, r: any) => 
                          sum + parseFloat(r.metric_values?.[0]?.value || '0'), 0
                        );
                        const percentage = totalSessions > 0 ? (sessions / totalSessions) * 100 : 0;
                        
                        return (
                          <tr key={idx} className={`transition-colors ${
                            isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                          }`}>
                            <td className={`px-4 py-3 text-sm font-medium ${
                              isDarkMode ? 'text-gray-200' : 'text-gray-900'
                            }`}>{country}</td>
                            <td className={`px-4 py-3 text-sm text-right font-mono ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>{formatNumber(sessions)}</td>
                            <td className={`px-4 py-3 text-sm text-right font-mono ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>{formatNumber(users)}</td>
                            <td className={`px-4 py-3 text-sm text-right font-semibold ${
                              isDarkMode ? 'text-purple-400' : 'text-purple-600'
                            }`}>{percentage.toFixed(1)}%</td>
                            <td className="px-4 py-3">
                              <div className={`flex-1 rounded-full h-2 overflow-hidden ${
                                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                              }`}>
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${percentage}%`,
                                    backgroundColor: '#8b5cf6',
                                  }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* Browser Usage */}
          {comprehensiveData.browsers && comprehensiveData.browsers.rows && (
            <section className={`p-6 border-t ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
              <CardHeader className="p-0 mb-4">
                <CardTitle className={`text-lg font-semibold flex items-center gap-2 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  <i className="fas fa-window-maximize" aria-hidden="true"></i>
                  Browser Usage
                </CardTitle>
              </CardHeader>
              <div className="space-y-3">
                {comprehensiveData.browsers.rows.map((row: any, idx: number) => {
                  const browser = row.dimension_values?.[0]?.value || '';
                  const sessions = parseFloat(row.metric_values?.[0]?.value || '0');
                  const totalSessions = comprehensiveData.browsers.rows.reduce((sum: number, r: any) => 
                    sum + parseFloat(r.metric_values?.[0]?.value || '0'), 0
                  );
                  const percentage = totalSessions > 0 ? (sessions / totalSessions) * 100 : 0;
                  const colors = ['bg-blue-500', 'bg-gray-500', 'bg-green-500', 'bg-purple-500', 'bg-indigo-500'];
                  
                  return (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{browser}</span>
                        <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className={`progress-bar rounded-full h-2 overflow-hidden ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <div
                          className={`progress-fill h-full rounded-full transition-all ${colors[idx % colors.length]}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Daily Trend */}
          {comprehensiveData.dailyTrend && comprehensiveData.dailyTrend.rows && (
            <section className={`p-6 border-t ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
              <CardHeader className="p-0 mb-4">
                <CardTitle className={`text-lg font-semibold flex items-center gap-2 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  <i className="fas fa-chart-line" aria-hidden="true"></i>
                  Daily Sessions Trend
                </CardTitle>
              </CardHeader>
              <div className={`p-6 rounded-xl border ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
                  : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
              }`}>
                <GA4Chart
                  data={comprehensiveData.dailyTrend.rows.map((row: any) => ({
                    date: row.dimension_values?.[0]?.value || '',
                    sessions: parseFloat(row.metric_values?.[0]?.value || '0'),
                  }))}
                  metrics={['sessions']}
                  dimensions={['date']}
                  chartType="line"
                />
              </div>
            </section>
          )}
        </>
      )}
      
      {/* Error message if comprehensive report requested but no data */}
      {isComprehensive && !comprehensiveData && (
        <section className={`p-6 ${isDarkMode ? 'bg-gray-800/50' : 'bg-white'} border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <i className="fas fa-exclamation-triangle text-3xl mb-4" aria-hidden="true"></i>
            <p className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>Comprehensive Report Data Not Available</p>
            <p className="text-sm">The comprehensive report was requested but data could not be loaded. Please check the server logs for details.</p>
          </div>
        </section>
      )}

      {/* Regular Report Sections (only if not comprehensive) */}
      {!isComprehensive && (
        <>
          {/* Key Metrics Grid */}
          {metrics.length > 0 && (
            <section className={`p-6 ${isDarkMode ? 'bg-gray-800/50' : 'bg-white'} border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <CardHeader className="p-0 mb-4">
                <CardTitle className={`text-lg font-semibold flex items-center gap-2 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  <i className="fas fa-chart-pie" aria-hidden="true"></i>
                  Overview
                </CardTitle>
              </CardHeader>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {metrics.slice(0, 5).map((metric: string) => {
              const total = totals[metric] || 0;
              const displayName = getMetricDisplayName(metric);
              const iconClass = getMetricIcon(metric);
              const colorClass = getMetricColor(metric);
              
              return (
                <Card
                  key={metric}
                  className={`hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass} shadow-md`}>
                        <i className={`fas ${iconClass} text-lg`} aria-hidden="true"></i>
                      </div>
                    </div>
                    <div>
                      <p className={`text-xs uppercase tracking-wide font-medium mb-2 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {displayName}
                      </p>
                      <p className={`text-2xl font-bold mb-1 ${
                        isDarkMode ? 'text-gray-100' : 'text-gray-900'
                      }`}>
                        {metric === 'averageSessionDuration' 
                          ? formatDuration(total)
                          : formatNumber(total)
                        }
                      </p>
                      <p className={`text-xs ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        {total.toLocaleString('en-US')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Chart Section */}
      {chartData.length > 0 && metrics.length > 0 && (
        <section className={`p-6 border-t ${
          isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <CardHeader className="p-0 mb-4">
            <CardTitle className={`text-lg font-semibold flex items-center gap-2 ${
              isDarkMode ? 'text-gray-100' : 'text-gray-800'
            }`}>
              <i className="fas fa-chart-line" aria-hidden="true"></i>
              {dimensions.length > 0 && dimensions[0] !== 'date' 
                ? `Trend by ${dimensions[0].replace(/([A-Z])/g, ' $1').trim()}`
                : 'Data Visualization'
              }
            </CardTitle>
          </CardHeader>
          <div className={`p-6 rounded-xl border ${
            isDarkMode 
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
              : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
          }`}>
            <GA4Chart
              data={chartData}
              metrics={metrics}
              dimensions={dimensions.length > 0 ? dimensions : ['date']}
              chartType={chartType}
            />
          </div>
        </section>
      )}

      {/* Top Items by Dimension */}
      {dimensions.length > 0 && dimensions[0] !== 'date' && rows.length > 0 && (
        <section className={`p-6 border-t ${
          isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <CardHeader className="p-0 mb-4">
            <CardTitle className={`text-lg font-semibold flex items-center gap-2 ${
              isDarkMode ? 'text-gray-100' : 'text-gray-800'
            }`}>
              <i className="fas fa-list-ol" aria-hidden="true"></i>
              Top {dimensions[0].replace(/([A-Z])/g, ' $1').trim()}s
            </CardTitle>
          </CardHeader>
          <div className={`border rounded-xl overflow-hidden ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <i className="fas fa-tag" aria-hidden="true"></i>
                      {dimensions[0].replace(/([A-Z])/g, ' $1').trim()}
                    </th>
                    {metrics.map((metric: string) => (
                      <th
                        key={metric}
                        className={`px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}
                      >
                        {getMetricDisplayName(metric)}
                      </th>
                    ))}
                    {metrics.length > 0 && (
                      <th className={`px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider w-32 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        <i className="fas fa-percentage" aria-hidden="true"></i> Share
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
                }`}>
                  {rows.slice(0, 10).map((row: any, idx: number) => {
                    const dimValue = row.dimension_values?.[0]?.value || '';
                    const firstMetricValue = row.metric_values?.[0]?.value || '0';
                    const firstMetricNum = parseFloat(firstMetricValue.toString().replace(/,/g, '')) || 0;
                    const totalFirstMetric = totals[metrics[0]] || 1;
                    const percentage = totalFirstMetric > 0 ? (firstMetricNum / totalFirstMetric) * 100 : 0;
                    
                    return (
                      <tr key={idx} className={`transition-colors ${
                        isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                      }`}>
                        <td className={`px-4 py-3 text-sm font-medium ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {dimValue}
                        </td>
                        {metrics.map((metric: string, metricIdx: number) => {
                          const metricValue = row.metric_values?.[metricIdx]?.value || '0';
                          const metricNum = parseFloat(metricValue.toString().replace(/,/g, '')) || 0;
                          return (
                            <td key={metric} className={`px-4 py-3 text-sm text-right font-mono ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              {formatNumber(metricNum)}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`flex-1 rounded-full h-2 overflow-hidden ${
                              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}>
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: '#8b5cf6',
                                }}
                              />
                            </div>
                            <span className={`text-xs font-medium w-12 text-right ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}


      {/* Summary Stats */}
      {totals && Object.keys(totals).length > 0 && (
        <section className={`p-6 border-t ${
          isDarkMode ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <CardHeader className="p-0 mb-4">
            <CardTitle className={`text-lg font-semibold flex items-center gap-2 ${
              isDarkMode ? 'text-gray-100' : 'text-gray-800'
            }`}>
              <i className="fas fa-chart-bar" aria-hidden="true"></i>
              Summary Statistics
            </CardTitle>
          </CardHeader>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(totals).map(([metric, value]) => {
              const displayName = getMetricDisplayName(metric);
              const iconClass = getMetricIcon(metric);
              const colorClass = getMetricColor(metric);
              
              return (
                <Card
                  key={metric}
                  className={`hover:shadow-md transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass} shadow-md`}>
                        <i className={`fas ${iconClass} text-lg`} aria-hidden="true"></i>
                      </div>
                      <p className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {displayName}
                      </p>
                    </div>
                    <p className={`text-2xl font-bold mb-1 ${
                      isDarkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {metric === 'averageSessionDuration'
                        ? formatDuration(value)
                        : formatNumber(value)
                      }
                    </p>
                    <p className={`text-xs ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                      {value.toLocaleString('en-US')}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}
        </>
      )}
    </div>
  );
}

