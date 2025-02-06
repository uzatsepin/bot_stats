import dotenv from "dotenv";
import cron from "node-cron";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { cors } from "hono/cors";
import { initTelegramClient } from "./config/telegram.js";
import { saveDailyStats } from "./handlers/saveDailyStats.js";
import { init } from "./database/config.js";
import { registerRoutes } from "./routes/index.js";

dotenv.config();
const app = new Hono();
const channelUsername = process.env.CHANNEL_USERNAME;
let telegramClient;

app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", cors());

let db;

app.use("*", async (c, next) => {
    c.set("telegram", telegramClient);
    c.set("db", db);
    await next();
});

app.get("/", (c) =>
    c.json({
        status: "ok",
        timestamp: new Date().toISOString()
    })
);

registerRoutes(app);

function scheduleCronJobs(client, channelUsername) {
    console.log("Инициализация задания сохранения статистики");
    
    // Запускаем каждые 6 часов: в 00:00, 06:00, 12:00, 18:00
    cron.schedule("0 */6 * * *", async () => {
        try {
            console.log("Начало сбора статистики:", new Date().toISOString());
            await saveDailyStats(client, channelUsername);
            console.log("Статистика успешно сохранена");
        } catch (error) {
            console.error("Ошибка при сохранении статистики:", error);
        }
    });
}

const port = process.env.PORT || 3000;

const bootstrap = async () => {
    try {
        // Initialize database first
        db = await init();
        console.log("Database initialized");

        // Initialize Telegram client
        telegramClient = await initTelegramClient();
        console.log("Telegram client initialized");

        // Schedule cron jobs
        scheduleCronJobs(telegramClient, channelUsername);

        // Start the server
        serve({ fetch: app.fetch, port });
        console.log(`Server is running on port ${port}`);
    } catch (error) {
        console.error("Ошибка инициализации приложения:", error);
        process.exit(1);
    }
};

bootstrap();
