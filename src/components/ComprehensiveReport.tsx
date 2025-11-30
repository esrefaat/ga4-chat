'use client';

import React, { useMemo } from 'react';
import GA4Chart from './GA4Chart';
import { useTheme } from '@/contexts/ThemeContext';

interface ComprehensiveReportProps {
  comprehensiveData: any;
  propertyId: string;
  propertyName?: string;
  dateRange: { start_date: string; end_date: string; name: string };
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

// Format date range text
function formatDateRange(dateRange: { start_date: string; end_date: string; name: string }): string {
  if (dateRange.start_date?.includes('daysAgo')) {
    const days = dateRange.start_date.replace('daysAgo', '');
    return `Last ${days} days`;
  }
  if (dateRange.start_date && dateRange.end_date) {
    try {
      const start = new Date(dateRange.start_date);
      const end = new Date(dateRange.end_date);
      const monthName = start.toLocaleDateString('en-US', { month: 'long' });
      const year = start.getFullYear();
      return `${monthName} ${year}`;
    } catch {
      return dateRange.name || 'Date range';
    }
  }
  return dateRange.name || 'Date range';
}

// Format date range subtitle
function formatDateRangeSubtitle(dateRange: { start_date: string; end_date: string; name: string }): string {
  if (dateRange.start_date && dateRange.end_date && !dateRange.start_date.includes('daysAgo')) {
    try {
      const start = new Date(dateRange.start_date);
      const end = new Date(dateRange.end_date);
      const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${startStr} - ${endStr}`;
    } catch {
      return '';
    }
  }
  return '';
}

export default function ComprehensiveReport({ 
  comprehensiveData, 
  propertyId, 
  propertyName,
  dateRange 
}: ComprehensiveReportProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  // Extract overview metrics
  const overviewMetrics = useMemo(() => {
    if (!comprehensiveData?.overview?.totals?.[0]?.metric_values) return null;
    
    const metrics = comprehensiveData.overview.totals[0].metric_values;
    return {
      sessions: parseFloat(metrics[0]?.value || '0'),
      activeUsers: parseFloat(metrics[1]?.value || '0'),
      newUsers: parseFloat(metrics[2]?.value || '0'),
      screenPageViews: parseFloat(metrics[3]?.value || '0'),
      averageSessionDuration: parseFloat(metrics[4]?.value || '0'),
    };
  }, [comprehensiveData]);

  // Extract engagement metrics
  const engagementMetrics = useMemo(() => {
    if (!comprehensiveData?.engagement?.totals?.[0]?.metric_values) return null;
    
    const metrics = comprehensiveData.engagement.totals[0].metric_values;
    return {
      engagementRate: parseFloat(metrics[0]?.value || '0'),
      bounceRate: parseFloat(metrics[1]?.value || '0'),
      engagedSessions: parseFloat(metrics[2]?.value || '0'),
    };
  }, [comprehensiveData]);

  // Extract channel data
  const channelData = useMemo(() => {
    if (!comprehensiveData?.channels?.rows) return [];
    
    const totalSessions = comprehensiveData.channels.rows.reduce((sum: number, row: any) => 
      sum + parseFloat(row.metric_values?.[0]?.value || '0'), 0
    );
    
    return comprehensiveData.channels.rows.map((row: any) => {
      const channel = row.dimension_values?.[0]?.value || '';
      const sessions = parseFloat(row.metric_values?.[0]?.value || '0');
      const users = parseFloat(row.metric_values?.[1]?.value || '0');
      const percentage = totalSessions > 0 ? (sessions / totalSessions) * 100 : 0;
      
      return { channel, sessions, users, percentage };
    });
  }, [comprehensiveData]);

  // Extract country data
  const countryData = useMemo(() => {
    if (!comprehensiveData?.countries?.rows) return [];
    
    const totalSessions = comprehensiveData.countries.rows.reduce((sum: number, row: any) => 
      sum + parseFloat(row.metric_values?.[0]?.value || '0'), 0
    );
    
    return comprehensiveData.countries.rows.map((row: any) => {
      const country = row.dimension_values?.[0]?.value || '';
      const sessions = parseFloat(row.metric_values?.[0]?.value || '0');
      const users = parseFloat(row.metric_values?.[1]?.value || '0');
      const engagementRate = parseFloat(row.metric_values?.[2]?.value || '0');
      const share = totalSessions > 0 ? (sessions / totalSessions) * 100 : 0;
      
      return { country, sessions, users, engagementRate, share };
    });
  }, [comprehensiveData]);

  // Extract browser data
  const browserData = useMemo(() => {
    if (!comprehensiveData?.browsers?.rows) return [];
    
    const totalSessions = comprehensiveData.browsers.rows.reduce((sum: number, row: any) => 
      sum + parseFloat(row.metric_values?.[0]?.value || '0'), 0
    );
    
    return comprehensiveData.browsers.rows.map((row: any) => {
      const browser = row.dimension_values?.[0]?.value || '';
      const sessions = parseFloat(row.metric_values?.[0]?.value || '0');
      const percentage = totalSessions > 0 ? (sessions / totalSessions) * 100 : 0;
      
      return { browser, sessions, percentage };
    });
  }, [comprehensiveData]);

  // Extract device data
  const deviceData = useMemo(() => {
    if (!comprehensiveData?.devices?.rows) return [];
    
    const totalSessions = comprehensiveData.devices.rows.reduce((sum: number, row: any) => 
      sum + parseFloat(row.metric_values?.[0]?.value || '0'), 0
    );
    
    return comprehensiveData.devices.rows.map((row: any) => {
      const device = row.dimension_values?.[0]?.value || '';
      const sessions = parseFloat(row.metric_values?.[0]?.value || '0');
      const avgDuration = parseFloat(row.metric_values?.[1]?.value || '0');
      const percentage = totalSessions > 0 ? (sessions / totalSessions) * 100 : 0;
      
      return { device, sessions, avgDuration, percentage };
    });
  }, [comprehensiveData]);

  // Extract daily trend data
  const dailyTrendData = useMemo(() => {
    if (!comprehensiveData?.dailyTrend?.rows) return [];
    
    return comprehensiveData.dailyTrend.rows.map((row: any) => ({
      date: row.dimension_values?.[0]?.value || '',
      sessions: parseFloat(row.metric_values?.[0]?.value || '0'),
    }));
  }, [comprehensiveData]);

  // Channel colors
  const channelColors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-pink-500', 'bg-gray-400'];
  
  // Browser colors
  const browserColors = ['bg-blue-500', 'bg-gray-500', 'bg-green-500', 'bg-purple-500', 'bg-indigo-500'];

  // Device emojis and colors
  const deviceConfig: Record<string, { emoji: string; bgColor: string; textColor: string }> = {
    mobile: { emoji: '📱', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
    desktop: { emoji: '🖥️', bgColor: 'bg-green-50', textColor: 'text-green-600' },
    tablet: { emoji: '📟', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
  };

  const dateRangeTitle = formatDateRange(dateRange);
  const dateRangeSubtitle = formatDateRangeSubtitle(dateRange);

  return (
    <div className={`comprehensive-report w-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen`}>
      {/* Header */}
      <header 
        className="gradient-header text-white py-8 px-6"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <i className="fas fa-chart-bar" aria-hidden="true"></i>
                Traffic Analytics Report
              </h1>
              <p className="text-purple-200 mt-1 flex items-center gap-2 mt-1">
                <i className="fas fa-fingerprint" aria-hidden="true"></i>
                Property ID: {propertyId}
                {propertyName && ` • ${propertyName}`}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={() => window.print()}
                className="print-btn flex items-center gap-2 bg-white text-purple-700 px-5 py-2.5 rounded-lg font-semibold hover:bg-purple-50 transition-colors shadow-lg"
              >
                <i className="fas fa-print" aria-hidden="true"></i>
                Print Report
              </button>
              <div className="text-right">
                <p className="text-2xl font-semibold">{dateRangeTitle}</p>
                {dateRangeSubtitle && (
                  <p className="text-purple-200">{dateRangeSubtitle}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Metrics Grid */}
        {overviewMetrics && (
          <section className={`mb-10 ${isDarkMode ? '' : ''}`}>
            <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${
              isDarkMode ? 'text-gray-100' : 'text-gray-800'
            }`}>
              <i className="fas fa-chart-pie" aria-hidden="true"></i>
              Overview
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className={`card stat-card p-5 transition-all duration-200 hover:-translate-y-0.5 ${
                isDarkMode 
                  ? 'bg-gray-800 border border-gray-700 hover:shadow-lg' 
                  : 'bg-white shadow-md hover:shadow-xl'
              } rounded-xl`}>
                <p className={`text-sm uppercase tracking-wide ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Sessions</p>
                <p className={`text-2xl font-bold mt-1 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>{formatNumber(overviewMetrics.sessions)}</p>
                <p className={`text-xs mt-1 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>{overviewMetrics.sessions.toLocaleString('en-US')}</p>
              </div>
              
              <div className={`card stat-card p-5 transition-all duration-200 hover:-translate-y-0.5 ${
                isDarkMode 
                  ? 'bg-gray-800 border border-gray-700 hover:shadow-lg' 
                  : 'bg-white shadow-md hover:shadow-xl'
              } rounded-xl`}>
                <p className={`text-sm uppercase tracking-wide ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Users</p>
                <p className={`text-2xl font-bold mt-1 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>{formatNumber(overviewMetrics.activeUsers)}</p>
                <p className={`text-xs mt-1 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>{overviewMetrics.activeUsers.toLocaleString('en-US')}</p>
              </div>
              
              <div className={`card stat-card p-5 transition-all duration-200 hover:-translate-y-0.5 ${
                isDarkMode 
                  ? 'bg-gray-800 border border-gray-700 hover:shadow-lg' 
                  : 'bg-white shadow-md hover:shadow-xl'
              } rounded-xl`}>
                <p className={`text-sm uppercase tracking-wide ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>New Users</p>
                <p className={`text-2xl font-bold mt-1 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>{formatNumber(overviewMetrics.newUsers)}</p>
                <p className={`text-xs mt-1 ${
                  isDarkMode ? 'text-green-400' : 'text-green-500'
                }`}>
                  {overviewMetrics.activeUsers > 0 
                    ? `${((overviewMetrics.newUsers / overviewMetrics.activeUsers) * 100).toFixed(0)}% of total`
                    : '0% of total'
                  }
                </p>
              </div>
              
              <div className={`card stat-card p-5 transition-all duration-200 hover:-translate-y-0.5 ${
                isDarkMode 
                  ? 'bg-gray-800 border border-gray-700 hover:shadow-lg' 
                  : 'bg-white shadow-md hover:shadow-xl'
              } rounded-xl`}>
                <p className={`text-sm uppercase tracking-wide ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Page Views</p>
                <p className={`text-2xl font-bold mt-1 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>{formatNumber(overviewMetrics.screenPageViews)}</p>
                <p className={`text-xs mt-1 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>{overviewMetrics.screenPageViews.toLocaleString('en-US')}</p>
              </div>
              
              <div className={`card stat-card p-5 transition-all duration-200 hover:-translate-y-0.5 ${
                isDarkMode 
                  ? 'bg-gray-800 border border-gray-700 hover:shadow-lg' 
                  : 'bg-white shadow-md hover:shadow-xl'
              } rounded-xl`}>
                <p className={`text-sm uppercase tracking-wide ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Avg Duration</p>
                <p className={`text-2xl font-bold mt-1 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>{formatDuration(overviewMetrics.averageSessionDuration)}</p>
                <p className={`text-xs mt-1 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>{overviewMetrics.averageSessionDuration.toFixed(1)} seconds</p>
              </div>
            </div>
          </section>
        )}

        {/* Engagement Metrics */}
        {(engagementMetrics || deviceData.length > 0) && (
          <section className="mb-10">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Engagement Rate */}
              {engagementMetrics && (
                <div className={`card p-6 rounded-xl ${
                  isDarkMode 
                    ? 'bg-gray-800 border border-gray-700 shadow-lg' 
                    : 'bg-white shadow-md'
                }`}>
                  <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                    isDarkMode ? 'text-gray-100' : 'text-gray-800'
                  }`}>
                    <i className="fas fa-heart" aria-hidden="true"></i>
                    Engagement Rate
                  </h3>
                  <div className="flex items-center justify-center">
                    <div className="relative w-40 h-40">
                      <GA4Chart
                        data={[{
                          engagementRate: engagementMetrics.engagementRate,
                          bounceRate: engagementMetrics.bounceRate,
                        }]}
                        metrics={['engagementRate', 'bounceRate']}
                        dimensions={[]}
                        chartType="doughnut"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-3xl font-bold ${
                          isDarkMode ? 'text-gray-100' : 'text-gray-800'
                        }`}>
                          {engagementMetrics.engagementRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>Engaged Sessions</p>
                      <p className={`text-lg font-semibold ${
                        isDarkMode ? 'text-green-400' : 'text-green-600'
                      }`}>
                        {formatNumber(engagementMetrics.engagedSessions)}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>Bounce Rate</p>
                      <p className={`text-lg font-semibold ${
                        isDarkMode ? 'text-red-400' : 'text-red-500'
                      }`}>
                        {engagementMetrics.bounceRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Device Distribution */}
              {deviceData.length > 0 && (
                <div className={`card p-6 rounded-xl ${
                  isDarkMode 
                    ? 'bg-gray-800 border border-gray-700 shadow-lg' 
                    : 'bg-white shadow-md'
                }`}>
                  <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                    isDarkMode ? 'text-gray-100' : 'text-gray-800'
                  }`}>
                    <i className="fas fa-mobile-alt" aria-hidden="true"></i>
                    Device Distribution
                  </h3>
                  <GA4Chart
                    data={deviceData.map((d: { device: string; sessions: number; percentage: number; avgDuration: number }) => ({
                      deviceCategory: d.device,
                      sessions: d.sessions,
                    }))}
                    metrics={['sessions']}
                    dimensions={['deviceCategory']}
                    chartType="doughnut"
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* Traffic by Channel */}
        {channelData.length > 0 && (
          <section className="mb-10">
            <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${
              isDarkMode ? 'text-gray-100' : 'text-gray-800'
            }`}>
              <i className="fas fa-share-alt" aria-hidden="true"></i>
              Traffic by Channel
            </h2>
            <div className={`card p-6 rounded-xl ${
              isDarkMode 
                ? 'bg-gray-800 border border-gray-700 shadow-lg' 
                : 'bg-white shadow-md'
            }`}>
              <div className="grid lg:grid-cols-2 gap-8">
                <div>
                  <GA4Chart
                    data={channelData.map((d: { channel: string; sessions: number; users: number; percentage: number }) => ({
                      sessionDefaultChannelGroup: d.channel,
                      sessions: d.sessions,
                    }))}
                    metrics={['sessions']}
                    dimensions={['sessionDefaultChannelGroup']}
                    chartType="bar"
                  />
                </div>
                <div className="space-y-4">
                  {channelData.map((item: { channel: string; sessions: number; users: number; percentage: number }, idx: number) => (
                    <div 
                      key={idx}
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700/50 hover:bg-gray-700' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${channelColors[idx % channelColors.length]}`}></div>
                        <span className={`font-medium ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-900'
                        }`}>{item.channel}</span>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          isDarkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}>
                          {formatNumber(item.sessions)}
                        </p>
                        <p className={`text-xs ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {item.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Top Countries */}
        {countryData.length > 0 && (
          <section className="mb-10">
            <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${
              isDarkMode ? 'text-gray-100' : 'text-gray-800'
            }`}>
              <i className="fas fa-globe" aria-hidden="true"></i>
              Top Countries
            </h2>
            <div className={`card p-6 rounded-xl overflow-hidden ${
              isDarkMode 
                ? 'bg-gray-800 border border-gray-700 shadow-lg' 
                : 'bg-white shadow-md'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`text-left text-sm border-b ${
                      isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'
                    }`}>
                      <th className="pb-3 font-medium">Country</th>
                      <th className="pb-3 font-medium text-right">Sessions</th>
                      <th className="pb-3 font-medium text-right">Users</th>
                      <th className="pb-3 font-medium text-right">Share</th>
                      <th className="pb-3 font-medium text-right">Engagement</th>
                      <th className="pb-3 font-medium w-32"></th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {countryData.map((item: { country: string; sessions: number; users: number; engagementRate: number; share: number }, idx: number) => {
                      const maxShare = countryData[0]?.share || 100;
                      const progressWidth = maxShare > 0 ? (item.share / maxShare) * 100 : 0;
                      
                      return (
                        <tr 
                          key={idx}
                          className={`border-b transition-colors ${
                            isDarkMode 
                              ? 'border-gray-700 hover:bg-gray-700/50' 
                              : 'border-gray-100 hover:bg-gray-50'
                          }`}
                        >
                          <td className={`py-4 font-medium ${
                            isDarkMode ? 'text-gray-200' : 'text-gray-900'
                          }`}>
                            {item.country}
                          </td>
                          <td className={`py-4 text-right ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {formatNumber(item.sessions)}
                          </td>
                          <td className={`py-4 text-right ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {formatNumber(item.users)}
                          </td>
                          <td className={`py-4 text-right font-semibold ${
                            isDarkMode ? 'text-purple-400' : 'text-purple-600'
                          }`}>
                            {item.share.toFixed(1)}%
                          </td>
                          <td className={`py-4 text-right ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {item.engagementRate.toFixed(1)}%
                          </td>
                          <td className="py-4">
                            <div className={`progress-bar h-2 rounded-full overflow-hidden ${
                              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}>
                              <div
                                className="progress-fill h-full rounded-full transition-all bg-purple-500"
                                style={{ width: `${progressWidth}%` }}
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

        {/* Browser & Device Details */}
        {(browserData.length > 0 || deviceData.length > 0) && (
          <section className="mb-10">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Browser Usage */}
              {browserData.length > 0 && (
                <div className={`card p-6 rounded-xl ${
                  isDarkMode 
                    ? 'bg-gray-800 border border-gray-700 shadow-lg' 
                    : 'bg-white shadow-md'
                }`}>
                  <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                    isDarkMode ? 'text-gray-100' : 'text-gray-800'
                  }`}>
                    <i className="fas fa-window-maximize" aria-hidden="true"></i>
                    Browser Usage
                  </h3>
                  <div className="space-y-3">
                    {browserData.map((item: { browser: string; sessions: number; percentage: number }, idx: number) => (
                      <div key={idx}>
                        <div className={`flex justify-between text-sm mb-1 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          <span>{item.browser}</span>
                          <span className={`font-medium ${
                            isDarkMode ? 'text-gray-200' : 'text-gray-900'
                          }`}>
                            {item.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className={`progress-bar h-2 rounded-full overflow-hidden ${
                          isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>
                          <div
                            className={`progress-fill h-full rounded-full transition-all ${
                              browserColors[idx % browserColors.length]
                            }`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Device Performance */}
              {deviceData.length > 0 && (
                <div className={`card p-6 rounded-xl ${
                  isDarkMode 
                    ? 'bg-gray-800 border border-gray-700 shadow-lg' 
                    : 'bg-white shadow-md'
                }`}>
                  <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                    isDarkMode ? 'text-gray-100' : 'text-gray-800'
                  }`}>
                    <i className="fas fa-desktop" aria-hidden="true"></i>
                    Device Performance
                  </h3>
                  <div className="space-y-4">
                    {deviceData.map((item: { device: string; sessions: number; avgDuration: number; percentage: number }, idx: number) => {
                      const deviceLower = item.device.toLowerCase();
                      const config = deviceConfig[deviceLower] || { 
                        emoji: '📱', 
                        bgColor: isDarkMode ? 'bg-gray-700' : 'bg-gray-50',
                        textColor: isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      };
                      
                      return (
                        <div 
                          key={idx}
                          className={`p-4 rounded-lg ${
                            isDarkMode 
                              ? config.bgColor.replace('50', '700/30') 
                              : config.bgColor
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{config.emoji}</span>
                              <div>
                                <p className={`font-semibold ${
                                  isDarkMode ? 'text-gray-200' : 'text-gray-900'
                                }`}>
                                  {item.device.charAt(0).toUpperCase() + item.device.slice(1)}
                                </p>
                                <p className={`text-sm ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  {formatNumber(item.sessions)} sessions
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-2xl font-bold ${config.textColor}`}>
                                {item.percentage.toFixed(1)}%
                              </p>
                              <p className={`text-sm ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                {formatDuration(item.avgDuration)} avg
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Key Insights */}
        {overviewMetrics && channelData.length > 0 && countryData.length > 0 && (
          <section className="mb-10">
            <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${
              isDarkMode ? 'text-gray-100' : 'text-gray-800'
            }`}>
              <i className="fas fa-lightbulb" aria-hidden="true"></i>
              Key Insights
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Strong Organic Reach */}
              {channelData.length > 0 && (
                <div className={`card p-5 border-l-4 border-green-500 rounded-xl ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white shadow-md'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📈</span>
                    <div>
                      <p className={`font-semibold mb-1 ${
                        isDarkMode ? 'text-gray-100' : 'text-gray-800'
                      }`}>Strong Organic Reach</p>
                      <p className={`text-sm mt-1 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {(() => {
                          const organicChannels = channelData.filter((c: { channel: string; sessions: number; users: number; percentage: number }) => 
                            c.channel.toLowerCase().includes('organic') || 
                            c.channel.toLowerCase().includes('direct')
                          );
                          const organicPercentage = channelData.reduce((sum: number, c: { channel: string; sessions: number; users: number; percentage: number }) => 
                            organicChannels.includes(c) ? sum + c.percentage : sum, 0
                          );
                          return `${organicPercentage.toFixed(1)}% of traffic comes from Organic Search and Direct channels, indicating strong SEO and brand recognition.`;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Top Country Insight */}
              {countryData.length > 0 && (
                <div className={`card p-5 border-l-4 border-blue-500 rounded-xl ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white shadow-md'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🌍</span>
                    <div>
                      <p className={`font-semibold mb-1 ${
                        isDarkMode ? 'text-gray-100' : 'text-gray-800'
                      }`}>Top Market</p>
                      <p className={`text-sm mt-1 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {countryData[0]?.country} accounts for {countryData[0]?.share.toFixed(1)}% of all traffic, making it your primary market.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile-First Insight */}
              {deviceData.length > 0 && (
                <div className={`card p-5 border-l-4 border-purple-500 rounded-xl ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white shadow-md'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📱</span>
                    <div>
                      <p className={`font-semibold mb-1 ${
                        isDarkMode ? 'text-gray-100' : 'text-gray-800'
                      }`}>Mobile-First Audience</p>
                      <p className={`text-sm mt-1 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {(() => {
                          const mobile = deviceData.find((d: { device: string; sessions: number; avgDuration: number; percentage: number }) => d.device.toLowerCase() === 'mobile');
                          return mobile 
                            ? `${mobile.percentage.toFixed(1)}% of traffic is mobile, typical for content consumption patterns.`
                            : 'Device distribution shows diverse usage patterns.';
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Engagement Insight */}
              {engagementMetrics && (
                <div className={`card p-5 border-l-4 border-yellow-500 rounded-xl ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white shadow-md'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className={`font-semibold mb-1 ${
                        isDarkMode ? 'text-gray-100' : 'text-gray-800'
                      }`}>Engagement Analysis</p>
                      <p className={`text-sm mt-1 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {engagementMetrics.bounceRate > 50 
                          ? `Bounce rate of ${engagementMetrics.bounceRate.toFixed(1)}% suggests room for improvement in content engagement.`
                          : `Strong engagement rate of ${engagementMetrics.engagementRate.toFixed(1)}% indicates quality traffic.`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Browser Insight */}
              {browserData.length > 0 && (
                <div className={`card p-5 border-l-4 border-red-500 rounded-xl ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white shadow-md'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📲</span>
                    <div>
                      <p className={`font-semibold mb-1 ${
                        isDarkMode ? 'text-gray-100' : 'text-gray-800'
                      }`}>Browser Distribution</p>
                      <p className={`text-sm mt-1 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {browserData[0]?.browser} leads with {browserData[0]?.percentage.toFixed(1)}% of sessions, indicating platform preferences.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Desktop Engagement */}
              {deviceData.length > 1 && (
                <div className={`card p-5 border-l-4 border-indigo-500 rounded-xl ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white shadow-md'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⏱️</span>
                    <div>
                      <p className={`font-semibold mb-1 ${
                        isDarkMode ? 'text-gray-100' : 'text-gray-800'
                      }`}>Device Engagement</p>
                      <p className={`text-sm mt-1 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {(() => {
                          const desktop = deviceData.find((d: { device: string; sessions: number; avgDuration: number; percentage: number }) => d.device.toLowerCase() === 'desktop');
                          const mobile = deviceData.find((d: { device: string; sessions: number; avgDuration: number; percentage: number }) => d.device.toLowerCase() === 'mobile');
                          if (desktop && mobile && desktop.avgDuration > mobile.avgDuration * 1.5) {
                            return `Desktop users spend significantly longer (${formatDuration(desktop.avgDuration)} vs ${formatDuration(mobile.avgDuration)}) than mobile users per session.`;
                          }
                          return 'Device engagement varies across platforms.';
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Daily Trend */}
        {dailyTrendData.length > 0 && (
          <section className="mb-10">
            <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${
              isDarkMode ? 'text-gray-100' : 'text-gray-800'
            }`}>
              <i className="fas fa-chart-line" aria-hidden="true"></i>
              Daily Sessions Trend
            </h2>
            <div className={`card p-6 rounded-xl ${
              isDarkMode 
                ? 'bg-gray-800 border border-gray-700 shadow-lg' 
                : 'bg-white shadow-md'
            }`}>
              <GA4Chart
                data={dailyTrendData}
                metrics={['sessions']}
                dimensions={['date']}
                chartType="line"
              />
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className={`py-6 px-6 text-center text-sm ${
        isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-800 text-gray-400'
      }`}>
        <p className="flex items-center justify-center gap-2">
          <i className="fas fa-chart-bar" aria-hidden="true"></i>
          Generated from Google Analytics 4 • Property ID: {propertyId}
        </p>
        <p className="mt-1 flex items-center justify-center gap-2">
          <i className="fas fa-calendar" aria-hidden="true"></i>
          Report Period: {dateRangeSubtitle || dateRangeTitle}
        </p>
      </footer>
    </div>
  );
}

