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
  // Post-related routes
  app.get('/api/v1/channels/:username/posts/:postId', getPostStats);
  app.get('/api/v1/channels/:username/posts/:postId/engagement', getPostEngagement);
  
  // Channel statistics routes
  app.get('/api/v1/channels/:username/stats', getChannelStats);
  app.get('/api/v1/channels/:username/engagement', getChannelEngagement);
  app.get('/api/v1/channels/:username/growth', getChannelGrowth);
  app.get('/api/v1/channels/:username/history', getChannelHistory);
  
  // Report routes
  app.get('/api/v1/channels/:username/reports/daily', getDailyReport);
  app.get('/api/v1/channels/:username/reports/weekly', getWeeklyReport);
  app.get('/api/v1/channels/:username/reports/monthly', getMonthlyReport);
}