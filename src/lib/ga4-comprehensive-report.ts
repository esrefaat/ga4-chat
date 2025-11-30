/**
 * GA4 Comprehensive Report Generator
 * 
 * Generates comprehensive traffic reports with multiple sections:
 * - Overview metrics
 * - Engagement metrics
 * - Traffic by channel
 * - Top countries
 * - Browser usage
 * - Device distribution
 * - Daily trends
 */

import { GA4ReportParams } from '@/app/api/ga4/mcp-bridge';
import { callGA4Report } from '@/app/api/ga4/mcp-bridge';

export interface ComprehensiveReportData {
  overview: any;
  engagement: any;
  channels: any;
  countries: any;
  browsers: any;
  devices: any;
  dailyTrend: any;
  propertyId: string;
  dateRange: { start_date: string; end_date: string; name: string };
}

/**
 * Generates a comprehensive GA4 report with multiple queries
 */
export async function generateComprehensiveReport(
  propertyId: string,
  dateRange: { start_date: string; end_date: string; name: string }
): Promise<ComprehensiveReportData> {
  console.log(`📊 Generating comprehensive report for property ${propertyId}, date range: ${dateRange.name}`);

  // Execute all queries in parallel for better performance
  // Use Promise.allSettled to handle individual failures gracefully
  return Promise.allSettled([
    // 1. Overview metrics (sessions, users, newUsers, screenPageViews, averageSessionDuration)
    callGA4Report({
      property_id: propertyId,
      date_ranges: [dateRange],
      metrics: ['sessions', 'activeUsers', 'newUsers', 'screenPageViews', 'averageSessionDuration'],
      dimensions: [],
      limit: 1,
    } as GA4ReportParams),

    // 2. Engagement metrics (engagementRate, bounceRate)
    callGA4Report({
      property_id: propertyId,
      date_ranges: [dateRange],
      metrics: ['engagementRate', 'bounceRate', 'engagedSessions'],
      dimensions: [],
      limit: 1,
    } as GA4ReportParams),

    // 3. Traffic by channel
    callGA4Report({
      property_id: propertyId,
      date_ranges: [dateRange],
      metrics: ['sessions', 'activeUsers'],
      dimensions: ['sessionDefaultChannelGroup'],
      order_bys: [{ metric: { metric_name: 'sessions' }, desc: true }],
      limit: 10,
    } as GA4ReportParams),

    // 4. Top countries
    callGA4Report({
      property_id: propertyId,
      date_ranges: [dateRange],
      metrics: ['sessions', 'activeUsers', 'engagementRate'],
      dimensions: ['country'],
      order_bys: [{ metric: { metric_name: 'sessions' }, desc: true }],
      limit: 10,
    } as GA4ReportParams),

    // 5. Browser usage
    callGA4Report({
      property_id: propertyId,
      date_ranges: [dateRange],
      metrics: ['sessions'],
      dimensions: ['browser'],
      order_bys: [{ metric: { metric_name: 'sessions' }, desc: true }],
      limit: 10,
    } as GA4ReportParams),

    // 6. Device distribution
    callGA4Report({
      property_id: propertyId,
      date_ranges: [dateRange],
      metrics: ['sessions', 'averageSessionDuration'],
      dimensions: ['deviceCategory'],
      order_bys: [{ metric: { metric_name: 'sessions' }, desc: true }],
      limit: 10,
    } as GA4ReportParams),

    // 7. Daily trend
    callGA4Report({
      property_id: propertyId,
      date_ranges: [dateRange],
      metrics: ['sessions'],
      dimensions: ['date'],
      order_bys: [{ dimension: { dimension_name: 'date' }, desc: false }],
      limit: 100,
    } as GA4ReportParams),
  ]).then((results) => {
    // Process Promise.allSettled results
    const processedResults = results.map((result, index) => {
      const queryNames = ['overview', 'engagement', 'channels', 'countries', 'browsers', 'devices', 'dailyTrend'];
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`❌ Failed to fetch ${queryNames[index]}:`, result.reason);
        // Return null for failed queries so the report can still render partial data
        return null;
      }
    });

    return {
      overview: processedResults[0],
      engagement: processedResults[1],
      channels: processedResults[2],
      countries: processedResults[3],
      browsers: processedResults[4],
      devices: processedResults[5],
      dailyTrend: processedResults[6],
      propertyId,
      dateRange,
    };
  });
}

