import { openDb } from '../database/db.js'
import { Api } from 'telegram'

export async function saveDailyStats(client, channelUsername) {
  const startTime = Date.now()
  let db

  try {
    // Получаем данные канала
    console.log(`Fetching stats for channel: ${channelUsername}`)
    const channel = await client.getEntity(channelUsername)
    const full = await client.invoke(
      new Api.channels.GetFullChannel({ channel })
    )
    const subscribers = full.fullChat.participantsCount || 0

    // Получаем сообщения за последние 24 часа
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    const messages = await client.getMessages(channel, { 
      limit: 100,
      offsetDate: yesterday
    })

    if (!messages || messages.length === 0) {
      console.log('No messages found in the last 24 hours')
      return
    }

    // Подсчитываем метрики
    const stats = messages.reduce((acc, msg) => {
      const views = msg.views || 0
      const forwards = msg.forwards || 0
      const replies = msg.replies?.count || 0
      const reactions = msg.reactions?.results?.reduce((total, reaction) => 
        total + (reaction.count || 0), 0) || 0

      return {
        totalViews: acc.totalViews + views,
        dailyViews: acc.dailyViews + views,
        interactions: acc.interactions + forwards + replies + reactions
      }
    }, { totalViews: 0, dailyViews: 0, interactions: 0 })

    const reach = messages.length ? stats.totalViews / messages.length : 0
    const engagementRate = stats.dailyViews ? (stats.interactions / stats.dailyViews * 100) : 0

    // Форматируем данные для сохранения
    const data = {
      date: now.toISOString().slice(0, 10),
      subscribers,
      views: stats.totalViews,
      reach: parseFloat(reach.toFixed(2)),
      posts_count: messages.length,
      daily_views: stats.dailyViews,
      engagement_rate: parseFloat(engagementRate.toFixed(2))
    }

    // Сохраняем в базу
    db = await openDb()
    await db.run(`
      INSERT OR REPLACE INTO channel_stats (
        date, subscribers, views, reach, posts_count, daily_views, engagement_rate
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      data.date, data.subscribers, data.views, data.reach,
      data.posts_count, data.daily_views, data.engagement_rate
    ])

    const duration = Date.now() - startTime
    console.log(`Stats saved successfully for ${data.date} (took ${duration}ms):`, data)
  } catch (error) {
    console.error(`Error saving stats for ${channelUsername}:`, error)
    throw error
  } finally {
    if (db) {
      await db.close()
    }
  }
}