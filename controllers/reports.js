import { 
  getChannel, 
  getChannelFullInfo, 
  getChannelMessages,
  calculateEngagementMetrics 
} from '../utils/telegram.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { getWeekStartDate, getWeekEndDate, getWeekNumber } from '../helpers/index.js';

export async function getDailyReport(c) {
  try {
    const username = c.req.param('username');
    const client = c.get('telegram');

    const channel = await getChannel(client, username);
    const fullChannel = await getChannelFullInfo(client, channel);
    const messages = await getChannelMessages(client, channel, { limit: 50 });

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    
    const todayMessages = messages.filter(msg => {
      const msgDate = new Date(msg.date * 1000).toISOString().slice(0, 10);
      return msgDate === todayStr;
    });

    const report = {
      date: todayStr,
      participant_count: fullChannel.fullChat.participantsCount || 0,
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

    // Get current year
    const currentYear = new Date().getFullYear();

    // Group messages by week for current year only
    const weeklyStats = {};
    messages.forEach(msg => {
      const date = new Date(msg.date * 1000);
      // Skip messages from other years
      if (date.getFullYear() !== currentYear) {
        return;
      }

      const week = getWeekNumber(date);
      const weekKey = `${currentYear}-W${week.toString().padStart(2, '0')}`;

      if (!weeklyStats[weekKey]) {
        weeklyStats[weekKey] = {
          week: week,
          year: currentYear,
          posts: 0,
          views: 0,
          forwards: 0,
          replies: 0,
          start_date: getWeekStartDate(date),
          end_date: getWeekEndDate(date)
        };
      }

      weeklyStats[weekKey].posts++;
      weeklyStats[weekKey].views += msg.views || 0;
      weeklyStats[weekKey].forwards += msg.forwards || 0;
      weeklyStats[weekKey].replies += msg.replies?.count || 0;
    });

    const sortedWeeks = Object.values(weeklyStats)
      .sort((a, b) => a.week - b.week);

    const currentWeek = getWeekNumber(new Date());
    
    return c.json({
      success: true,
      data: {
        current_week: `${currentYear}-W${currentWeek.toString().padStart(2, '0')}`,
        weekly_stats: sortedWeeks
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

    // Get current year
    const currentYear = new Date().getFullYear();

    // Group messages by month for current year only
    const monthlyStats = {};
    messages.forEach(msg => {
      const date = new Date(msg.date * 1000);
      // Skip messages from other years
      if (date.getFullYear() !== currentYear) {
        return;
      }

      const month = date.toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyStats[month]) {
        monthlyStats[month] = {
          month: month,
          year: currentYear,
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

    // Calculate engagement rates and convert to array
    const sortedMonths = Object.values(monthlyStats)
      .map(stats => ({
        ...stats,
        engagement_rate: Number(stats.views ? 
          ((stats.forwards + stats.replies) / stats.views * 100).toFixed(2) : 0)
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const currentMonth = new Date().toISOString().slice(0, 7);
    
    return c.json({
      success: true,
      data: {
        current_month: currentMonth,
        monthly_stats: sortedMonths
      }
    });
  } catch (error) {
    return errorHandler(error, c);
  }
}
