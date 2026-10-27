import { redisClient } from "../config/redis.js";

const DEFAULT_TTL = 60;

export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    const value = await redisClient.get(key);

    if (!value) return null;

    return JSON.parse(value) as T;
  } catch (error) {
    console.error("Redis cache read failed:", error);
    return null;
  }
};

export const setCache = async <T>(
  key: string,
  data: T,
  ttl: number = DEFAULT_TTL,
): Promise<void> => {
  try {
    await redisClient.set(key, JSON.stringify(data), {
      EX: ttl,
    });
  } catch (error) {
    console.error("Redis cache write failed:", error);
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error("Redis cache deletion failed:", error);
  }
};
