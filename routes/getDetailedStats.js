import { Api } from 'telegram';

export async function getDetailedStats(c) {
  const channelUsername = c.req.param('username');
  const client = c.get('telegram');
  
  try {
    // Получаем сущность канала
    const channel = await client.getEntity(channelUsername);
    if (!channel) {
      return c.json({ error: 'Канал не найден' }, 404);
    }

    // Получаем последние 100 сообщений для анализа
    const messages = await client.getMessages(channel, { limit: 50 });

    // Подсчет пересланных сообщений
    const forwardedCount = messages.filter(msg => msg.forwards).reduce((sum, msg) => sum + msg.forwards, 0);

    // Подсчет кликов по ссылкам (если доступно)
    const linkClicks = messages
      .filter(msg => msg.views && msg.media?.webpage)
      .reduce((sum, msg) => sum + (msg.views || 0), 0);

      const now = new Date();
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);

    // Формируем результат
    const result = {
      // Статистика сообщений
      forwarded_messages: forwardedCount,
      link_clicks: linkClicks,
      
      // Период статистики
      period: {
        start_date: oneMonthAgo.toISOString(),
        end_date: now.toISOString()
      }
    };

    return c.json(result);
  } catch (error) {
    console.error('Ошибка при получении детальной статистики канала:', error);
    return c.json({ 
      error: error.message,
      details: 'Некоторые метрики могут быть недоступны без прав администратора'
    }, 500);
  }
}