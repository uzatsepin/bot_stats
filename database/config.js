import { openDb } from './db.js'

export async function init() {
  const db = await openDb()
  
  try {
    // Создаем оптимизированную таблицу для статистики
    await db.exec(`
      CREATE TABLE IF NOT EXISTS channel_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        subscribers INTEGER NOT NULL DEFAULT 0,
        views INTEGER NOT NULL DEFAULT 0,
        reach REAL NOT NULL DEFAULT 0,
        posts_count INTEGER NOT NULL DEFAULT 0,
        daily_views INTEGER NOT NULL DEFAULT 0,
        engagement_rate REAL NOT NULL DEFAULT 0,
        timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date, timestamp)
      ) STRICT;
    `)

    // Индексы для оптимизации запросов
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_channel_stats_date ON channel_stats(date);
      CREATE INDEX IF NOT EXISTS idx_channel_stats_timestamp ON channel_stats(timestamp);
    `)

    // Оптимизация базы данных
    await db.exec('PRAGMA journal_mode = WAL;')  // Используем WAL для лучшей производительности
    await db.exec('PRAGMA synchronous = NORMAL;') // Баланс между скоростью и надежностью
    await db.exec('PRAGMA foreign_keys = ON;')   // Включаем проверку foreign keys

    console.log('Database initialized and optimized for production')
    return db
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}