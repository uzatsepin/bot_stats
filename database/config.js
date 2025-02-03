import { openDb } from './db.js'

export async function init() {
  const db = await openDb()
  await db.exec(`
    CREATE TABLE IF NOT EXISTS channel_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      subscribers INTEGER,
      views INTEGER,
      reach REAL,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)
  console.log('Database initialized')
}