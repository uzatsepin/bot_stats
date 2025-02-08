import { openDb } from '../database/db.js'
import { Api } from 'telegram'

export async function saveDailyStats(client, channelUsername) {
  const startTime = Date.now()
  let db

  try {
    console.log(`Fetching stats for channel: ${channelUsername}`)
    const channel = await client.getEntity(channelUsername)
    const full = await client.invoke(
      new Api.channels.GetFullChannel({ channel })
    )
    const subscribers = full.fullChat.participantsCount || 0

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000
    
    const allMessages = await client.getMessages(channel, { limit: 100 })
    const dailyMessages = allMessages.filter(msg => msg.date >= startOfDay)

    // Calculate stats even if there are no daily messages
    const stats = {
      totalViews: allMessages.reduce((acc, msg) => acc + (msg.views || 0), 0),
      reach: allMessages.length ? allMessages.reduce((acc, msg) => acc + (msg.views || 0), 0) / allMessages.length : 0,
      dailyViews: dailyMessages.reduce((acc, msg) => acc + (msg.views || 0), 0),
      postsCount: dailyMessages.length,
      interactions: dailyMessages.reduce((acc, msg) => {
        const forwards = msg.forwards || 0
        const replies = msg.replies?.count || 0
        const reactions = msg.reactions?.results?.reduce((total, reaction) => 
          total + (reaction.count || 0), 0) || 0
        return acc + forwards + replies + reactions
      }, 0)
    }

    const engagementRate = stats.dailyViews ? (stats.interactions / stats.dailyViews * 100) : 0

    const data = {
      date: now.toISOString().slice(0, 10),
      subscribers,
      views: stats.totalViews,
      reach: parseFloat(stats.reach.toFixed(2)),
      posts_count: stats.postsCount,
      daily_views: stats.dailyViews,
      engagement_rate: parseFloat(engagementRate.toFixed(2)),
      timestamp: now.toISOString() // Add timestamp for precise tracking
    }

    db = await openDb()
    await db.run(`
      INSERT INTO channel_stats (
        date, subscribers, views, reach, posts_count, daily_views, engagement_rate, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.date, data.subscribers, data.views, data.reach,
      data.posts_count, data.daily_views, data.engagement_rate, data.timestamp
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