"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { redis } from "@/lib/redis";
import { getArtworkLockKey } from "@/lib/locks";
import { getArtworkPublicUrl, getReceiptSignedUrl, ARTWORKS_BUCKET } from "@/lib/storage";
import { invalidateArtworkCache } from "@/lib/cache-invalidation";
import type { Order, Artwork, OrderStatus } from "@/types/database.types";

export interface AdminOrderItem {
  artwork_id: string;
  price_at_purchase: number;
  artwork: Artwork | null;
}

export interface AdminOrderWithDetails extends Order {
  signedReceiptUrl?: string | null;
  order_items: AdminOrderItem[];
}

export interface AdminActionResult {
  success: boolean;
  message?: string;
}

/**
 * Retrieves all orders with associated artworks and 15-minute signed receipt URLs.
 */
export async function getAdminOrdersAction(
  statusFilter?: string
): Promise<AdminOrderWithDetails[]> {
  const mergedOrdersMap = new Map<string, AdminOrderWithDetails>();

  // 1. First populate with guaranteed persistent local orders
  try {
    const { getLocalOrders } = await import("@/lib/orders-local-store");
    const localList = getLocalOrders();
    for (const o of localList) {
      mergedOrdersMap.set(o.id, o);
    }
  } catch (localErr) {
    console.warn("[Admin Orders local store initial read]:", localErr);
  }

  // 2. Also query Supabase if reachable and merge
  try {
    const adminClient = createAdminClient();

    let query = adminClient
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter as OrderStatus);
    }

    const { data: orders, error: ordersError } = await query;
    if (!ordersError && orders && orders.length > 0) {
      const orderIds = orders.map((o) => o.id);

      // Fetch order items with artworks
      const { data: rawOrderItems } = await adminClient
        .from("order_items")
        .select("order_id, artwork_id, price_at_purchase")
        .in("order_id", orderIds);

    const artworkIds = Array.from(
      new Set((rawOrderItems || []).map((i) => i.artwork_id))
    );

    const { data: rawArtworks } = await adminClient
      .from("artworks")
      .select("*")
      .in("id", artworkIds);

    const artworkMap = new Map<string, Artwork>();
    for (const art of rawArtworks || []) {
      artworkMap.set(art.id, art);
    }

    // Map order items to orders
    const itemsByOrderId = new Map<string, AdminOrderItem[]>();
    for (const item of rawOrderItems || []) {
      const current = itemsByOrderId.get(item.order_id) || [];
      current.push({
        artwork_id: item.artwork_id,
        price_at_purchase: Number(item.price_at_purchase),
        artwork: artworkMap.get(item.artwork_id) || null,
      });
      itemsByOrderId.set(item.order_id, current);
    }

    // Generate signed receipt URLs (15 minutes / 900 seconds)
    const enrichedOrders: AdminOrderWithDetails[] = await Promise.all(
      orders.map(async (order) => {
        let signedReceiptUrl: string | null = null;
        if (order.receipt_url) {
          try {
            signedReceiptUrl = await getReceiptSignedUrl(
              adminClient,
              order.receipt_url,
              900
            );
          } catch (e) {
            console.error(`[Admin Receipt URL Error] Order ${order.id}:`, e);
          }
        }

        return {
          ...order,
          signedReceiptUrl,
          order_items: itemsByOrderId.get(order.id) || [],
        };
      })
    );

    for (const rOrder of enrichedOrders) {
      mergedOrdersMap.set(rOrder.id, rOrder);
    }
  }
  } catch (error) {
    console.warn("[getAdminOrdersAction Remote fetch fallback]:", error);
  }

  let finalOrders = Array.from(mergedOrdersMap.values());
  if (statusFilter && statusFilter !== "all") {
    finalOrders = finalOrders.filter((o) => o.status === statusFilter);
  }

  return finalOrders.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}


/**
 * Manually verifies UTR payment for an order:
 * 1. Sets orders.status = 'verified'.
 * 2. Marks corresponding artworks as is_available = false (permanently acquired).
 * 3. Atomically removes Redis locks for the artwork items.
 * 4. Invalidates Redis catalog cache and Next.js paths.
 */
export async function verifyOrderPaymentAction(
  orderId: string
): Promise<AdminActionResult> {
  if (!orderId) {
    return { success: false, message: "Missing order ID." };
  }

  try {
    let artworkIds: string[] = [];


    // 1. Get associated artwork IDs from local store or Supabase
    try {
      const { getLocalOrderById } = await import("@/lib/orders-local-store");
      const localOrder = getLocalOrderById(orderId);
      if (localOrder) {
        artworkIds = localOrder.order_items.map((i) => i.artwork_id);
      }
    } catch (e) {
      console.warn("[Local Order Lookup Warning]:", e);
    }

    if (artworkIds.length === 0) {
      const adminClient = createAdminClient();
      const { data: orderItems } = await adminClient
        .from("order_items")
        .select("artwork_id")
        .eq("order_id", orderId);

      if (orderItems && orderItems.length > 0) {
        artworkIds = orderItems.map((item) => item.artwork_id);
      }
    }

    // 2. Mark order verified in local store
    try {
      const { updateLocalOrderStatus } = await import("@/lib/orders-local-store");
      updateLocalOrderStatus(orderId, { status: "verified" });
    } catch (e) {
      console.warn("[Local Store Verify Warning]:", e);
    }

    // 3. Mark artworks unavailable in local store
    try {
      const { updateLocalArtworkAvailability } = await import(
        "@/lib/artworks-local-store"
      );
      for (const artId of artworkIds) {
        updateLocalArtworkAvailability(artId, false);
      }
    } catch (e) {
      console.warn("[Local Store Artwork Availability Warning]:", e);
    }

    // 4. Update in Supabase if reachable
    try {
      const adminClient = createAdminClient();
      await adminClient
        .from("orders")
        .update({ status: "verified" })
        .eq("id", orderId);

      if (artworkIds.length > 0) {
        await adminClient
          .from("artworks")
          .update({ is_available: false })
          .in("id", artworkIds);
      }
    } catch (sbErr) {
      console.warn("[Supabase Verify Warning]:", sbErr);
    }

    // 5. Delete Redis locks
    if (redis && artworkIds.length > 0) {
      try {
        const lockKeys = artworkIds.map((id) => getArtworkLockKey(id));
        await redis.del(...lockKeys);
      } catch (lockError) {
        console.error("[Redis Lock Removal Error]:", lockError);
      }
    }

    // 6. Invalidate caches
    await invalidateArtworkCache();
    for (const artId of artworkIds) {
      await invalidateArtworkCache(artId);
    }

    try {
      revalidatePath("/admin");
      revalidatePath(`/orders/${orderId}`);
      revalidatePath("/");
      revalidatePath("/artworks");
    } catch (e) {
      console.warn("[Revalidate Warning]:", e);
    }

    return { success: true };
  } catch (error) {
    console.error("[verifyOrderPaymentAction Exception]:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to verify order payment.",
    };
  }
}

/**
 * Rejects an order, marks it cancelled, and removes active Redis locks
 * so artworks become immediately available to other collectors.
 */
export async function rejectOrderPaymentAction(
  orderId: string,
  reason?: string
): Promise<AdminActionResult> {
  if (!orderId) {
    return { success: false, message: "Missing order ID." };
  }

  try {
    let artworkIds: string[] = [];

    // 1. Get order details and previous status
    let previousStatus: string | undefined;
    try {
      const { getLocalOrderById } = await import("@/lib/orders-local-store");
      const localOrder = getLocalOrderById(orderId);
      if (localOrder) {
        previousStatus = localOrder.status;
        artworkIds = localOrder.order_items.map((i) => i.artwork_id);
      }
    } catch (e) {
      console.warn("[Local Order Lookup Warning]:", e);
    }

    // 2. Mark order cancelled and restore artwork quantity in local store
    try {
      const { updateLocalOrderStatus } = await import("@/lib/orders-local-store");
      const { restoreArtworkStock } = await import("@/lib/artworks-local-store");

      updateLocalOrderStatus(orderId, { status: "cancelled" });

      // Restore stock quantity if the order wasn't already cancelled
      if (previousStatus !== "cancelled") {
        for (const artId of artworkIds) {
          restoreArtworkStock(artId, 1);
        }
      }
    } catch (e) {
      console.warn("[Local Store Cancel/Restore Warning]:", e);
    }

    // 3. Update Supabase if reachable
    try {
      const adminClient = createAdminClient();
      await adminClient
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId);
    } catch (sbErr) {
      console.warn("[Supabase Reject Warning]:", sbErr);
    }

    // 4. Delete Redis locks
    if (redis && artworkIds.length > 0) {
      try {
        const lockKeys = artworkIds.map((item) => getArtworkLockKey(item));
        await redis.del(...lockKeys);
      } catch (lockError) {
        console.error("[Redis Lock Removal Error]:", lockError);
      }
    }

    await invalidateArtworkCache();

    try {
      revalidatePath("/admin");
      revalidatePath(`/orders/${orderId}`);
    } catch (e) {
      console.warn("[Revalidate Warning]:", e);
    }

    return { success: true, message: reason ? `Rejected: ${reason}` : undefined };
  } catch (error) {
    console.error("[rejectOrderPaymentAction Exception]:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to reject order.",
    };
  }
}

/**
 * Updates order delivery status (dispatched, out_for_delivery, delivered)
 * and records fulfillment details (courier partner, tracking number, timestamps).
 */
export async function updateOrderDeliveryStatusAction(
  orderId: string,
  newStatus: OrderStatus,
  trackingDetails?: {
    carrier?: string;
    tracking_number?: string;
    estimated_delivery?: string;
  }
): Promise<AdminActionResult> {
  if (!orderId) {
    return { success: false, message: "Missing order ID." };
  }

  try {
    const nowIso = new Date().toISOString();

    // 1. Update in local store
    try {
      const { getLocalOrderById, updateLocalOrderStatus } = await import(
        "@/lib/orders-local-store"
      );
      const existing = getLocalOrderById(orderId);
      const prevTracking = existing?.tracking_details || {};

      const mergedTracking = {
        ...prevTracking,
        ...trackingDetails,
        ...(newStatus === "dispatched" && !prevTracking.dispatched_at
          ? { dispatched_at: nowIso }
          : {}),
        ...(newStatus === "out_for_delivery"
          ? { out_for_delivery_at: nowIso }
          : {}),
        ...(newStatus === "delivered" ? { delivered_at: nowIso } : {}),
      };

      updateLocalOrderStatus(orderId, {
        status: newStatus,
        tracking_details: mergedTracking,
      });
    } catch (e) {
      console.warn("[Local Store Delivery Status Warning]:", e);
    }

    // 2. Update Supabase if reachable
    try {
      const adminClient = createAdminClient();
      await adminClient
        .from("orders")
        .update({
          status: newStatus,
        })
        .eq("id", orderId);
    } catch (sbErr) {
      console.warn("[Supabase Delivery Status Warning]:", sbErr);
    }

    try {
      revalidatePath("/admin");
      revalidatePath(`/orders/${orderId}`);
    } catch (e) {
      console.warn("[Revalidate Warning]:", e);
    }

    return {
      success: true,
      message: `Order status successfully updated to ${newStatus}.`,
    };
  } catch (error) {
    console.error("[updateOrderDeliveryStatusAction Exception]:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update delivery status.",
    };
  }
}

/**
 * Updates stock quantity for an artwork piece. Automatically marks available if quantity > 0
 * or out of stock if quantity is 0.
 */
export async function updateArtworkQuantityAction(
  artworkId: string,
  newQuantity: number
): Promise<AdminActionResult> {
  if (!artworkId) {
    return { success: false, message: "Missing artwork ID." };
  }

  const cleanQty = Math.max(0, Math.floor(newQuantity));

  try {
    // 1. Update in local store
    try {
      const { updateLocalArtworkQuantity } = await import(
        "@/lib/artworks-local-store"
      );
      updateLocalArtworkQuantity(artworkId, cleanQty);
    } catch (e) {
      console.warn("[Local Store Quantity Update Warning]:", e);
    }

    // 2. Update Supabase if reachable
    try {
      const adminClient = createAdminClient();
      await adminClient
        .from("artworks")
        .update({
          is_available: cleanQty > 0,
        })
        .eq("id", artworkId);
    } catch (sbErr) {
      console.warn("[Supabase Quantity Update Warning]:", sbErr);
    }

    // 3. Invalidate Redis & Next cache
    await invalidateArtworkCache(artworkId);
    await invalidateArtworkCache();

    try {
      revalidatePath("/admin");
      revalidatePath("/");
      revalidatePath("/artworks");
      revalidatePath(`/artworks/${artworkId}`);
    } catch (e) {
      console.warn("[Revalidate Warning]:", e);
    }

    return {
      success: true,
      message: `Stock updated to ${cleanQty} unit${cleanQty !== 1 ? "s" : ""}.`,
    };
  } catch (error) {
    console.error("[updateArtworkQuantityAction Exception]:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update artwork quantity.",
    };
  }
}


/**
 * Creates a new artwork piece:
 * 1. Attempts upload to public 'artworks' Supabase bucket.
 *    If Supabase is unreachable/fails, saves file into public/uploads and uses local URL.
 * 2. Attempts DB insert into Supabase artworks table.
 *    Always persists into artworks-local-store.ts so it never gets lost.
 * 3. Invalidates Redis catalog cache and revalidates Next.js paths.
 */
export async function createArtworkAction(
  formData: FormData
): Promise<AdminActionResult> {
  const title = (formData.get("title") as string)?.trim();
  const artistName = (formData.get("artist_name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const price = parseFloat(formData.get("price") as string);
  const rawQuantity = parseInt(formData.get("quantity") as string, 10);
  const quantity = !isNaN(rawQuantity) && rawQuantity > 0 ? rawQuantity : 1;
  const medium = (formData.get("medium") as string)?.trim();
  const dimensions = (formData.get("dimensions") as string)?.trim();
  const imageFile = formData.get("image") as File | null;

  if (!title || !artistName || isNaN(price) || price < 0 || !imageFile) {
    return {
      success: false,
      message: "Please fill in all required fields (title, artist, price, image).",
    };
  }

  try {
    const fileExt = imageFile.name.includes(".")
      ? imageFile.name.split(".").pop()?.toLowerCase()
      : "jpg";
    const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${fileExt}`;
    let publicUrl = "";

    // 1. Try Supabase Storage first
    let storageSucceeded = false;
    try {
      const adminClient = createAdminClient();
      const { error: uploadError } = await adminClient.storage
        .from(ARTWORKS_BUCKET)
        .upload(filename, imageFile, {
          contentType: imageFile.type || "image/jpeg",
          upsert: false,
        });

      if (!uploadError) {
        publicUrl = getArtworkPublicUrl(adminClient, filename);
        storageSucceeded = true;
      } else {
        console.warn("[Artwork Supabase Upload Warning]:", uploadError.message);
      }
    } catch (storageErr) {
      console.warn("[Artwork Supabase Upload Exception]:", storageErr);
    }

    // 2. Fallback to local public/uploads if Supabase storage failed
    if (!storageSucceeded || !publicUrl) {
      try {
        const fs = await import("fs");
        const path = await import("path");
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filePath = path.join(uploadDir, filename);
        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(filePath, buffer);
        publicUrl = `/uploads/${filename}`;
      } catch (localFileErr) {
        console.error("[Local File Save Error]:", localFileErr);
        return {
          success: false,
          message: `Could not save image file: ${
            localFileErr instanceof Error ? localFileErr.message : "Unknown error"
          }`,
        };
      }
    }

    const artworkRecord: Artwork = {
      id: crypto.randomUUID(),
      title,
      artist_name: artistName,
      description: description || "",
      price,
      medium: medium || "",
      dimensions: dimensions || "",
      image_url: publicUrl,
      quantity,
      total_stock: quantity,
      is_available: quantity > 0,
      created_at: new Date().toISOString(),
    };


    // 3. Save into local persistent store guaranteed
    try {
      const { saveLocalArtwork } = await import("@/lib/artworks-local-store");
      saveLocalArtwork(artworkRecord);
    } catch (storeErr) {
      console.warn("[Local Store Save Warning]:", storeErr);
    }

    // 4. Also insert into Supabase artworks table if accessible
    try {
      const adminClient = createAdminClient();
      await adminClient.from("artworks").insert({
        id: artworkRecord.id,
        title,
        artist_name: artistName,
        description: description || null,
        price,
        medium: medium || null,
        dimensions: dimensions || null,
        image_url: publicUrl,
        is_available: true,
      });
    } catch (dbErr) {
      console.warn("[Supabase Artwork Insert Warning]:", dbErr);
    }

    // 5. Invalidate catalog cache in Redis & revalidate paths
    await invalidateArtworkCache();

    try {
      revalidatePath("/admin");
      revalidatePath("/artworks");
      revalidatePath("/");
    } catch (e) {
      console.warn("[Revalidate Warning]:", e);
    }

    return { success: true };
  } catch (error) {
    console.error("[createArtworkAction Exception]:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create artwork.",
    };
  }
}

/**
 * Toggles the availability of an artwork piece and purges cache.
 */
export async function toggleArtworkAvailabilityAction(
  artworkId: string,
  isAvailable: boolean
): Promise<AdminActionResult> {
  if (!artworkId) {
    return { success: false, message: "Missing artwork ID." };
  }

  try {
    // 1. Update in local store
    try {
      const { updateLocalArtworkAvailability } = await import(
        "@/lib/artworks-local-store"
      );
      updateLocalArtworkAvailability(artworkId, isAvailable);
    } catch (localErr) {
      console.warn("[Local Store Update Warning]:", localErr);
    }

    // 2. Update in Supabase if accessible
    try {
      const adminClient = createAdminClient();
      await adminClient
        .from("artworks")
        .update({ is_available: isAvailable })
        .eq("id", artworkId);
    } catch (dbErr) {
      console.warn("[Supabase Toggle Warning]:", dbErr);
    }

    await invalidateArtworkCache(artworkId);

    try {
      revalidatePath("/admin");
      revalidatePath("/artworks");
      revalidatePath("/");
    } catch (e) {
      console.warn("[Revalidate Warning]:", e);
    }

    return { success: true };
  } catch (error) {
    console.error("[toggleArtworkAvailabilityAction Exception]:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Toggle action failed.",
    };
  }
}

/**
 * Permanently deletes an artwork piece from the catalog:
 * 1. Checks if the piece is referenced in orders (if so, marks unavailable rather than breaking history).
 * 2. Deletes artwork from artworks table & local store.
 * 3. Removes Redis locks and invalidates catalog caches.
 */
export async function deleteArtworkAction(
  artworkId: string
): Promise<AdminActionResult> {
  if (!artworkId) {
    return { success: false, message: "Missing artwork ID." };
  }

  try {
    let isReferenced = false;

    // Check if artwork has existing orders in Supabase
    try {
      const adminClient = createAdminClient();
      const { data: orderItems } = await adminClient
        .from("order_items")
        .select("id")
        .eq("artwork_id", artworkId);

      if (orderItems && orderItems.length > 0) {
        isReferenced = true;
      }
    } catch (orderCheckErr) {
      console.warn("[Order Items Check Warning]:", orderCheckErr);
    }

    if (isReferenced) {
      // Archive / mark unavailable to preserve past order history integrity
      try {
        const { updateLocalArtworkAvailability } = await import(
          "@/lib/artworks-local-store"
        );
        updateLocalArtworkAvailability(artworkId, false);
      } catch (e) {
        console.warn("[Local Archive Warning]:", e);
      }

      try {
        const adminClient = createAdminClient();
        await adminClient
          .from("artworks")
          .update({ is_available: false })
          .eq("id", artworkId);
      } catch (e) {
        console.warn("[Supabase Archive Warning]:", e);
      }

      await invalidateArtworkCache(artworkId);
      revalidatePath("/admin");
      revalidatePath("/artworks");
      revalidatePath("/");

      return {
        success: true,
        message:
          "Artwork is referenced in collector order history; marked as permanently archived/unavailable.",
      };
    }

    // Delete from local store
    try {
      const { deleteLocalArtwork } = await import("@/lib/artworks-local-store");
      deleteLocalArtwork(artworkId);
    } catch (localDelErr) {
      console.warn("[Local Delete Warning]:", localDelErr);
    }

    // Delete from Supabase
    try {
      const adminClient = createAdminClient();
      await adminClient.from("artworks").delete().eq("id", artworkId);
    } catch (dbDelErr) {
      console.warn("[Supabase Delete Warning]:", dbDelErr);
    }

    // Remove any Redis locks
    if (redis) {
      try {
        await redis.del(getArtworkLockKey(artworkId));
      } catch (lockErr) {
        console.error("[Redis Lock Del Error]:", lockErr);
      }
    }

    await invalidateArtworkCache(artworkId);

    try {
      revalidatePath("/admin");
      revalidatePath("/artworks");
      revalidatePath("/");
    } catch (e) {
      console.warn("[Revalidate Warning]:", e);
    }

    return { success: true };
  } catch (error) {
    console.error("[deleteArtworkAction Exception]:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete artwork.",
    };
  }
}

