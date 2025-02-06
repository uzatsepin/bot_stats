import { 
  getChannel, 
  getChannelFullInfo, 
  getChannelMessages,
  calculateEngagementMetrics 
} from '../utils/telegram.js';
import { errorHandler } from '../middleware/errorHandler.js';

export async function getDailyReport(c) {
  try {
    const username = c.req.param('username');
    const client = c.get('telegram');

    const channel = await getChannel(client, username);
    const fullChannel = await getChannelFullInfo(client, channel);
    const messages = await getChannelMessages(client, channel, { limit: 50 });

    // Group messages by day
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    
    const todayMessages = messages.filter(msg => {
      const msgDate = new Date(msg.date * 1000).toISOString().slice(0, 10);
      return msgDate === todayStr;
    });

    const report = {
      date: todayStr,
      total_posts: todayMessages.length,
      ...calculateEngagementMetrics(todayMessages, fullChannel.fullChat.participantsCount),
      posts: todayMessages.map(msg => ({
        id: msg.id,
        time: new Date(msg.date * 1000).toISOString(),
        views: msg.views || 0,
        forwards: msg.forwards || 0,
        replies: msg.replies?.count || 0
      }))
    };

    return c.json({
      success: true,
      data: report
    });
  } catch (error) {
    return errorHandler(error, c);
  }
}

export async function getWeeklyReport(c) {
  try {
    const username = c.req.param('username');
    const client = c.get('telegram');

    const channel = await getChannel(client, username);
    const fullChannel = await getChannelFullInfo(client, channel);
    const messages = await getChannelMessages(client, channel);

    // Group messages by week
    const weeklyStats = {};
    messages.forEach(msg => {
      const date = new Date(msg.date * 1000);
      const week = getWeekNumber(date);
      if (!weeklyStats[week]) {
        weeklyStats[week] = {
          posts: 0,
          views: 0,
          forwards: 0,
          replies: 0
        };
      }
      weeklyStats[week].posts++;
      weeklyStats[week].views += msg.views || 0;
      weeklyStats[week].forwards += msg.forwards || 0;
      weeklyStats[week].replies += msg.replies?.count || 0;
    });

    return c.json({
      success: true,
      data: {
        current_week: getWeekNumber(new Date()),
        weekly_stats: weeklyStats
      }
    });
  } catch (error) {
    return errorHandler(error, c);
  }
}

export async function getMonthlyReport(c) {
  try {
    const username = c.req.param('username');
    const client = c.get('telegram');

    const channel = await getChannel(client, username);
    const fullChannel = await getChannelFullInfo(client, channel);
    const messages = await getChannelMessages(client, channel);

    // Group messages by month
    const monthlyStats = {};
    messages.forEach(msg => {
      const date = new Date(msg.date * 1000);
      const month = date.toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyStats[month]) {
        monthlyStats[month] = {
          posts: 0,
          views: 0,
          forwards: 0,
          replies: 0,
          engagement_rate: 0
        };
      }
      monthlyStats[month].posts++;
      monthlyStats[month].views += msg.views || 0;
      monthlyStats[month].forwards += msg.forwards || 0;
      monthlyStats[month].replies += msg.replies?.count || 0;
    });

    // Calculate engagement rates
    Object.values(monthlyStats).forEach(stats => {
      stats.engagement_rate = stats.views ? 
        ((stats.forwards + stats.replies) / stats.views * 100).toFixed(2) : 0;
    });

    return c.json({
      success: true,
      data: {
        current_month: new Date().toISOString().slice(0, 7),
        monthly_stats: monthlyStats
      }
    });
  } catch (error) {
    return errorHandler(error, c);
  }
}

// Helper function to get week number
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
