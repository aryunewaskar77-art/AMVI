import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

let redisInstance: Redis | null = null;

if (redisUrl && redisToken) {
  redisInstance = new Redis({
    url: redisUrl,
    token: redisToken,
  });
} else {
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[Upstash Redis] Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN. Redis caching is disabled."
    );
  }
}

export const redis = redisInstance;

/**
 * Resilient Cache-Aside helper with automatic fallback to Supabase / primary data source.
 * Handles cache hits, cache misses, and network or service degradation gracefully.
 *
 * @param key Redis cache key
 * @param fetcher Async function retrieving data from the primary source on cache miss or Redis error
 * @param ttlSeconds Optional time-to-live in seconds for newly cached entries
 */
export async function getOrSetCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  if (!redis) {
    return fetcher();
  }

  try {
    const cachedData = await redis.get<T>(key);
    if (cachedData !== null && cachedData !== undefined) {
      return cachedData;
    }
  } catch (error) {
    console.error(`[Redis Cache Error] Failed to read key "${key}":`, error);
  }

  const freshData = await fetcher();

  if (freshData !== null && freshData !== undefined) {
    try {
      await redis.set(key, freshData, { ex: ttlSeconds });
    } catch (error) {
      console.error(`[Redis Cache Error] Failed to write key "${key}":`, error);
    }
  }

  return freshData;
}
