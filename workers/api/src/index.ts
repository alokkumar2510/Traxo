import { Hono } from "hono";
import { cors } from "hono/cors";
import { Bindings, Variables } from "./types";
import { authMiddleware } from "./middleware/auth";
import { errorHandler } from "./middleware/error";
import trackersRouter from "./routes/trackers";
import collectionsRouter from "./routes/collections";
import notificationsRouter from "./routes/notifications";
import analyticsRouter from "./routes/analytics";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 1. Global Middlewares
app.use(
  "*",
  cors({
    origin: ["https://traxo.alokkumarsahu.in", "http://localhost:3000"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

// 2. Global Error Handler
app.onError(errorHandler());

// 3. Health check (unauthenticated)
app.get("/health", (c) => {
  return c.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// 4. Authenticated API Routes
app.use("/api/*", authMiddleware());

app.route("/api/trackers", trackersRouter);
app.route("/api/collections", collectionsRouter);
app.route("/api/notifications", notificationsRouter);
app.route("/api/analytics", analyticsRouter);

import { processScanJob, calculateRetryDelay, handleFailedJob } from "./utils/queue";
import { handleCronTrigger } from "./utils/scheduler";

// 5. Cloudflare Workers Entrypoint Wrapper (Fetch, Queue & Cron Consumers)
export default {
  fetch: app.fetch,

  async queue(batch: any, env: Bindings, ctx: any): Promise<void> {
    ctx.waitUntil(
      (async () => {
        const concurrencyLimit = 5;
        const messages = batch.messages;
        for (let i = 0; i < messages.length; i += concurrencyLimit) {
          const chunk = messages.slice(i, i + concurrencyLimit);
          await Promise.all(
            chunk.map(async (message: any) => {
              const { trackerId, userId } = message.body || {};
              if (!trackerId || !userId) {
                console.error("[Queue Consumer] Invalid message body format:", message.body);
                message.ack();
                return;
              }

              try {
                await processScanJob(trackerId, userId, env, message.attempts);
              } catch (error: any) {
                console.error(`[Queue Consumer] Error processing tracker ${trackerId}:`, error.message || error);
                
                const nextAttempt = message.attempts;
                if (nextAttempt < 4) {
                  const delaySeconds = calculateRetryDelay(nextAttempt);
                  console.warn(`[Queue Consumer] Retrying tracker ${trackerId} in ${delaySeconds}s (Attempt ${nextAttempt}/3)`);
                  message.retry({ delaySeconds });
                } else {
                  await handleFailedJob(trackerId, userId, env, error);
                  message.ack();
                }
              }
            })
          );
        }
      })()
    );
  },

  async scheduled(event: any, env: Bindings, ctx: any): Promise<void> {
    ctx.waitUntil(handleCronTrigger(event.cron, env));
  },
};
