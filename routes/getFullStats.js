import { Api } from 'telegram'

export async function getFullStats(c) {
	const channelUsername = c.req.param('username')
	const client = c.get('telegram')
	
	try {
	  // Get channel info
	  const channel = await client.getEntity(channelUsername)
	  if (!channel) {
		return c.json({ error: 'Канал не найден' }, 404)
	  }
  
	  // Get full channel data
	  const fullChannel = await client.invoke(
		new Api.channels.GetFullChannel({ channel })
	  )
	  
	  const participants_count = fullChannel.fullChat.participantsCount || 0
  
	  // Get recent messages
	  const messages = await client.getMessages(channel, { limit: 100 })
  
	  // Calculate views and activity
	  let total_views = 0
	  let max_views = 0
	  const dailyActivity = {}
	  
	  messages.forEach(msg => {
		if (msg.views) {
		  total_views += msg.views
		  max_views = Math.max(max_views, msg.views)
		}
  
		const date = new Date(msg.date * 1000).toISOString().slice(0, 10)
		dailyActivity[date] = (dailyActivity[date] || 0) + 1
	  })
  
	  // Calculate engagement metrics
	  const avg_views = messages.length ? Math.floor(total_views / messages.length) : 0
	  const engagement_rate = participants_count ? (avg_views / participants_count * 100).toFixed(2) : 0
	  const max_engagement_rate = participants_count ? (max_views / participants_count * 100).toFixed(2) : 0
  
	  const result = {
		channel_info: {
		  participants_count,
		  total_views,
		  reach: Number((total_views / messages.length).toFixed(2))
		},
		engagement_metrics: {
		  average_views: avg_views,
		  max_views,
		  engagement_rate: Number(engagement_rate), // % подписчиков читающих посты
		  max_engagement_rate: Number(max_engagement_rate), // % максимального охвата
		  active_readers: Math.floor(avg_views) // оценка активных читателей
		}
	  }
  
	  return c.json(result)
	} catch (error) {
	  console.error('Ошибка при получении полной статистики канала:', error)
	  return c.json({ error: error.message }, 500)
	}
  }