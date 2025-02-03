import { Api } from 'telegram'

export async function getFullStats(c) {
  const channelUsername = c.req.param('username')
  const client = c.get('telegram')
  
  try {
    // Получаем сущность канала по username
    const channel = await client.getEntity(channelUsername)
    if (!channel) {
      return c.json({ error: 'Канал не найден' }, 404)
    }

    // Получаем расширенную информацию о канале для количества участников
    const fullChannel = await client.invoke(
      new Api.channels.GetFullChannel({ channel })
    )

    console.log(fullChannel.fullChat.participantsCount);
    
    const participants_count = fullChannel.fullChat.participantsCount

    // Получаем последние 100 сообщений канала (можно увеличить, если требуется)
    const messages = await client.getMessages(channel, { limit: 100 })

    // Подсчитываем общие просмотры, определяем топовые сообщения, собираем активность по дням
    let total_views = 0
    const dailyActivity = {}     // { 'YYYY-MM-DD': count }
    messages.forEach(msg => {
      if (msg.views) total_views += msg.views

      // Формат даты (в UTC) для группировки активности по дням
      const date = new Date(msg.date * 1000).toISOString().slice(0, 10)
      dailyActivity[date] = (dailyActivity[date] || 0) + 1
    })

    // Определяем топ-3 сообщения по количеству просмотров
    const top_messages = messages
      .filter(msg => msg.views != null)
      .sort((a, b) => b.views - a.views)
      .slice(0, 3)
      .map(msg => ({
        id: msg.id,
        views: msg.views,
        date: msg.date
      }))

    // Охват и взаимодействие – можно оценить как среднее число просмотров за сообщение
    const reach = messages.length ? (total_views / messages.length).toFixed(2) : 0

    // Формируем результат в виде одного объекта JSON
    const result = {
      participants_count,
      total_views,
      top_messages,
      reach: Number(reach),
    }

    return c.json(result)
  } catch (error) {
    console.error('Ошибка при получении полной статистики канала:', error)
    return c.json({ error: error.message }, 500)
  }
}