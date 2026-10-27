import { createClient } from "redis";
import env from "./env.js";

export const redisClient = createClient({
  url: env.REDIS_URL,
  socket: {
    reconnectStrategy(retries) {
      return Math.min(retries * 500, 5000);
    },
  },
});

redisClient.on("error", (error) => {
  console.error("Redis connection error:", error.message);
});

redisClient.on("connect", () => {
  console.log("Connecting to Redis...");
});

redisClient.on("ready", () => {
  console.log("Redis connection established successfully.");
});

redisClient.on("reconnecting", () => {
  console.log("Reconnecting to Redis...");
});

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient.isOpen) {
    await redisClient.quit();
  }
};
