import dotenv from 'dotenv'
import cron from 'node-cron'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { cors } from 'hono/cors'
import { initTelegramClient } from './config/telegram.js'
import { getPostStats } from './routes/getPostData.js'
import { getFullStats } from './routes/getFullStats.js'
import { getDailyComparison } from './routes/getDailyComprasion.js'
import { saveDailyStats } from './handlers/saveDailyStats.js'
import { init } from './database/config.js'

dotenv.config()
const app = new Hono()
const channelUsername = process.env.CHANNEL_USERNAME
let telegramClient

// Global middlewares
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', cors())

// Inject Telegram client into context
app.use('*', async (c, next) => {
  c.set('telegram', telegramClient)
  await next()
})

// Health-check endpoint
app.get('/', (c) =>
  c.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  })
)

// API endpoints
app.get('/channel/:username/post/:postId/stats', getPostStats)
app.get('/channel/:username/stats', getFullStats)
app.get('/channel/:username/report', getDailyComparison)

// Function to schedule cron jobs
function scheduleCronJobs(client, channelUsername) {
  console.log('Инициализация задания сохранения статистики')
  // Запуск задания каждый час
  cron.schedule('0 * * * *', async () => {
    try {
      await saveDailyStats(client, channelUsername)
      console.log('Статистика успешно сохранена')
    } catch (error) {
      console.error('Ошибка при сохранении статистики:', error)
    }
  })
}

const port = process.env.PORT || 3000

const bootstrap = async () => {
  try {
    // Initialize Telegram client and database
    telegramClient = await initTelegramClient()
    console.log('Telegram client initialized')
    await init()

    // Schedule cron jobs
    scheduleCronJobs(telegramClient, channelUsername)

    // Start the server
    serve({ fetch: app.fetch, port })
    console.log(`Server is running on port ${port}`)
  } catch (error) {
    console.error('Ошибка инициализации приложения:', error)
    process.exit(1)
  }
}

bootstrap()