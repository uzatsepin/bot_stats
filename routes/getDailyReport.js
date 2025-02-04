import { openDb } from '../database/db.js'

export async function getDailyReport(c) {
  const db = await openDb()
  try {
    // Выбираем для каждого дня запись с максимальным значением timestamp
    const rows = await db.all(`
      SELECT cs.*
      FROM channel_stats cs
      INNER JOIN (
        SELECT date, MAX(timestamp) AS max_timestamp
        FROM channel_stats
        GROUP BY date
      ) grouped
      ON cs.date = grouped.date AND cs.timestamp = grouped.max_timestamp
      ORDER BY cs.date ASC
    `)
    return c.json({ report: rows })
  } catch (error) {
    console.error('Ошибка при получении dailyReport:', error)
    return c.json({ error: error.message }, 500)
  }
}