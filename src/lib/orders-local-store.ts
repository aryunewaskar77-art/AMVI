import fs from "fs";
import path from "path";
import type { Order, OrderItem, Artwork } from "@/types/database.types";
import { getLocalArtworks } from "@/lib/artworks-local-store";

const DATA_DIR = path.join(process.cwd(), "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

export interface StoredOrderWithDetails extends Order {
  signedReceiptUrl?: string | null;
  order_items: {
    artwork_id: string;
    price_at_purchase: number;
    artwork: Artwork | null;
  }[];
}

function ensureOrdersFile(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(ORDERS_FILE)) {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2), "utf8");
    }
  } catch (e) {
    console.error("[OrdersLocalStore] Failed to ensure orders file:", e);
  }
}

export function getLocalOrders(): StoredOrderWithDetails[] {
  try {
    ensureOrdersFile();
    if (fs.existsSync(ORDERS_FILE)) {
      const raw = fs.readFileSync(ORDERS_FILE, "utf8");
      const list = JSON.parse(raw) as StoredOrderWithDetails[];
      if (Array.isArray(list)) {
        return list;
      }
    }
  } catch (e) {
    console.error("[OrdersLocalStore] Read error:", e);
  }
  return [];
}

export function saveLocalOrder(order: StoredOrderWithDetails): void {
  try {
    ensureOrdersFile();
    const existing = getLocalOrders();
    const filtered = existing.filter((o) => o.id !== order.id);
    const updated = [order, ...filtered];
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(updated, null, 2), "utf8");
  } catch (e) {
    console.error("[OrdersLocalStore] Save error:", e);
  }
}

export function updateLocalOrderStatus(
  orderId: string,
  updates: Partial<StoredOrderWithDetails>
): boolean {
  try {
    ensureOrdersFile();
    const existing = getLocalOrders();
    let found = false;
    const updated = existing.map((o) => {
      if (o.id === orderId) {
        found = true;
        return { ...o, ...updates };
      }
      return o;
    });
    if (found) {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(updated, null, 2), "utf8");
    }
    return found;
  } catch (e) {
    console.error("[OrdersLocalStore] Update status error:", e);
    return false;
  }
}

export function getLocalOrderById(orderId: string): StoredOrderWithDetails | null {
  try {
    const orders = getLocalOrders();
    const found = orders.find((o) => o.id === orderId);
    if (found) return found;
  } catch (e) {
    console.error("[OrdersLocalStore] getLocalOrderById error:", e);
  }
  return null;
}
