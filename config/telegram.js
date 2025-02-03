import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions/index.js'
import input from 'input'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SESSION_FILE = path.join(__dirname, '../sessions/user.session')

async function doLogin(client) {
  console.log('Пожалуйста, следуйте инструкциям для авторизации:')
  await client.start({
    phoneNumber: async () => process.env.PHONE_NUMBER,
    password: async () => input.text('Введите пароль (если включена двухфакторная аутентификация): '),
    phoneCode: async () => input.text('Введите код, который вы получили в Telegram: '),
    onError: (err) => console.error(err)
  })
}

export const initTelegramClient = async () => {
  const apiId = parseInt(process.env.API_ID)
  const apiHash = process.env.API_HASH

  let stringSession
  try {
    const sessionData = await fs.readFile(SESSION_FILE, 'utf8')
    stringSession = new StringSession(sessionData)
    console.log('Найдена существующая сессия')
  } catch (err) {
    stringSession = new StringSession('')
    console.log('Создаётся новая сессия')
  }

  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5
  })

  await client.connect()
  if (!await client.isUserAuthorized()) {
    await doLogin(client)
  }

  await fs.mkdir(path.dirname(SESSION_FILE), { recursive: true })
  await fs.writeFile(SESSION_FILE, client.session.save())

  console.log('Клиент Telegram инициализирован успешно')
  return client
}