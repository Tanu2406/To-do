import { createClient } from "redis";

const REDIS_RETRY_DELAY_MS = 500;
const REDIS_MAX_RETRY_DELAY_MS = 3000;

export const REDIS_TTL_SECONDS = Number.parseInt(
  process.env.REDIS_TTL_SECONDS || "60",
  10
);

export const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number.parseInt(process.env.REDIS_PORT || "6379", 10),
    reconnectStrategy(retries) {
      if (retries > 20) return new Error("Redis reconnect attempts exhausted.");
      return Math.min(RETRIES_BACKOFF(retries), REDIS_MAX_RETRY_DELAY_MS);
    },
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

let hasConnected = false;

redisClient.on("error", (error) => {
  if (!hasConnected || error.code !== "ECONNRESET") {
    console.warn("Redis unavailable; continuing without cache.", error.message);
  }
});

redisClient.on("ready", () => {
  hasConnected = true;
});

export async function connectRedis(): Promise<void> {
  if (redisClient.isOpen) return;

  try {
    await redisClient.connect();
    console.log("Redis connected successfully");
  } catch (error) {
    console.warn(
      "Redis connection failed; the API will continue without caching.",
      error instanceof Error ? error.message : String(error)
    );
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient.isOpen) await redisClient.disconnect();
}

function RETRIES_BACKOFF(retries: number): number {
  return Math.min(REDIS_RETRY_DELAY_MS * 2 ** retries, REDIS_MAX_RETRY_DELAY_MS);
}
