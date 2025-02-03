import dotenv from 'dotenv'
import cron from 'node-cron'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { cors } from 'hono/cors'
import { initTelegramClient } from './config/telegram.js'
import { getChannelStats } from './routes/channelStats.js'
import { getPostStats } from './routes/getPostData.js'
import { getFullStats } from './routes/getFullStats.js'
import { init } from './database/config.js'
import { getDailyComparison } from './routes/getDailyComprasion.js'
import { saveDailyStats } from './handlers/saveDailyStats.js'

dotenv.config()

const app = new Hono()
const channelUsername = process.env.CHANNEL_USERNAME
let telegramClient

app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', cors())

app.use('*', async (c, next) => {
  c.set('telegram', telegramClient)
  await next()
})

app.get('/', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  })
})

app.get('/channel/:username/stats', getChannelStats)
app.get('/channel/:username/post/:postId/stats', getPostStats)
app.get('/channel/:username/full', getFullStats)
app.get('/channel/:username/report', getDailyComparison)

const port = process.env.PORT || 3000

const bootstrap = async () => {
  try {
    telegramClient = await initTelegramClient()
    console.log('Telegram client initialized')
    await init();

    (async () => {
      console.log('Инициализация задания сохранения статистики');
      
      const client = await initTelegramClient()
      cron.schedule('0 * * * *', async () => {
        try {
          await saveDailyStats(client, channelUsername)
          console.log('Статистика успешно сохранена')
        } catch (error) {
          console.error('Ошибка при сохранении статистики:', error)
        }
      })
    })()

    serve({
      fetch: app.fetch,
      port
    })
    console.log(`Server is running on port ${port}`)
  } catch (err) {
    console.error('Ошибка инициализации приложения:', err)
    process.exit(1)
  }
}

bootstrap()