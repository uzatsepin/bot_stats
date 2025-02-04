import { getPostStats } from "./getPostData.js";
import { getFullStats } from "./getFullStats.js";
import { getReport } from "./getReport.js";
import { getDailyReport } from "./getDailyReport.js";
import { getDetailedStats } from "./getDetailedStats.js";
import { getPopularPosts } from "./getPopularPosts.js";

export function registerRoutes(app) {
  app.get("/channel/:username/post/:postId/stats", getPostStats);
  app.get("/channel/:username/stats", getFullStats);
  app.get("/channel/:username/report", getReport);
  app.get("/channel/:username/dailyreport", getDailyReport);
  app.get("/channel/:username/detailedStats", getDetailedStats);
  app.get("/channel/:username/popularPosts", getPopularPosts);
}