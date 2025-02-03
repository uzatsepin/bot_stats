export async function getPostStats(c) {
  const channelUsername = c.req.param('username')
  const postId = Number(c.req.param('postId'))
  const client = c.get('telegram')

  try {
    // Получаем информацию о канале по username
    const channel = await client.getEntity(channelUsername)
    if (!channel) {
      return c.json({ error: 'Канал не найден' }, 404)
    }

    // Получаем сообщение (пост) по postId
    const messages = await client.getMessages(channel, { ids: [postId] })
    if (!messages?.length) {
      return c.json({ error: 'Пост не найден' }, 404)
    }
    const post = messages[0]

    // Формируем расширенный объект со всей доступной информацией
    const extended = {
      id: post.id,
      text: post.message || null,
      date: post.date,
      views: post.views || 0,
      forwards: post.forwards || 0,
      replies: post.replies ? post.replies.count : 0,
      // Если сообщение содержит медиа (фото, видео, документы) – передаём информацию о нем
      media: post.media || null,
      // Если поддерживаются реакции – можно добавить, если они есть в ответе API
      reactions: post.reactions.results.reduce((total, reaction) => total + reaction.count, 0) || null
    }

    return c.json(extended)
  } catch (error) {
    console.error('Ошибка при получении статистики поста:', error)
    return c.json({ error: error.message }, 500)
  }
}