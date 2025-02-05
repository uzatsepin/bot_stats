import { openDb } from "../database/db.js";

export async function getReport(c) {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

    const db = await openDb();

    const todayData = await db.get(`
        SELECT * FROM channel_stats 
        WHERE timestamp = (
            SELECT MAX(timestamp) 
            FROM channel_stats 
            WHERE date = ?
        )`,
        today
    );

    const yesterdayData = await db.get(`
        SELECT * FROM channel_stats 
        WHERE timestamp = (
            SELECT MAX(timestamp) 
            FROM channel_stats 
            WHERE date = ?
        )`,
        yesterday
    );

    const weekAgoData = await db.get(`
        SELECT * FROM channel_stats 
        WHERE timestamp = (
            SELECT MAX(timestamp) 
            FROM channel_stats 
            WHERE date = ?
        )`,
        weekAgo
    );

    const monthAgoData = await db.get(`
        SELECT * FROM channel_stats 
        WHERE timestamp = (
            SELECT MAX(timestamp) 
            FROM channel_stats 
            WHERE date = ?
        )`,
        monthAgo
    );

    return c.json({
        today: todayData || {},
        yesterday: yesterdayData || {},
        weekAgo: weekAgoData || {},
        monthAgo: monthAgoData || {},
        dailyDifference: {
            subscribers: todayData && yesterdayData ? todayData.subscribers - yesterdayData.subscribers : null,
            views: todayData && yesterdayData ? todayData.views - yesterdayData.views : null,
            reach: todayData && yesterdayData ? todayData.reach - yesterdayData.reach : null
        },
        weeklyDifference: {
            subscribers: todayData && weekAgoData ? todayData.subscribers - weekAgoData.subscribers : null,
            views: todayData && weekAgoData ? todayData.views - weekAgoData.views : null,
            reach: todayData && weekAgoData ? todayData.reach - weekAgoData.reach : null
        },
        monthlyDifference: {
            subscribers: todayData && monthAgoData ? todayData.subscribers - monthAgoData.subscribers : null,
            views: todayData && monthAgoData ? todayData.views - monthAgoData.views : null,
            reach: todayData && monthAgoData ? todayData.reach - monthAgoData.reach : null
        }
    });
}