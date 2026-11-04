import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Truck,
  PackageCheck,
  Send,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import type { Order, Artwork, ShippingAddress } from "@/types/database.types";

interface OrderTrackingPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function OrderTrackingPage({
  params,
}: OrderTrackingPageProps) {
  const { orderId } = await params;

  let order: Order | null = null;
  let artworks: Artwork[] = [];

  // 1. Try local orders store first
  try {
    const { getLocalOrderById } = await import("@/lib/orders-local-store");
    const localOrder = getLocalOrderById(orderId);
    if (localOrder) {
      order = localOrder;
      artworks = localOrder.order_items
        .map((i) => i.artwork)
        .filter((a): a is Artwork => a !== null);
    }
  } catch (localErr) {
    console.warn("[OrderTrackingPage local read warning]:", localErr);
  }

  // 2. Fallback to Supabase if not in local store
  if (!order) {
    try {
      const adminClient = createAdminClient();
      const { data: orderData, error: orderError } = await adminClient
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();

      if (!orderError && orderData) {
        order = orderData as Order;

        const { data: orderItems } = await adminClient
          .from("order_items")
          .select("artwork_id, price_at_purchase")
          .eq("order_id", orderId);

        const artworkIds = (orderItems || []).map((item) => item.artwork_id);
        const { data: artworksData } = await adminClient
          .from("artworks")
          .select("*")
          .in("id", artworkIds);

        artworks = (artworksData as Artwork[]) || [];
      }
    } catch (sbErr) {
      console.warn("[OrderTrackingPage Supabase error]:", sbErr);
    }
  }

  if (!order) {
    notFound();
  }

  const address = order.shipping_address as unknown as Record<string, string>;

  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(order.total_amount));

  // Determine current lifecycle index:
  // 0: payment_pending, 1: verified, 2: dispatched, 3: out_for_delivery, 4: delivered
  const statusLevels: Record<string, number> = {
    payment_pending: 0,
    verified: 1,
    dispatched: 2,
    out_for_delivery: 3,
    delivered: 4,
    cancelled: -1,
  };

  const currentLevel = statusLevels[order.status] ?? 0;
  const isCancelled = order.status === "cancelled";

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
      {/* Live E-Commerce Order Status Header */}
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center space-y-6 shadow-xs">
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
            order.status === "out_for_delivery"
              ? "bg-purple-100 text-purple-700 animate-bounce"
              : order.status === "delivered"
              ? "bg-teal-100 text-teal-800"
              : order.status === "dispatched"
              ? "bg-blue-100 text-blue-800"
              : order.status === "verified"
              ? "bg-emerald-100 text-emerald-800"
              : isCancelled
              ? "bg-red-100 text-red-800"
              : "bg-amber-50 text-amber-800"
          }`}
        >
          {order.status === "out_for_delivery" ? (
            <Truck className="h-8 w-8" />
          ) : order.status === "delivered" ? (
            <PackageCheck className="h-8 w-8" />
          ) : order.status === "dispatched" ? (
            <Send className="h-8 w-8" />
          ) : order.status === "verified" ? (
            <CheckCircle2 className="h-8 w-8" />
          ) : isCancelled ? (
            <AlertTriangle className="h-8 w-8" />
          ) : (
            <Clock className="h-8 w-8" />
          )}
        </div>

        <div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-wider ${
              order.status === "out_for_delivery"
                ? "bg-purple-100 text-purple-900 border border-purple-300 animate-pulse"
                : order.status === "delivered"
                ? "bg-teal-100 text-teal-900"
                : order.status === "dispatched"
                ? "bg-blue-100 text-blue-900"
                : order.status === "verified"
                ? "bg-emerald-100 text-emerald-900"
                : isCancelled
                ? "bg-red-100 text-red-900"
                : "bg-amber-100 text-amber-900"
            }`}
          >
            {order.status === "out_for_delivery"
              ? "🚚 Out For Delivery Today"
              : order.status === "delivered"
              ? "✨ Successfully Delivered"
              : order.status === "dispatched"
              ? "📦 Dispatched & In Transit"
              : order.status === "verified"
              ? "🎨 Payment Confirmed & Preparing Crate"
              : isCancelled
              ? "❌ Order Cancelled"
              : "⏳ Payment Verification Underway"}
          </span>

          <h1 className="mt-3 font-serif text-3xl font-medium text-zinc-950">
            {order.status === "out_for_delivery"
              ? "Your Masterpiece is Out for Delivery!"
              : order.status === "delivered"
              ? "Artwork Delivered to Collector"
              : order.status === "dispatched"
              ? "Dispatched with White-Glove Logistics"
              : order.status === "verified"
              ? "Acquisition Confirmed & In Atelier"
              : isCancelled
              ? "Acquisition Reservation Cancelled"
              : "Acquisition Order Registered"}
          </h1>

          <p className="mt-2 text-xs text-zinc-600 max-w-md mx-auto">
            {order.status === "out_for_delivery"
              ? "The delivery courier is en route to your shipping destination. Please have a government ID or signature ready upon arrival."
              : order.status === "delivered"
              ? "Your artwork and sealed physical Certificate of Authenticity have been handed over."
              : order.status === "dispatched"
              ? `Your order has left the atelier via ${order.tracking_details?.carrier || "Blue Dart Express"}. Track package using Air Waybill code below.`
              : order.status === "verified"
              ? "Payment reference verified. Our curators are hand-packing your masterpiece into custom wooden climate casing."
              : "Our gallery curatorial team is verifying your payment reference with our bank."}
          </p>
        </div>

        {/* E-Commerce Visual Progress Bar: Only shown once payment is verified and entered fulfillment */}
        {!isCancelled && currentLevel >= 1 && (
          <div className="pt-4 border-t border-zinc-100">
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div
                className={`p-3 rounded-lg border text-center transition-all ${
                  currentLevel >= 1
                    ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold"
                    : "bg-zinc-50 border-zinc-200 text-zinc-400"
                }`}
              >
                <CheckCircle2 className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
                <p className="text-[11px]">1. Verified</p>
                <span className="text-[10px] text-zinc-500 font-normal">Payment Cleared</span>
              </div>

              <div
                className={`p-3 rounded-lg border text-center transition-all ${
                  currentLevel >= 2
                    ? "bg-blue-50 border-blue-300 text-blue-950 font-semibold"
                    : "bg-zinc-50 border-zinc-200 text-zinc-400"
                }`}
              >
                <Send className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                <p className="text-[11px]">2. Dispatched</p>
                <span className="text-[10px] text-zinc-500 font-normal">Crated & Shipped</span>
              </div>

              <div
                className={`p-3 rounded-lg border text-center transition-all ${
                  currentLevel >= 3
                    ? "bg-purple-50 border-purple-300 text-purple-950 font-semibold animate-pulse"
                    : "bg-zinc-50 border-zinc-200 text-zinc-400"
                }`}
              >
                <Truck className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                <p className="text-[11px]">3. Out For Delivery</p>
                <span className="text-[10px] text-zinc-500 font-normal">With Local Courier</span>
              </div>

              <div
                className={`p-3 rounded-lg border text-center transition-all ${
                  currentLevel >= 4
                    ? "bg-teal-50 border-teal-300 text-teal-950 font-semibold"
                    : "bg-zinc-50 border-zinc-200 text-zinc-400"
                }`}
              >
                <PackageCheck className="h-4 w-4 mx-auto mb-1 text-teal-600" />
                <p className="text-[11px]">4. Delivered</p>
                <span className="text-[10px] text-zinc-500 font-normal">Handed Over</span>
              </div>
            </div>
          </div>
        )}

        <div className="pt-2 text-xs text-zinc-500 font-mono">
          Order Reference: <span className="font-semibold text-zinc-900">{order.id}</span>
        </div>
      </div>

      {/* Transaction & Delivery Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Verification Card */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4">
          <h2 className="font-serif text-base font-medium text-zinc-950 border-b border-zinc-100 pb-3">
            Transaction Details
          </h2>
          <dl className="text-xs space-y-2.5">
            <div className="flex justify-between">
              <dt className="text-zinc-500">Acquisition Amount</dt>
              <dd className="font-serif font-bold text-zinc-950 text-sm">
                {formattedAmount}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Payment Channel</dt>
              <dd className="font-medium text-zinc-900 uppercase">
                {order.payment_method.replace("_", " ")}
              </dd>
            </div>
            {order.transaction_ref && (
              <div className="flex justify-between">
                <dt className="text-zinc-500">Submitted UTR Ref</dt>
                <dd className="font-mono font-bold text-zinc-900">
                  {order.transaction_ref}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-zinc-500">Receipt Attachment</dt>
              <dd className="text-emerald-700 font-medium">
                {order.receipt_url ? "Uploaded & Encrypted" : "Reference Only"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Shipping & Delivery Logistics Card */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h2 className="font-serif text-base font-medium text-zinc-950">
              White-Glove Delivery
            </h2>
            {order.status === "out_for_delivery" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800 animate-pulse">
                <Truck className="h-3 w-3" />
                Out For Delivery
              </span>
            ) : order.status === "dispatched" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                <Send className="h-3 w-3" />
                In Transit
              </span>
            ) : order.status === "delivered" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                <PackageCheck className="h-3 w-3" />
                Delivered
              </span>
            ) : null}
          </div>

          <div className="text-xs space-y-1 text-zinc-600">
            <p className="font-semibold text-zinc-900">{order.customer_name}</p>
            <p>{order.customer_email} • {order.customer_phone}</p>
            <p className="pt-1">{address.address_line1}</p>
            {address.address_line2 && <p>{address.address_line2}</p>}
            <p>
              {address.city}, {address.state} {address.postal_code ? `- ${address.postal_code}` : ""}
            </p>
            <p>{address.country || "India"}</p>
          </div>

          {order.tracking_details && (
            <div className="mt-3 pt-3 border-t border-zinc-100 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Logistics Courier:</span>
                <span className="font-semibold text-zinc-900">
                  {order.tracking_details.carrier || "Blue Dart Express"}
                </span>
              </div>
              {order.tracking_details.tracking_number && (
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Waybill / Tracking:</span>
                  <span className="font-mono font-bold text-zinc-900 bg-stone-100 px-2 py-0.5 rounded">
                    {order.tracking_details.tracking_number}
                  </span>
                </div>
              )}
              {order.tracking_details.out_for_delivery_at && (
                <div className="flex justify-between items-center text-purple-700 font-medium">
                  <span>Out with Courier:</span>
                  <span>
                    {new Date(order.tracking_details.out_for_delivery_at).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
              {order.tracking_details.delivered_at && (
                <div className="flex justify-between items-center text-teal-700 font-medium">
                  <span>Delivered On:</span>
                  <span>
                    {new Date(order.tracking_details.delivered_at).toLocaleDateString("en-IN")}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Acquired Artworks */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4">
        <h2 className="font-serif text-base font-medium text-zinc-950 border-b border-zinc-100 pb-3">
          Acquired Original Works
        </h2>
        <div className="divide-y divide-zinc-100">
          {artworks.map((art) => (
            <div key={art.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
              <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xs bg-zinc-100">
                <Image
                  src={art.image_url}
                  alt={art.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 justify-between items-center">
                <div>
                  <h3 className="font-serif text-sm font-medium text-zinc-900">
                    {art.title}
                  </h3>
                  <p className="text-xs text-zinc-500">{art.artist_name}</p>
                  <p className="text-[11px] text-zinc-400">
                    {art.medium} • {art.dimensions}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Locked for Collector
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assurance and Back to Gallery Action */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-200 text-xs">
        <div className="flex items-center gap-2 text-zinc-600">
          <ShieldCheck className="h-4 w-4 text-amber-800 shrink-0" />
          <span>Physical Certificate of Authenticity sealed inside shipment crate.</span>
        </div>

        <Link
          href="/artworks"
          className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-white hover:bg-amber-900 transition-colors shadow-xs"
        >
          <span>Return to Gallery</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
