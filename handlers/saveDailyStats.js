import { openDb } from '../database/db.js'
import { Api } from 'telegram'

export async function saveDailyStats(client, channelUsername) {
  // Получаем данные канала
  const channel = await client.getEntity(channelUsername)
  const full = await client.invoke(
    new Api.channels.GetFullChannel({ channel })
  )
  // Если поле participants_count пустое, можно использовать 0 или получить через Bot API
  const subscribers = full.fullChat.participantsCount || 0

  // Получаем последние 100 сообщений для подсчета просмотров
  const messages = await client.getMessages(channel, { limit: 100 })
  const totalViews = messages.reduce((acc, msg) => acc + (msg.views || 0), 0)
  const reach = messages.length ? totalViews / messages.length : 0

  const today = new Date().toISOString().slice(0, 10)

  const db = await openDb()
  await db.run(
    `INSERT OR REPLACE INTO channel_stats (date, subscribers, views, reach) VALUES (?, ?, ?, ?)`,
    today,
    subscribers,
    totalViews,
    reach
  )
  console.log(`Stats saved for ${today}`)
}