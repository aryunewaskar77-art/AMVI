import { getLocalOrders } from "@/lib/orders-local-store";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import Image from "next/image";
import {
  Clock,
  CheckCircle2,
  Send,
  Truck,
  PackageCheck,
  ArrowRight,
  ShoppingBag,
  ExternalLink,
  XCircle,
} from "lucide-react";
import type { Order, Artwork } from "@/types/database.types";

export const dynamic = "force-dynamic";

export default async function CollectorOrdersPage() {
  let orders = getLocalOrders();

  // If local store is empty, fallback to remote
  if (orders.length === 0) {
    try {
      const adminClient = createAdminClient();
      const { data } = await adminClient
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (data && data.length > 0) {
        orders = data as any;
      }
    } catch (e) {
      console.warn("[CollectorOrdersPage Supabase Warning]:", e);
    }
  }

  // Sort newest first
  orders = orders.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
      <div className="border-b border-zinc-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium text-zinc-950">
            Your Acquisition Orders
          </h1>
          <p className="mt-1 text-xs text-zinc-500 uppercase tracking-widest">
            Provenance Records & Real-Time White-Glove Dispatch
          </p>
        </div>

        <Link
          href="/artworks"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 hover:text-amber-950"
        >
          <span>Explore Gallery</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-16 text-center space-y-4 shadow-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 text-zinc-400">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-medium text-zinc-900">
              No acquisition orders placed yet
            </h2>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Masterpieces you acquire through our gallery checkout will appear here with live tracking.
            </p>
          </div>
          <Link
            href="/artworks"
            className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-white hover:bg-amber-900 transition-colors"
          >
            <span>Discover Artworks</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const formattedPrice = new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 0,
            }).format(Number(order.total_amount));

            const orderDate = new Date(order.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={order.id}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs transition-all hover:border-zinc-300"
              >
                {/* Order Header Banner */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 bg-stone-50/60 px-6 py-4 text-xs">
                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase tracking-wider">
                        Order Placed
                      </span>
                      <span className="font-medium text-zinc-800">{orderDate}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase tracking-wider">
                        Total Amount
                      </span>
                      <span className="font-serif font-bold text-zinc-950">
                        {formattedPrice}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase tracking-wider">
                        Order Reference
                      </span>
                      <span className="font-mono text-zinc-700">{order.id.slice(0, 8)}...</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Status Badge */}
                    {order.status === "out_for_delivery" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-900 animate-pulse">
                        <Truck className="h-3.5 w-3.5" />
                        Out for Delivery Today
                      </span>
                    ) : order.status === "delivered" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-900">
                        <PackageCheck className="h-3.5 w-3.5" />
                        Delivered
                      </span>
                    ) : order.status === "dispatched" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-900">
                        <Send className="h-3.5 w-3.5" />
                        Dispatched
                      </span>
                    ) : order.status === "verified" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Verified & In Atelier
                      </span>
                    ) : order.status === "cancelled" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-900">
                        <XCircle className="h-3.5 w-3.5" />
                        Cancelled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                        <Clock className="h-3.5 w-3.5" />
                        Pending Audit
                      </span>
                    )}

                    <Link
                      href={`/orders/${order.id}`}
                      className="inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100 transition-colors"
                    >
                      <span>Track Order</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                {/* Order Items Body */}
                <div className="p-6 divide-y divide-zinc-100">
                  {order.order_items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-4">
                        {item.artwork?.image_url && (
                          <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xs bg-zinc-100 border border-zinc-200">
                            <Image
                              src={item.artwork.image_url}
                              alt={item.artwork.title || "Artwork"}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <h3 className="font-serif text-sm font-medium text-zinc-900">
                            {item.artwork?.title || "Masterpiece"}
                          </h3>
                          <p className="text-xs text-zinc-500">
                            By {item.artwork?.artist_name || "Unknown Artist"}
                          </p>
                          <p className="text-[11px] text-zinc-400">
                            {item.artwork?.medium || "Original Work"} • {item.artwork?.dimensions}
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                        <span className="font-serif font-semibold text-zinc-950 text-sm">
                          ₹{Number(item.price_at_purchase).toLocaleString("en-IN")}
                        </span>
                        {order.transaction_ref && (
                          <span className="font-mono text-[10px] text-zinc-400">
                            UTR: {order.transaction_ref}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
