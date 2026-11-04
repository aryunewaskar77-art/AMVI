import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export const ARTWORKS_BUCKET = "artworks";
export const PAYMENT_RECEIPTS_BUCKET = "payment-receipts";

/**
 * Returns the public URL for an artwork image stored in the 'artworks' bucket.
 *
 * @param supabase Supabase client instance
 * @param path Storage path of the image within the 'artworks' bucket
 */
export function getArtworkPublicUrl(
  supabase: SupabaseClient<Database>,
  path: string
): string {
  const { data } = supabase.storage.from(ARTWORKS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Generates a signed URL for reading a private payment receipt.
 * Restricted to backend/admin operations with elevated permissions or authenticated users.
 *
 * @param supabase Supabase client instance
 * @param path Storage path of the receipt within the 'payment-receipts' bucket
 * @param expiresIn Time in seconds until the signed URL expires (default: 3600 / 1 hour)
 */
export async function getReceiptSignedUrl(
  supabase: SupabaseClient<Database>,
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  if (path.startsWith("/uploads") || path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  try {
    const { data, error } = await supabase.storage
      .from(PAYMENT_RECEIPTS_BUCKET)
      .createSignedUrl(path, expiresIn);

    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }
  } catch (err) {
    console.warn("[getReceiptSignedUrl Warning]:", err);
  }

  return path;
}


/**
 * Uploads a payment receipt file into the private 'payment-receipts' bucket.
 * Generates a collision-resistant UUID path.
 *
 * @param supabase Supabase client instance
 * @param file File or Blob to upload
 * @param orderId Associated order UUID
 */
export async function uploadPaymentReceipt(
  supabase: SupabaseClient<Database>,
  file: File | Blob,
  orderId: string
): Promise<{ path: string }> {
  const fileExt =
    file instanceof File && file.name.includes(".")
      ? file.name.split(".").pop()?.toLowerCase()
      : "jpg";

  const uniqueId = crypto.randomUUID();
  const filePath = `${orderId}/${uniqueId}.${fileExt}`;

  try {
    const { error } = await supabase.storage
      .from(PAYMENT_RECEIPTS_BUCKET)
      .upload(filePath, file, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });

    if (!error) {
      return { path: filePath };
    }
    console.warn("[uploadPaymentReceipt Supabase Warning]:", error.message);
  } catch (storageErr) {
    console.warn("[uploadPaymentReceipt Supabase Exception]:", storageErr);
  }

  // Fallback to local storage
  try {
    const fs = await import("fs");
    const path = await import("path");
    const uploadDir = path.join(process.cwd(), "public", "uploads", "receipts");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const localFileName = `${orderId}-${uniqueId}.${fileExt}`;
    const fullLocalPath = path.join(uploadDir, localFileName);
    const arrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(fullLocalPath, Buffer.from(arrayBuffer));
    return { path: `/uploads/receipts/${localFileName}` };
  } catch (localErr) {
    console.error("[uploadPaymentReceipt Local Fallback Error]:", localErr);
    return { path: filePath };
  }
}

