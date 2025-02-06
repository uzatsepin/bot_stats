export function errorHandler(error, c) {
  console.error('Error:', error);
  
  if (error.message === 'Channel not found') {
    return c.json({ error: 'Канал не найден' }, 404);
  }
  
  if (error.message === 'Post not found') {
    return c.json({ error: 'Пост не найден' }, 404);
  }

  return c.json({ 
    error: error.message,
    details: 'Произошла ошибка при обработке запроса'
  }, 500);
}
