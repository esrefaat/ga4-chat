# Traffic Sources by Channel - Query Guide

This guide shows you how to query traffic sources broken down by channel groups (Organic, Paid, Direct, etc.) in GA4.

## Channel Group Dimension

GA4 uses `sessionDefaultChannelGroup` to categorize traffic into standard channel groups:
- **Organic Search** - Traffic from search engines (Google, Bing, etc.)
- **Paid Search** - Paid search ads (Google Ads, Bing Ads)
- **Direct** - Direct visits (typing URL, bookmarks)
- **Referral** - Traffic from other websites
- **Social** - Social media platforms
- **Email** - Email campaigns
- **Display** - Display advertising
- **Paid Social** - Paid social media ads
- **Affiliates** - Affiliate marketing
- **Audio** - Audio advertising
- **SMS** - SMS campaigns
- **Other** - Other sources

## Example Queries

### Basic Channel Queries

1. **Show traffic by channel:**
   ```
   Show me traffic by channel
   ```

2. **Get traffic sources by channel group:**
   ```
   What are my traffic sources by channel?
   ```

3. **Show sessions by channel:**
   ```
   Show me sessions by channel for last 30 days
   ```

4. **Traffic breakdown by organic and paid:**
   ```
   Show traffic by channel group
   ```

### Specific Channel Queries

5. **Organic traffic only:**
   ```
   Show me organic search traffic
   ```

6. **Paid traffic:**
   ```
   Show paid search traffic
   ```

7. **Social media traffic:**
   ```
   Show social media traffic
   ```

8. **Direct traffic:**
   ```
   Show direct traffic
   ```

### Advanced Queries

9. **Channel comparison:**
   ```
   Compare organic vs paid traffic
   ```

10. **Top channels:**
    ```
    What are my top traffic channels?
    ```

11. **Channel performance:**
    ```
    Show me channel performance with sessions and users
    ```

12. **Channel breakdown for specific period:**
    ```
    Show traffic by channel for March 2025
    ```

## How It Works

When you ask for traffic "by channel", "by organic", "by paid", etc., the system will:

1. Use `sessionDefaultChannelGroup` as the dimension
2. Group all traffic into standard channel categories
3. Show metrics (sessions, users, page views) for each channel
4. Display results in a beautiful table with charts

## Notes

- Channel grouping is automatic - GA4 categorizes traffic based on source, medium, and campaign
- You can't manually create custom channel groups in queries
- The channel dimension shows all channels, not just one specific channel
- To filter to a specific channel (e.g., only Organic), you would need to use filters (coming soon)

## Example Response

When you ask "Show me traffic by channel", you'll get:

- A beautiful report header
- Overview cards showing total sessions, users, etc.
- A chart showing channel distribution
- A table with:
  - Channel name (Organic Search, Paid Search, Direct, etc.)
  - Sessions
  - Users
  - Percentage share
  - Progress bars

