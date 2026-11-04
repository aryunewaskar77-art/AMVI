"use server";

import {
  acquireArtworkLock,
  releaseArtworkLock,
  getArtworkLockStatus,
  type AcquireLockResult,
  type ReleaseLockResult,
  type LockStatusResult,
} from "@/lib/locks";

/**
 * Server Action to reserve an artwork for 10 minutes (600 seconds)
 * during customer cart / checkout review.
 */
export async function reserveArtworkAction(
  artworkId: string,
  sessionId: string
): Promise<AcquireLockResult> {
  if (!artworkId || !sessionId) {
    return {
      success: false,
      message: "Both artworkId and sessionId are required to reserve an artwork.",
    };
  }

  return await acquireArtworkLock(artworkId, sessionId, 600);
}

/**
 * Server Action to release a reserved artwork lock when removed from cart
 * or when the checkout window expires.
 */
export async function releaseArtworkAction(
  artworkId: string,
  sessionId: string
): Promise<ReleaseLockResult> {
  if (!artworkId || !sessionId) {
    return {
      success: false,
      message: "Both artworkId and sessionId are required to release an artwork.",
    };
  }

  return await releaseArtworkLock(artworkId, sessionId);
}

/**
 * Server Action to query whether an artwork is currently locked and check remaining TTL.
 */
export async function getArtworkLockStatusAction(
  artworkId: string
): Promise<LockStatusResult> {
  if (!artworkId) {
    return { isLocked: false, lockedBy: null, ttl: 0 };
  }

  return await getArtworkLockStatus(artworkId);
}
