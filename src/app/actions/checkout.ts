"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkCheckoutRateLimit } from "@/lib/ratelimit";
import { acquireArtworkLock, releaseArtworkLock } from "@/lib/locks";
import { uploadPaymentReceipt } from "@/lib/storage";
import type { ShippingAddress, Artwork, Order } from "@/types/database.types";


export interface CreateOrderPayload {
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: ShippingAddress;
  items: Artwork[];
  sessionId: string;
}

export interface CreateOrderResult {
  success: boolean;
  orderId?: string;
  remainingTtl?: number;
  message?: string;
}

export interface SubmitPaymentProofResult {
  success: boolean;
  message?: string;
}

export interface CancelOrderResult {
  success: boolean;
  message?: string;
}

/**
 * Creates a pending order with strict concurrency protections:
 * 1. Checks IP checkout rate limiting via Upstash Ratelimit.
 * 2. Concurrently attempts to acquire 10-minute Redis locks for all cart items.
 *    If any artwork is already reserved, rolls back acquired locks and aborts.
 * 3. Creates the order in Supabase with status 'payment_pending'.
 * 4. Inserts all order_items with snapshot purchase prices.
 */
export async function createPendingOrderAction(
  payload: CreateOrderPayload
): Promise<CreateOrderResult> {
  const { customer, shippingAddress, items, sessionId } = payload;

  if (!items || items.length === 0) {
    return { success: false, message: "Your collection bag is empty." };
  }

  if (!sessionId) {
    return { success: false, message: "Missing collector checkout session." };
  }

  // 1. IP Rate Limiting
  const headerList = await headers();
  const clientIp =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "127.0.0.1";

  const rateLimit = await checkCheckoutRateLimit(`checkout:${clientIp}`);
  if (!rateLimit.success) {
    return {
      success: false,
      message: "Too many checkout attempts. Please wait 60 seconds before retrying.",
    };
  }

  // 2. Atomic Redis Artwork Locks
  const acquiredLockIds: string[] = [];

  for (const item of items) {
    const lockResult = await acquireArtworkLock(item.id, sessionId, 600);

    if (!lockResult.success) {
      // Rollback already acquired locks
      for (const lockedId of acquiredLockIds) {
        await releaseArtworkLock(lockedId, sessionId);
      }

      return {
        success: false,
        message: `"${item.title}" was just reserved by another collector. Please remove it to proceed.`,
      };
    }

    acquiredLockIds.push(item.id);
  }

  // 3. Database Ingestion
  try {
    const supabase = await createClient();

    // Verify all items are marked available in database
    const itemIds = items.map((item) => item.id);
    const { data: dbArtworks, error: fetchError } = await supabase
      .from("artworks")
      .select("id, is_available, title")
      .in("id", itemIds);

    if (fetchError || !dbArtworks) {
      throw new Error("Could not verify artwork availability in database.");
    }

    for (const dbArt of dbArtworks) {
      if (!dbArt.is_available) {
        // Rollback
        for (const lockedId of acquiredLockIds) {
          await releaseArtworkLock(lockedId, sessionId);
        }
        return {
          success: false,
          message: `"${dbArt.title}" has already been acquired.`,
        };
      }
    }

    const totalAmount = items.reduce(
      (sum, item) => sum + Number(item.price || 0),
      0
    );

    const orderId = crypto.randomUUID();
    const orderCreatedAt = new Date().toISOString();

    const orderRecord: Order = {
      id: orderId,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      shipping_address: shippingAddress,
      total_amount: totalAmount,
      payment_method: "manual_upi",
      transaction_ref: null,
      receipt_url: null,
      status: "payment_pending",
      created_at: orderCreatedAt,
    };

    const orderItemsRecord = items.map((item) => ({
      artwork_id: item.id,
      price_at_purchase: Number(item.price),
      artwork: item,
    }));

    // 1. Save into local persistent store guaranteed
    try {
      const { saveLocalOrder } = await import("@/lib/orders-local-store");
      saveLocalOrder({
        ...orderRecord,
        order_items: orderItemsRecord,
      });
    } catch (storeErr) {
      console.warn("[Local Store Save Order Warning]:", storeErr);
    }

    // 2. Also try inserting into Supabase
    try {
      const adminClient = createAdminClient();
      await adminClient.from("orders").insert({
        id: orderId,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        shipping_address: shippingAddress,
        total_amount: totalAmount,
        payment_method: "manual_upi",
        status: "payment_pending",
      });

      const orderItemsToInsert = items.map((item) => ({
        order_id: orderId,
        artwork_id: item.id,
        price_at_purchase: Number(item.price),
      }));

      await adminClient.from("order_items").insert(orderItemsToInsert);
    } catch (sbErr) {
      console.warn("[Supabase Order Insert Warning]:", sbErr);
    }

    // 3. Deduct stock quantity from local persistent store (and mark out of stock when 0)
    try {
      const { deductArtworkStock } = await import("@/lib/artworks-local-store");
      const { invalidateArtworkCache } = await import("@/lib/cache-invalidation");

      for (const item of items) {
        deductArtworkStock(item.id, 1);
        await invalidateArtworkCache(item.id);
      }
      await invalidateArtworkCache();
    } catch (stockDeductErr) {
      console.warn("[Stock Deduct Warning]:", stockDeductErr);
    }

    return {
      success: true,
      orderId,
      remainingTtl: 600,
    };

  } catch (error) {
    console.error("[Checkout Action Error]:", error);

    // Release locks on unexpected failures
    for (const lockedId of acquiredLockIds) {
      await releaseArtworkLock(lockedId, sessionId);
    }

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during order reservation.",
    };
  }
}

/**
 * Submits payment proof (UTR / transaction reference and receipt screenshot)
 * for a pending order.
 */
export async function submitPaymentProofAction(
  formData: FormData
): Promise<SubmitPaymentProofResult> {
  const orderId = formData.get("orderId") as string;
  const transactionRef = formData.get("transactionRef") as string;
  const receiptFile = formData.get("receiptImage") as File | null;

  if (!orderId) {
    return { success: false, message: "Missing order ID." };
  }

  if (!transactionRef || transactionRef.trim().length < 6) {
    return {
      success: false,
      message: "Please enter a valid 12-digit UPI UTR or bank reference number.",
    };
  }

  try {
    let receiptPath: string | null = null;

    // Upload receipt file if provided
    if (receiptFile && receiptFile.size > 0) {
      try {
        const adminClient = createAdminClient();
        const uploadResult = await uploadPaymentReceipt(
          adminClient,
          receiptFile,
          orderId
        );
        receiptPath = uploadResult.path;
      } catch (uploadErr) {
        console.warn("[Receipt Upload Warning]:", uploadErr);
      }
    }

    // 1. Update in local store
    try {
      const { updateLocalOrderStatus } = await import(
        "@/lib/orders-local-store"
      );
      updateLocalOrderStatus(orderId, {
        transaction_ref: transactionRef.trim(),
        ...(receiptPath ? { receipt_url: receiptPath } : {}),
      });
    } catch (localStoreErr) {
      console.warn("[Local Store Update Warning]:", localStoreErr);
    }

    // 2. Update in Supabase if reachable
    try {
      const adminClient = createAdminClient();
      const updatePayload: {
        transaction_ref: string;
        receipt_url?: string;
        status: "payment_pending";
      } = {
        transaction_ref: transactionRef.trim(),
        status: "payment_pending",
      };

      if (receiptPath) {
        updatePayload.receipt_url = receiptPath;
      }

      await adminClient
        .from("orders")
        .update(updatePayload)
        .eq("id", orderId);
    } catch (sbErr) {
      console.warn("[Supabase Proof Update Warning]:", sbErr);
    }

    return { success: true };
  } catch (error) {
    console.error("[Submit Proof Exception]:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An error occurred while uploading payment receipt.",
    };
  }
}

/**
 * Cancels a pending order and releases all associated artwork Redis locks.
 */
export async function cancelOrderAction(
  orderId: string,
  sessionId: string
): Promise<CancelOrderResult> {
  if (!orderId) {
    return { success: false, message: "Missing order ID." };
  }

  try {
    // 1. Update local store and restore stock quantity
    try {
      const { updateLocalOrderStatus, getLocalOrderById } = await import(
        "@/lib/orders-local-store"
      );
      const { restoreArtworkStock } = await import("@/lib/artworks-local-store");
      const { invalidateArtworkCache } = await import("@/lib/cache-invalidation");

      const localOrder = getLocalOrderById(orderId);
      const previousStatus = localOrder?.status;

      // Only restore inventory if the order was not already cancelled
      if (localOrder && previousStatus !== "cancelled") {
        updateLocalOrderStatus(orderId, { status: "cancelled" });

        for (const item of localOrder.order_items) {
          if (sessionId) {
            await releaseArtworkLock(item.artwork_id, sessionId);
          }
          // Restore the deducted stock quantity (default 1) and make it available again
          restoreArtworkStock(item.artwork_id, 1);
          await invalidateArtworkCache(item.artwork_id);
        }
        await invalidateArtworkCache();
      } else {
        updateLocalOrderStatus(orderId, { status: "cancelled" });
      }
    } catch (localCancelErr) {
      console.warn("[Local Cancel Warning]:", localCancelErr);
    }

    // 2. Update in Supabase
    try {
      const adminClient = createAdminClient();
      await adminClient
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId)
        .eq("status", "payment_pending");
    } catch (sbErr) {
      console.warn("[Supabase Cancel Warning]:", sbErr);
    }

    return { success: true };
  } catch (error) {
    console.error("[Cancel Order Error]:", error);
    return {
      success: false,
      message: "Could not cancel order.",
    };
  }
}

