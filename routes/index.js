import { getPostStats, getPostEngagement } from '../controllers/posts.js';
import { 
  getChannelStats, 
  getChannelEngagement,
  getChannelGrowth,
  getChannelHistory
} from '../controllers/channel.js';
import { 
  getDailyReport, 
  getWeeklyReport,
  getMonthlyReport 
} from '../controllers/reports.js';

export function registerRoutes(app) {
  app.get('/channels/:username/posts/:postId', getPostStats);
  app.get('/channels/:username/posts/:postId/engagement', getPostEngagement);
  
  app.get('/channels/:username/stats', getChannelStats);
  app.get('/channels/:username/engagement', getChannelEngagement);
  app.get('/channels/:username/growth', getChannelGrowth);
  app.get('/channels/:username/history', getChannelHistory);
  
  app.get('/channels/:username/reports/daily', getDailyReport);
  app.get('/channels/:username/reports/weekly', getWeeklyReport);
  app.get('/channels/:username/reports/monthly', getMonthlyReport);
}