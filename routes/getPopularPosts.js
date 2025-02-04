export async function getPopularPosts(c) {
    const channelUsername = c.req.param('username');
    const client = c.get('telegram');
    
    try {
      const channel = await client.getEntity(channelUsername);
      if (!channel) {
        return c.json({ error: 'Канал не найден' }, 404);
      }
    
      const messages = await client.getMessages(channel, { limit: 100 });
    
      const popularPosts = messages
        .filter(msg => msg.views)
        .sort((a, b) => b.views - a.views)
        .slice(0, 10)
        .map(msg => {
          const reactionsCount = msg.reactions && msg.reactions.results
            ? msg.reactions.results.reduce((total, reaction) => total + reaction.count, 0)
            : 0;
    
          return {
            id: msg.id,
            link: `https://t.me/${channelUsername}/${msg.id}`,
            views: msg.views,
            forwards: msg.forwards || 0,
            reactions: reactionsCount,
            text: msg.message || '[Медиафайл]',
          };
        });
    
      return c.json(popularPosts);
    } catch (error) {
      console.error('Ошибка при получении популярных постов:', error);
      return c.json({ 
        error: error.message,
        details: 'Некоторые данные могут быть недоступны' 
      }, 500);
    }
  }