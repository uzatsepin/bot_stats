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

app.use("*", async (c, next) => {
    c.set("telegram", telegramClient);
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
    cron.schedule("0 * * * *", async () => {
        try {
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
        telegramClient = await initTelegramClient();
        console.log("Telegram client initialized");
        await init();

        scheduleCronJobs(telegramClient, channelUsername);

        serve({ fetch: app.fetch, port });
        console.log(`Server is running on port ${port}`);
    } catch (error) {
        console.error("Ошибка инициализации приложения:", error);
        process.exit(1);
    }
};

bootstrap();
