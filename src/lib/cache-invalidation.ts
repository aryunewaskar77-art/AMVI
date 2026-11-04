import { revalidatePath } from "next/cache";
import { redis } from "@/lib/redis";
import {
  ALL_ARTWORKS_CACHE_KEY,
  getArtworkItemCacheKey,
} from "@/lib/artworks";

/**
 * Invalidates the entire public catalog cache in Redis and triggers Next.js path revalidation.
 */
export async function invalidateCatalogCache(): Promise<void> {
  if (redis) {
    try {
      await redis.del(ALL_ARTWORKS_CACHE_KEY);
    } catch (error) {
      console.error("[Cache Invalidation Error] Failed to purge catalog cache:", error);
    }
  }

  try {
    revalidatePath("/artworks");
    revalidatePath("/");
  } catch (error) {
    // revalidatePath might be called outside Next.js request context (e.g. standalone script)
    console.warn("[Revalidate Warning] revalidatePath skipped or outside request context:", error);
  }
}

/**
 * Invalidates the catalog cache and optionally an individual artwork item cache in Redis,
 * followed by Next.js path revalidation for catalog and item pages.
 *
 * @param artworkId Optional ID of the artwork to invalidate
 */
export async function invalidateArtworkCache(artworkId?: string): Promise<void> {
  if (redis) {
    try {
      const keysToDelete = [ALL_ARTWORKS_CACHE_KEY];
      if (artworkId) {
        keysToDelete.push(getArtworkItemCacheKey(artworkId));
      }
      await redis.del(...keysToDelete);
    } catch (error) {
      console.error(
        `[Cache Invalidation Error] Failed to delete cache keys for artwork "${artworkId}":`,
        error
      );
    }
  }

  try {
    revalidatePath("/artworks");
    revalidatePath("/");
    if (artworkId) {
      revalidatePath(`/artworks/${artworkId}`);
    }
  } catch (error) {
    console.warn("[Revalidate Warning] revalidatePath skipped or outside request context:", error);
  }
}
