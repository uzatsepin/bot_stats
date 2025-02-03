import { openDb } from '../database/db.js'

export async function getDailyComparison(c) {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const db = await openDb()

  const todayData = await db.get('SELECT * FROM channel_stats WHERE date = ?', today)
  const yesterdayData = await db.get('SELECT * FROM channel_stats WHERE date = ?', yesterday)

  return c.json({
    today: todayData || {},
    yesterday: yesterdayData || {},
    difference: {
      subscribers: (todayData && yesterdayData) ? todayData.subscribers - yesterdayData.subscribers : null,
      views: (todayData && yesterdayData) ? todayData.views - yesterdayData.views : null,
      reach: (todayData && yesterdayData) ? todayData.reach - yesterdayData.reach : null
    }
  })
}