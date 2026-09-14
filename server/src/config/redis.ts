import { Redis } from "ioredis";
import env from "./env.js";
import logger from "../utils/logger.js";

const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
});

redis.on("connect", () => {
    logger.info("Redis connection established");
});

redis.on("ready", () => {
    logger.info("Redis is ready");
});

redis.on("error", (error: Error) => {
    logger.error("Redis connection error", { error });
});

redis.on("close", () => {
    logger.warn("Redis connection closed");
});

export const connectRedis = async (): Promise<void> => {
    if (redis.status === "ready" || redis.status === "connecting") {
        return;
    }

    await redis.connect();
};

export const disconnectRedis = async (): Promise<void> => {
    if (redis.status === "end") {
        return;
    }

    await redis.quit();
};

export default redis;