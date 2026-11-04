import { redis } from "@/lib/redis";

export function getArtworkLockKey(artworkId: string): string {
  return `lock:artwork:${artworkId}`;
}

export interface AcquireLockResult {
  success: boolean;
  lockedByOther?: boolean;
  ttl?: number;
  fallback?: boolean;
  message?: string;
}

export interface ReleaseLockResult {
  success: boolean;
  released?: boolean;
  fallback?: boolean;
  message?: string;
}

export interface LockStatusResult {
  isLocked: boolean;
  lockedBy: string | null;
  ttl: number;
}

// Atomic release Lua script: deletes key only if the value equals the expected sessionId
const RELEASE_LOCK_LUA = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

/**
 * Acquires a distributed lock on an artwork for a designated duration (default: 600s / 10 minutes).
 * If already owned by the requesting session, the lock's expiration is extended.
 * If owned by another session, acquisition fails with the remaining TTL.
 * If Redis is unavailable or unconfigured, gracefully returns { success: true, fallback: true }.
 */
export async function acquireArtworkLock(
  artworkId: string,
  sessionId: string,
  durationSeconds: number = 600
): Promise<AcquireLockResult> {
  if (!redis) {
    return {
      success: true,
      fallback: true,
      message: "Redis not configured. Operating in fallback mode.",
    };
  }

  const key = getArtworkLockKey(artworkId);

  try {
    // Attempt atomic NX acquisition
    const acquired = await redis.set(key, sessionId, {
      nx: true,
      ex: durationSeconds,
    });

    if (acquired === "OK" || acquired) {
      return { success: true, ttl: durationSeconds };
    }

    // Key exists: check current holder
    const currentHolder = await redis.get<string>(key);

    if (currentHolder === sessionId) {
      // Re-entrant / renew lock for this session
      await redis.expire(key, durationSeconds);
      return {
        success: true,
        ttl: durationSeconds,
        message: "Lock renewed for active session.",
      };
    }

    // Locked by another customer
    const ttl = await redis.ttl(key);
    return {
      success: false,
      lockedByOther: true,
      ttl: ttl > 0 ? ttl : durationSeconds,
      message: "Artwork is currently reserved by another customer.",
    };
  } catch (error) {
    console.error(`[Redis Lock Error] Failed to acquire lock for artwork "${artworkId}":`, error);
    return {
      success: true,
      fallback: true,
      message: "Redis error during lock acquisition. Gracefully allowing checkout.",
    };
  }
}

/**
 * Releases an artwork lock atomically only if owned by the calling session.
 * If Redis is unreachable, returns fallback success.
 */
export async function releaseArtworkLock(
  artworkId: string,
  sessionId: string
): Promise<ReleaseLockResult> {
  if (!redis) {
    return {
      success: true,
      released: true,
      fallback: true,
      message: "Redis not configured.",
    };
  }

  const key = getArtworkLockKey(artworkId);

  try {
    const result = (await redis.eval(
      RELEASE_LOCK_LUA,
      [key],
      [sessionId]
    )) as number;

    const released = result === 1;
    return {
      success: true,
      released,
      message: released
        ? "Lock released successfully."
        : "Lock not found or held by another session.",
    };
  } catch (error) {
    console.error(`[Redis Lock Error] Failed to release lock for artwork "${artworkId}":`, error);
    return {
      success: true,
      released: false,
      fallback: true,
      message: "Redis error during lock release.",
    };
  }
}

/**
 * Retrieves the current lock status and remaining TTL for an artwork.
 */
export async function getArtworkLockStatus(
  artworkId: string
): Promise<LockStatusResult> {
  if (!redis) {
    return { isLocked: false, lockedBy: null, ttl: 0 };
  }

  const key = getArtworkLockKey(artworkId);

  try {
    const lockedBy = await redis.get<string>(key);
    if (!lockedBy) {
      return { isLocked: false, lockedBy: null, ttl: 0 };
    }

    const ttl = await redis.ttl(key);
    return {
      isLocked: true,
      lockedBy,
      ttl: ttl > 0 ? ttl : 0,
    };
  } catch (error) {
    console.error(`[Redis Lock Error] Failed to get lock status for artwork "${artworkId}":`, error);
    return { isLocked: false, lockedBy: null, ttl: 0 };
  }
}
