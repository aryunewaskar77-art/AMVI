import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

/**
 * Checkout rate limiter enforcing sliding window of 5 requests per 60 seconds.
 * Returns null if Redis is not configured, allowing grace-mode operation in development/test.
 */
export const checkoutRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "60 s"),
      analytics: true,
      prefix: "amvi:ratelimit:checkout",
    })
  : null;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Verifies rate limits for checkout actions.
 * Safely defaults to allowed if rate limiting infrastructure is unavailable.
 *
 * @param identifier Unique identifier for the client (e.g. IP address, customer email, or user ID)
 */
export async function checkCheckoutRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  if (!checkoutRateLimiter) {
    return {
      success: true,
      limit: 5,
      remaining: 5,
      reset: Date.now() + 60_000,
    };
  }

  try {
    const result = await checkoutRateLimiter.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error("[RateLimit Error] Checkout limiter failed, bypassing limit check:", error);
    return {
      success: true,
      limit: 5,
      remaining: 1,
      reset: Date.now() + 60_000,
    };
  }
}
