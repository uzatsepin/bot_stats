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
  app.get('/channels/:username/posts/:postId', getPostStats);
  app.get('/channels/:username/posts/:postId/engagement', getPostEngagement);
  
  // Channel statistics routes
  app.get('/channels/:username/stats', getChannelStats);
  app.get('/channels/:username/engagement', getChannelEngagement);
  app.get('/channels/:username/growth', getChannelGrowth);
  app.get('/channels/:username/history', getChannelHistory);
  
  // Report routes
  app.get('/channels/:username/reports/daily', getDailyReport);
  app.get('/channels/:username/reports/weekly', getWeeklyReport);
  app.get('/channels/:username/reports/monthly', getMonthlyReport);
}