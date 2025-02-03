import { Api } from 'telegram'

export async function getChannelStats(c) {
  const channelUsername = c.req.param('username')
  const client = c.get('telegram')
  try {
    // Resolve channel entity by username
    const channel = await client.getEntity(channelUsername)
    if (!channel) {
      return c.json({ error: 'Канал не найден' }, 404)
    }

    // Retrieve full channel info (e.g. participant count)
    const fullChannel = await client.invoke(
      new Api.channels.GetFullChannel({
        channel: channel
      })
    )

    // Retrieve latest 10 messages to extract post view counts
    const messages = await client.getMessages(channel, { limit: 10 })
    const posts = messages.map(msg => ({
      id: msg.id,
      views: msg.views || 0,
      date: msg.date
    }))

    const result = {
      channelTitle: channel.title,
      participantCount: fullChannel.fullChat.participant_count,
      posts
    }
    return c.json(result)
  } catch (error) {
    console.error('Ошибка при получении статистики канала:', error)
    return c.json({ error: error.message }, 500)
  }
}