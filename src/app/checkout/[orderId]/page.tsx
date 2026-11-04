import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateUpiUrl, generateQrCodeSvg } from "@/lib/upi";
import { getArtworkLockStatus } from "@/lib/locks";
import { PaymentGatewayView } from "@/components/checkout/PaymentGatewayView";
import type { Order, Artwork } from "@/types/database.types";

interface CheckoutOrderPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function CheckoutOrderPage({
  params,
}: CheckoutOrderPageProps) {
  const { orderId } = await params;

  let order: Order | null = null;
  let items: Artwork[] = [];

  // 1. Try local orders store first
  try {
    const { getLocalOrderById } = await import("@/lib/orders-local-store");
    const localOrder = getLocalOrderById(orderId);
    if (localOrder) {
      order = localOrder;
      items = localOrder.order_items
        .map((i) => i.artwork)
        .filter((a): a is Artwork => a !== null);
    }
  } catch (localErr) {
    console.warn("[CheckoutOrderPage local read warning]:", localErr);
  }

  // 2. Try Supabase if not found locally
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
          .select("artwork_id")
          .eq("order_id", orderId);

        if (orderItems && orderItems.length > 0) {
          const artworkIds = orderItems.map((item) => item.artwork_id);
          const { data: artworksData } = await adminClient
            .from("artworks")
            .select("*")
            .in("id", artworkIds);

          items = (artworksData as Artwork[]) || [];
        }
      }
    } catch (sbErr) {
      console.warn("[CheckoutOrderPage Supabase error]:", sbErr);
    }
  }

  if (!order) {
    notFound();
  }


  // Inspect Redis lock TTL for first item
  let remainingTtl = 600;
  if (items.length > 0) {
    const lockStatus = await getArtworkLockStatus(items[0].id);
    if (lockStatus.isLocked && lockStatus.ttl > 0) {
      remainingTtl = lockStatus.ttl;
    }
  }

  // Generate UPI Intent & Offline QR
  const upiUrl = generateUpiUrl({
    amount: Number(order.total_amount),
    orderId: order.id,
  });

  const qrSvgDataUrl = await generateQrCodeSvg(upiUrl);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="border-b border-zinc-200 pb-6 mb-8">
        <h1 className="font-serif text-3xl font-medium text-zinc-950">
          Order Payment Gateway
        </h1>
        <p className="mt-1 text-xs text-zinc-500 uppercase tracking-widest font-mono">
          Order Identifier: {order.id}
        </p>
      </div>

      <PaymentGatewayView
        order={order}
        items={items}
        upiUrl={upiUrl}
        qrSvgDataUrl={qrSvgDataUrl}
        initialRemainingSeconds={remainingTtl}
      />
    </div>
  );
}
