import { 
  getChannel, 
  getChannelFullInfo, 
  getChannelMessages, 
  calculateEngagementMetrics 
} from '../utils/telegram.js';
import { errorHandler } from '../middleware/errorHandler.js';

export async function getChannelStats(c) {
  try {
    const username = c.req.param('username');
    const client = c.get('telegram');

    const channel = await getChannel(client, username);
    const fullChannel = await getChannelFullInfo(client, channel);
    const messages = await getChannelMessages(client, channel);

    const stats = {
      participants_count: fullChannel.fullChat.participantsCount || 0,
      total_messages: messages.length,
      ...calculateEngagementMetrics(messages, fullChannel.fullChat.participantsCount)
    };

    return c.json({
      success: true,
      data: stats
    });
  } catch (error) {
    return errorHandler(error, c);
  }
}

export async function getChannelEngagement(c) {
  try {
    const username = c.req.param('username');
    const client = c.get('telegram');

    const channel = await getChannel(client, username);
    const messages = await getChannelMessages(client, channel);

    const engagement = messages.map(msg => ({
      id: msg.id,
      date: msg.date,
      views: msg.views || 0,
      forwards: msg.forwards || 0,
      replies: msg.replies?.count || 0,
      reactions: msg.reactions?.results?.reduce((total, reaction) => total + reaction.count, 0) || 0
    }));

    return c.json({
      success: true,
      data: engagement
    });
  } catch (error) {
    return errorHandler(error, c);
  }
}

export async function getChannelGrowth(c) {
  try {
    const username = c.req.param('username');
    const client = c.get('telegram');

    const channel = await getChannel(client, username);
    const fullChannel = await getChannelFullInfo(client, channel);
    const messages = await getChannelMessages(client, channel);
        
    const dailyStats = {};
    messages.forEach(msg => {
      const date = new Date(msg.date * 1000).toISOString().slice(0, 10);
      if (!dailyStats[date]) {
        dailyStats[date] = {
          views: 0,
          posts: 0
        };
      }
      dailyStats[date].views += msg.views || 0;
      dailyStats[date].posts += 1;
    });

    return c.json({
      success: true,
      data: {
        current_subscribers: fullChannel.fullChat.participantsCount || 0,
        daily_stats: dailyStats
      }
    });
  } catch (error) {
    return errorHandler(error, c);
  }
}

export async function getChannelHistory(c) {
  try {
    const username = c.req.param('username');
    const period = c.req.query('period') || '7d';
    const db = c.get('db');

    const currentSubscribers = await db.get(`
      SELECT subscribers
      FROM channel_stats
      WHERE date = date('now')
      ORDER BY timestamp DESC
      LIMIT 1
    `);

    const validPeriods = ['1d', '7d', '14d', '30d', 'all'];
    if (!validPeriods.includes(period)) {
      return c.json({
        success: false,
        error: `Invalid period. Must be one of: ${validPeriods.join(', ')}`
      }, 400);
    }

    let rows;
    try {
      let query;
      let params;

      if (period === '1d') {
        // Get all records for current day
        query = `
        WITH PreviousDayLastRecord AS (
          SELECT *
          FROM channel_stats
          WHERE date = date('now', '-1 day')
          ORDER BY timestamp DESC
          LIMIT 1
        ),
        CurrentDayRecords AS (
          SELECT *
          FROM channel_stats
          WHERE date = date('now')
        )
        SELECT * FROM PreviousDayLastRecord
        UNION ALL
        SELECT * FROM CurrentDayRecords
        ORDER BY timestamp ASC
      `;
        params = [];
      } else if (period === 'all') {
        // Get last record for each day for all time
        query = `
          WITH DailyLastRecord AS (
            SELECT *,
              ROW_NUMBER() OVER (
                PARTITION BY date 
                ORDER BY timestamp DESC
              ) as rn
            FROM channel_stats
          )
          SELECT 
            id, date, subscribers, views, reach, timestamp
          FROM DailyLastRecord 
          WHERE rn = 1
          ORDER BY date ASC
        `;
        params = [];
      } else {
        // For 7d, 14d, 30d - get last record of each day
        const days = period.replace('d', '');
        query = `
          WITH DailyLastRecord AS (
            SELECT *,
              ROW_NUMBER() OVER (
                PARTITION BY date 
                ORDER BY timestamp DESC
              ) as rn
            FROM channel_stats
            WHERE date >= date('now', '-' || ? || ' days')
          )
          SELECT 
            id, date, subscribers, views, reach, timestamp
          FROM DailyLastRecord 
          WHERE rn = 1
          ORDER BY date ASC
        `;
        params = [days];
      }

      
      rows = await db.all(query, params);

      if (!rows?.length) {
        return c.json({
          success: true,
          data: {
            period,
            summary: {
              total_subscriber_growth: 0,
              total_views_growth: 0,
              average_reach: 0
            },
            history: []
          }
        });
      }

      const stats = rows.map((row, index) => {
        const prevRow = index > 0 ? rows[index - 1] : null;
        return {
          ...row,
          subscribers_growth: prevRow ? row.subscribers - prevRow.subscribers : 0,
          views_growth: prevRow ? row.views - prevRow.views : 0,
          reach_growth: prevRow ? Number((row.reach - prevRow.reach).toFixed(2)) : 0
        };
      });

      const summary = {
        total_subscriber_growth: stats.length > 1 ? 
          stats[stats.length - 1].subscribers - stats[0].subscribers : 0,
        total_views_growth: stats.length > 1 ? 
          stats[stats.length - 1].views - stats[0].views : 0,
        average_reach: Number((stats.reduce((sum, stat) => sum + stat.reach, 0) / stats.length).toFixed(2))
      };

      return c.json({
        success: true,
        data: {
          period,
          current_subscribers: currentSubscribers?.subscribers || 0,
          summary,
          history: stats
        }
      });

    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to fetch channel history');
    }
  } catch (error) {
    return errorHandler(error, c);
  }
}
