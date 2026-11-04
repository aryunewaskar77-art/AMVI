import { redis } from "@/lib/redis";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLocalArtworks } from "@/lib/artworks-local-store";
import type { Artwork } from "@/types/database.types";

export const ALL_ARTWORKS_CACHE_KEY = "artworks:catalog:all";
export const ALL_ARTWORKS_CACHE_TTL = 3600; // 1 hour
export const ARTWORK_ITEM_CACHE_TTL = 1800; // 30 minutes

export function getArtworkItemCacheKey(id: string): string {
  return `artworks:item:${id}`;
}

/**
 * Fetches all available artworks.
 * Prioritizes local persistent store (which guarantees newly published artworks are immediately present),
 * and complements with Supabase data when connected.
 */
export async function getAvailableArtworks(): Promise<Artwork[]> {
  // 1. Check local persistent store first for immediate consistency
  try {
    const localPieces = getLocalArtworks().filter((a) => a.is_available);
    if (localPieces && localPieces.length > 0) {
      return localPieces;
    }
  } catch (localErr) {
    console.warn("[getAvailableArtworks localStore warning]:", localErr);
  }

  // 2. Fallback to Supabase if local store had no pieces
  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("artworks")
      .select("*")
      .eq("is_available", true)
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return data as Artwork[];
    }
  } catch (adminErr) {
    console.warn("[getAvailableArtworks adminClient fallback]:", adminErr);
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("artworks")
      .select("*")
      .eq("is_available", true)
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return data as Artwork[];
    }
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest === "DYNAMIC_SERVER_USAGE") {
      throw err;
    }
    console.error("[Data Fetch Error] getAvailableArtworks Supabase query failed:", err);
  }

  return [];
}

/**
 * Fetches all artworks (both available and unavailable) for administrative management.
 */
export async function getAllArtworksForAdmin(): Promise<Artwork[]> {
  try {
    const localList = getLocalArtworks();
    if (localList && localList.length > 0) {
      return localList;
    }
  } catch (localErr) {
    console.warn("[getAllArtworksForAdmin local error]:", localErr);
  }

  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("artworks")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return data as Artwork[];
    }
  } catch (adminErr) {
    console.warn("[getAllArtworksForAdmin adminClient fallback]:", adminErr);
  }

  return [];
}



/**
 * Fetches an individual artwork by ID using Cache-Aside strategy.
 * Priority: Redis -> Supabase -> warm Redis.
 * Resilient fallback: If Redis is unavailable or unconfigured, queries Supabase directly.
 */
export async function getArtworkById(id: string): Promise<Artwork | null> {
  // 1. Check local persistent store first
  try {
    const found = getLocalArtworks().find((a) => a.id === id);
    if (found) {
      return found;
    }
  } catch (localErr) {
    console.warn("[getArtworkById localStore warning]:", localErr);
  }

  const cacheKey = getArtworkItemCacheKey(id);


  if (redis) {
    try {
      const cached = await redis.get<Artwork>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (error: unknown) {
      if ((error as { digest?: string })?.digest === "DYNAMIC_SERVER_USAGE") {
        throw error;
      }
      console.error(
        `[Redis Cache Error] getArtworkById cache read failed for "${id}":`,
        error
      );
    }
  }

  // Query with elevated admin client first
  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("artworks")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!error && data) {
      const artwork = data as Artwork;
      if (redis && artwork) {
        try {
          await redis.set(cacheKey, artwork, { ex: ARTWORK_ITEM_CACHE_TTL });
        } catch {
          // Ignore cache set warnings
        }
      }
      return artwork;
    }
  } catch (adminErr) {
    console.warn("[getArtworkById adminClient fallback]:", adminErr);
  }

  // Fallback to standard Supabase Server Client
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("artworks")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!error && data) {
      const artwork = data as unknown as Artwork;
      if (redis && artwork) {
        try {
          await redis.set(cacheKey, artwork, { ex: ARTWORK_ITEM_CACHE_TTL });
        } catch {
          // Ignore cache set warnings
        }
      }
      return artwork;
    }
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest === "DYNAMIC_SERVER_USAGE") {
      throw err;
    }
    console.error(`[Data Fetch Error] getArtworkById completely failed for "${id}":`, err);
  }

  // Tertiary fallback: Read from persistent local file store
  try {
    const { getLocalArtworks } = await import("@/lib/artworks-local-store");
    const found = getLocalArtworks().find((a) => a.id === id) || null;
    return found;
  } catch {
    return null;
  }
}

