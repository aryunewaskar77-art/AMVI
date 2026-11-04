"use client";

import { useState, useTransition, useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Check,
  AlertTriangle,
  Loader2,
  X,
  FileText,
  MapPin,
  Search,
  Filter,
  Truck,
  PackageCheck,
  Send,
  Navigation,
} from "lucide-react";
import {
  verifyOrderPaymentAction,
  rejectOrderPaymentAction,
  updateOrderDeliveryStatusAction,
  type AdminOrderWithDetails,
} from "@/app/actions/admin";
import type { OrderStatus } from "@/types/database.types";

interface OrdersTableProps {
  orders: AdminOrderWithDetails[];
  onOrderUpdated?: () => void;
}

type OrderFilter =
  | "all"
  | "recent"
  | "payment_pending"
  | "verified"
  | "dispatched"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export function OrdersTable({ orders, onOrderUpdated }: OrdersTableProps) {
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeReceiptUrl, setActiveReceiptUrl] = useState<string | null>(null);
  const [selectedOrderForModal, setSelectedOrderForModal] =
    useState<AdminOrderWithDetails | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] =
    useState<AdminOrderWithDetails | null>(null);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  // Delivery form states for dispatch modal
  const [carrierInput, setCarrierInput] = useState("Blue Dart Express");
  const [trackingNumberInput, setTrackingNumberInput] = useState("");
  const [estimatedDeliveryInput, setEstimatedDeliveryInput] = useState("");

  const [, startTransition] = useTransition();

  const handleVerify = (orderId: string) => {
    if (!confirm("Are you sure you want to verify this payment? The artworks will be permanently acquired and taken off public sale.")) {
      return;
    }

    setProcessingOrderId(orderId);
    startTransition(async () => {
      const res = await verifyOrderPaymentAction(orderId);
      setProcessingOrderId(null);
      if (res.success) {
        onOrderUpdated?.();
      } else {
        alert(res.message || "Failed to verify order.");
      }
    });
  };

  const handleReject = (orderId: string) => {
    const reason = prompt("Enter reason for rejection/cancellation:", "Invalid transaction reference");
    if (reason === null) return;

    setProcessingOrderId(orderId);
    startTransition(async () => {
      const res = await rejectOrderPaymentAction(orderId, reason);
      setProcessingOrderId(null);
      if (res.success) {
        onOrderUpdated?.();
      } else {
        alert(res.message || "Failed to reject order.");
      }
    });
  };

  const handleUpdateDeliveryStatus = (
    orderId: string,
    nextStatus: OrderStatus,
    carrier?: string,
    trackingNum?: string,
    estDelivery?: string
  ) => {
    setProcessingOrderId(orderId);
    startTransition(async () => {
      const res = await updateOrderDeliveryStatusAction(orderId, nextStatus, {
        carrier: carrier || undefined,
        tracking_number: trackingNum || undefined,
        estimated_delivery: estDelivery || undefined,
      });
      setProcessingOrderId(null);
      if (res.success) {
        onOrderUpdated?.();
        if (selectedOrderDetails && selectedOrderDetails.id === orderId) {
          setSelectedOrderDetails({
            ...selectedOrderDetails,
            status: nextStatus,
            tracking_details: {
              ...(selectedOrderDetails.tracking_details || {}),
              ...(carrier ? { carrier } : {}),
              ...(trackingNum ? { tracking_number: trackingNum } : {}),
              ...(estDelivery ? { estimated_delivery: estDelivery } : {}),
            },
          });
        }
      } else {
        alert(res.message || "Failed to update delivery status.");
      }
    });
  };

  const openReceiptModal = (order: AdminOrderWithDetails) => {
    setSelectedOrderForModal(order);
    setActiveReceiptUrl(order.signedReceiptUrl || null);
  };

  const closeReceiptModal = () => {
    setSelectedOrderForModal(null);
    setActiveReceiptUrl(null);
  };

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (filter === "recent") {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      result = result.filter(
        (o) => new Date(o.created_at).getTime() >= sevenDaysAgo
      );
      if (result.length === 0) {
        result = [...orders].slice(0, 5);
      }
    } else if (filter !== "all") {
      result = result.filter((o) => o.status === filter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(query) ||
          o.customer_name.toLowerCase().includes(query) ||
          o.customer_email.toLowerCase().includes(query) ||
          (o.transaction_ref && o.transaction_ref.toLowerCase().includes(query)) ||
          (o.tracking_details?.tracking_number &&
            o.tracking_details.tracking_number.toLowerCase().includes(query)) ||
          o.order_items.some((item) =>
            item.artwork?.title.toLowerCase().includes(query)
          )
      );
    }

    return result.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [orders, filter, searchQuery]);

  const pendingCount = orders.filter((o) => o.status === "payment_pending").length;
  const verifiedCount = orders.filter((o) => o.status === "verified").length;
  const dispatchedCount = orders.filter((o) => o.status === "dispatched").length;
  const outForDeliveryCount = orders.filter((o) => o.status === "out_for_delivery").length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const cancelledCount = orders.filter((o) => o.status === "cancelled").length;

  return (
    <div className="space-y-4">
      {/* Filtering and Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 space-y-3.5 shadow-2xs">
        {/* Search Bar - Full Width on Top */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search collector name, email, phone, UTR reference, or order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-200 bg-stone-50/60 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all shadow-2xs"
          />
        </div>

        {/* Filter Buttons in One Straight Line */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === "all"
                ? "bg-zinc-900 text-white shadow-xs"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("recent")}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === "recent"
                ? "bg-zinc-900 text-white shadow-xs"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Recent Orders
          </button>
          <button
            type="button"
            onClick={() => setFilter("payment_pending")}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              filter === "payment_pending"
                ? "bg-amber-700 text-white shadow-xs"
                : "bg-amber-50 text-amber-900 border border-amber-200/80 hover:bg-amber-100"
            }`}
          >
            <Clock className="h-3 w-3" />
            <span>Pending UTR ({pendingCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("verified")}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              filter === "verified"
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-900 border border-emerald-200/80 hover:bg-emerald-100"
            }`}
          >
            <CheckCircle2 className="h-3 w-3" />
            <span>Verified ({verifiedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("dispatched")}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              filter === "dispatched"
                ? "bg-blue-700 text-white shadow-xs"
                : "bg-blue-50 text-blue-900 border border-blue-200/80 hover:bg-blue-100"
            }`}
          >
            <Send className="h-3 w-3" />
            <span>Dispatched ({dispatchedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("out_for_delivery")}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              filter === "out_for_delivery"
                ? "bg-purple-700 text-white shadow-xs"
                : "bg-purple-50 text-purple-900 border border-purple-200/80 hover:bg-purple-100"
            }`}
          >
            <Truck className="h-3 w-3" />
            <span>Out for Delivery ({outForDeliveryCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("delivered")}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              filter === "delivered"
                ? "bg-teal-700 text-white shadow-xs"
                : "bg-teal-50 text-teal-900 border border-teal-200/80 hover:bg-teal-100"
            }`}
          >
            <PackageCheck className="h-3 w-3" />
            <span>Delivered ({deliveredCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("cancelled")}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              filter === "cancelled"
                ? "bg-red-700 text-white shadow-xs"
                : "bg-red-50 text-red-900 border border-red-200/80 hover:bg-red-100"
            }`}
          >
            <XCircle className="h-3 w-3" />
            <span>Cancelled ({cancelledCount})</span>
          </button>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center">
          <p className="font-serif text-lg text-zinc-600">No orders match your filter.</p>
          <p className="text-xs text-zinc-400 mt-1">
            {filter !== "all"
              ? "Try switching to 'All Orders' or clearing your search."
              : "Pending orders will appear here as collectors check out."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600 divide-y divide-zinc-200">
              <thead className="bg-zinc-50/80 font-semibold uppercase tracking-wider text-zinc-900 text-[11px]">
                <tr>
                  <th className="px-5 py-4">Order ID & Date</th>
                  <th className="px-5 py-4">Collector Details</th>
                  <th className="px-5 py-4">Artworks</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Payment Ref (UTR)</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-4 py-4 text-center">View More</th>
                  <th className="px-5 py-4 text-right">Status Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-normal">
              {filteredOrders.map((order) => {
                const isProcessing = processingOrderId === order.id;
                const formattedPrice = new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
                }).format(Number(order.total_amount));

                const dateStr = new Date(order.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <tr key={order.id} className="hover:bg-zinc-50/60 transition-colors">
                    {/* Order ID & Date */}
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedOrderDetails(order)}
                        className="text-left group"
                      >
                        <span className="font-mono font-medium text-zinc-900 group-hover:text-amber-800 underline decoration-dotted">
                          {order.id.slice(0, 8)}...
                        </span>
                        <p className="text-[11px] text-zinc-400 mt-0.5">{dateStr}</p>
                      </button>
                    </td>

                    {/* Collector Details */}
                    <td className="px-5 py-4">
                      <p className="font-medium text-zinc-900">{order.customer_name}</p>
                      <p className="text-[11px] text-zinc-500">{order.customer_email}</p>
                      <p className="text-[11px] text-zinc-400 font-mono">{order.customer_phone}</p>
                    </td>

                    {/* Artworks */}
                    <td className="px-5 py-4">
                      <div className="space-y-1 max-w-xs">
                        {order.order_items.map((item, idx) => (
                          <p key={idx} className="truncate font-medium text-zinc-800">
                            {item.artwork?.title || "Masterpiece"}
                            <span className="text-[11px] text-zinc-400 font-normal ml-1">
                              ({item.artwork?.medium || "Original"})
                            </span>
                          </p>
                        ))}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-4 font-serif font-semibold text-zinc-950 text-sm">
                      {formattedPrice}
                    </td>

                    {/* Payment Ref (UTR) & Receipt */}
                    <td className="px-5 py-4">
                      {order.transaction_ref ? (
                        <div className="space-y-1">
                          <span className="font-mono font-semibold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded text-[11px]">
                            {order.transaction_ref}
                          </span>
                          {order.receipt_url && (
                            <button
                              type="button"
                              onClick={() => openReceiptModal(order)}
                              className="flex items-center gap-1 text-[11px] text-amber-800 hover:underline font-medium"
                            >
                              <Eye className="h-3 w-3" />
                              <span>Inspect Proof</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic">No reference yet</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-4">
                      {order.status === "verified" ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                            <Check className="h-3 w-3" />
                            Verified
                          </span>
                          <span className="block text-[10px] text-zinc-400">Ready to pack</span>
                        </div>
                      ) : order.status === "dispatched" ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-800">
                            <Send className="h-3 w-3" />
                            Dispatched
                          </span>
                          {order.tracking_details?.carrier && (
                            <span className="block text-[10px] text-zinc-500 font-medium">
                              via {order.tracking_details.carrier}
                            </span>
                          )}
                        </div>
                      ) : order.status === "out_for_delivery" ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-[11px] font-semibold text-purple-800 animate-pulse">
                            <Truck className="h-3 w-3" />
                            Out for Delivery
                          </span>
                          <span className="block text-[10px] text-purple-600 font-medium">
                            Arriving today
                          </span>
                        </div>
                      ) : order.status === "delivered" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-1 text-[11px] font-semibold text-teal-800">
                          <PackageCheck className="h-3 w-3" />
                          Delivered
                        </span>
                      ) : order.status === "payment_pending" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                          <Clock className="h-3 w-3" />
                          Pending Audit
                        </span>
                      ) : order.status === "cancelled" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-800">
                          <XCircle className="h-3 w-3" />
                          Cancelled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-600">
                          <AlertTriangle className="h-3 w-3" />
                          {order.status}
                        </span>
                      )}
                    </td>

                    {/* View More / Order Overview Column */}
                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedOrderDetails(order)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-300 bg-white text-[11px] font-medium text-stone-700 hover:border-zinc-950 hover:bg-stone-50 transition-colors shadow-2xs"
                      >
                        <Eye className="h-3 w-3 text-stone-500" />
                        <span>View More</span>
                      </button>
                    </td>

                    {/* Status Actions Column */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {/* Fast inline status transitions */}
                        {order.status === "payment_pending" && (
                          <>
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleVerify(order.id)}
                              className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-800 transition-colors disabled:opacity-50"
                            >
                              {isProcessing ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3" />
                              )}
                              <span>Verify</span>
                            </button>

                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleReject(order.id)}
                              className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              <XCircle className="h-3 w-3" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {order.status === "verified" && (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => {
                              const trk = prompt("Enter tracking number / AWB code (optional):", `AMVI-${Date.now().toString().slice(-6)}`);
                              handleUpdateDeliveryStatus(order.id, "dispatched", "Blue Dart Express", trk || undefined);
                            }}
                            className="inline-flex items-center gap-1 rounded-full bg-blue-700 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-800 transition-colors disabled:opacity-50"
                          >
                            <Send className="h-3 w-3" />
                            <span>Mark Dispatched</span>
                          </button>
                        )}

                        {order.status === "dispatched" && (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleUpdateDeliveryStatus(order.id, "out_for_delivery")}
                            className="inline-flex items-center gap-1.5 rounded-full bg-purple-700 px-3.5 py-1.5 text-[11px] font-semibold text-white hover:bg-purple-800 transition-colors disabled:opacity-50 shadow-xs"
                          >
                            <Truck className="h-3.5 w-3.5" />
                            <span>Mark Out for Delivery</span>
                          </button>
                        )}

                        {order.status === "out_for_delivery" && (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleUpdateDeliveryStatus(order.id, "delivered")}
                            className="inline-flex items-center gap-1.5 rounded-full bg-teal-700 px-3.5 py-1.5 text-[11px] font-semibold text-white hover:bg-teal-800 transition-colors disabled:opacity-50 shadow-xs"
                          >
                            <PackageCheck className="h-3.5 w-3.5" />
                            <span>Mark Delivered</span>
                          </button>
                        )}

                        {order.status === "delivered" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-800 bg-teal-50 border border-teal-200/80 rounded-full px-2.5 py-1">
                            <Check className="h-3 w-3" />
                            Fulfilled
                          </span>
                        )}

                        {order.status === "cancelled" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 bg-stone-100 rounded-full px-2.5 py-1">
                            <X className="h-3 w-3" />
                            Closed
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Modal for Order Details / History */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-zinc-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-xl font-medium text-zinc-950">
                    Order Overview
                  </h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      selectedOrderDetails.status === "verified"
                        ? "bg-emerald-100 text-emerald-800"
                        : selectedOrderDetails.status === "payment_pending"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {selectedOrderDetails.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-mono mt-1">
                  ID: {selectedOrderDetails.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Collector Information */}
            {(() => {
              const addr = selectedOrderDetails.shipping_address as unknown as Record<string, string> | null;
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-stone-50 rounded-xl border border-zinc-200 space-y-1.5">
                    <p className="font-semibold text-zinc-900 uppercase tracking-wider text-[10px]">
                      Collector Details
                    </p>
                    <p className="font-medium text-sm text-zinc-950">
                      {selectedOrderDetails.customer_name}
                    </p>
                    <p className="text-zinc-600">{selectedOrderDetails.customer_email}</p>
                    <p className="text-zinc-600 font-mono">{selectedOrderDetails.customer_phone}</p>
                  </div>

                  <div className="p-3.5 bg-stone-50 rounded-xl border border-zinc-200 space-y-1.5">
                    <p className="font-semibold text-zinc-900 uppercase tracking-wider text-[10px]">
                      Shipping Destination
                    </p>
                    <p className="text-zinc-800 font-medium">
                      {addr?.address_line1 || "No address provided"}
                    </p>
                    <p className="text-zinc-600">
                      {addr?.city || ""}, {addr?.state || ""} {addr?.postal_code ? `- ${addr.postal_code}` : ""}
                    </p>
                    <p className="text-zinc-500">{addr?.country || "India"}</p>
                  </div>
                </div>
              );
            })()}

            {/* Payment Audit Details */}
            <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
              <p className="font-semibold text-zinc-900 uppercase tracking-wider text-[10px]">
                Payment Audit & Reconciliation
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-zinc-400 block text-[11px]">Payment Method</span>
                  <span className="font-medium text-zinc-800 capitalize">
                    {selectedOrderDetails.payment_method?.replace("_", " ") || "Manual UPI"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[11px]">UTR / Transaction Ref</span>
                  <span className="font-mono font-bold text-zinc-950 bg-white px-1.5 py-0.5 rounded border border-zinc-200">
                    {selectedOrderDetails.transaction_ref || "Awaiting Submission"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[11px]">Order Placed At</span>
                  <span className="text-zinc-700">
                    {new Date(selectedOrderDetails.created_at).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* E-Commerce Delivery Stepper & Lifecycle */}
            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-zinc-900 uppercase tracking-wider text-[10px]">
                  Fulfillment & Delivery Progress
                </p>
                <span className="text-[11px] font-mono text-zinc-500">
                  {selectedOrderDetails.status.replace("_", " ").toUpperCase()}
                </span>
              </div>

              {/* 4-Stage Visual Progress Stepper */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {/* 1. Verified */}
                <div
                  className={`p-2.5 rounded-lg border transition-all ${
                    ["verified", "dispatched", "out_for_delivery", "delivered"].includes(
                      selectedOrderDetails.status
                    )
                      ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold"
                      : "bg-white border-zinc-200 text-zinc-400"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
                  <p className="text-[11px]">1. Payment Verified</p>
                  <span className="text-[10px] text-zinc-500 font-normal">Artwork Secured</span>
                </div>

                {/* 2. Dispatched */}
                <div
                  className={`p-2.5 rounded-lg border transition-all ${
                    ["dispatched", "out_for_delivery", "delivered"].includes(
                      selectedOrderDetails.status
                    )
                      ? "bg-blue-50 border-blue-300 text-blue-950 font-semibold"
                      : "bg-white border-zinc-200 text-zinc-400"
                  }`}
                >
                  <Send className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                  <p className="text-[11px]">2. Dispatched</p>
                  <span className="text-[10px] text-zinc-500 font-normal">
                    {selectedOrderDetails.tracking_details?.carrier || "Crated & Handed Over"}
                  </span>
                </div>

                {/* 3. Out for Delivery */}
                <div
                  className={`p-2.5 rounded-lg border transition-all ${
                    ["out_for_delivery", "delivered"].includes(
                      selectedOrderDetails.status
                    )
                      ? "bg-purple-50 border-purple-300 text-purple-950 font-semibold animate-pulse"
                      : "bg-white border-zinc-200 text-zinc-400"
                  }`}
                >
                  <Truck className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                  <p className="text-[11px]">3. Out for Delivery</p>
                  <span className="text-[10px] text-zinc-500 font-normal">Local Courier Van</span>
                </div>

                {/* 4. Delivered */}
                <div
                  className={`p-2.5 rounded-lg border transition-all ${
                    selectedOrderDetails.status === "delivered"
                      ? "bg-teal-50 border-teal-300 text-teal-950 font-semibold"
                      : "bg-white border-zinc-200 text-zinc-400"
                  }`}
                >
                  <PackageCheck className="h-4 w-4 mx-auto mb-1 text-teal-600" />
                  <p className="text-[11px]">4. Delivered</p>
                  <span className="text-[10px] text-zinc-500 font-normal">Signed by Collector</span>
                </div>
              </div>

              {/* Courier Tracking Info if present */}
              {selectedOrderDetails.tracking_details && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-white rounded-lg border border-zinc-200 text-xs">
                  <div>
                    <span className="text-zinc-400 block text-[11px]">Logistics Partner</span>
                    <span className="font-semibold text-zinc-900">
                      {selectedOrderDetails.tracking_details.carrier || "White-Glove Archival Express"}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[11px]">Air Waybill / Tracking No.</span>
                    <span className="font-mono font-bold text-zinc-950 bg-stone-100 px-2 py-0.5 rounded">
                      {selectedOrderDetails.tracking_details.tracking_number || "AMVI-DIRECT-COURIER"}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[11px]">Current Stage Time</span>
                    <span className="text-zinc-600">
                      {selectedOrderDetails.tracking_details.out_for_delivery_at
                        ? `Out since ${new Date(selectedOrderDetails.tracking_details.out_for_delivery_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
                        : selectedOrderDetails.tracking_details.dispatched_at
                        ? `Dispatched on ${new Date(selectedOrderDetails.tracking_details.dispatched_at).toLocaleDateString("en-IN")}`
                        : "In transit"}
                    </span>
                  </div>
                </div>
              )}

              {/* Delivery Action Controls inside Modal */}
              {selectedOrderDetails.status !== "cancelled" &&
                selectedOrderDetails.status !== "payment_pending" && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-200">
                    <span className="text-xs text-zinc-500 mr-2 font-medium">
                      Update Delivery State:
                    </span>
                    <button
                      type="button"
                      disabled={processingOrderId === selectedOrderDetails.id}
                      onClick={() =>
                        handleUpdateDeliveryStatus(
                          selectedOrderDetails.id,
                          "dispatched",
                          "Blue Dart Express",
                          selectedOrderDetails.tracking_details?.tracking_number ||
                            `AMVI-${Date.now().toString().slice(-6)}`
                        )
                      }
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                        selectedOrderDetails.status === "dispatched"
                          ? "bg-blue-800 text-white"
                          : "border border-blue-300 text-blue-700 hover:bg-blue-50"
                      }`}
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Dispatched</span>
                    </button>

                    <button
                      type="button"
                      disabled={processingOrderId === selectedOrderDetails.id}
                      onClick={() =>
                        handleUpdateDeliveryStatus(
                          selectedOrderDetails.id,
                          "out_for_delivery"
                        )
                      }
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                        selectedOrderDetails.status === "out_for_delivery"
                          ? "bg-purple-800 text-white animate-pulse"
                          : "border border-purple-300 text-purple-700 hover:bg-purple-50"
                      }`}
                    >
                      <Truck className="h-3.5 w-3.5" />
                      <span>Out for Delivery</span>
                    </button>

                    <button
                      type="button"
                      disabled={processingOrderId === selectedOrderDetails.id}
                      onClick={() =>
                        handleUpdateDeliveryStatus(
                          selectedOrderDetails.id,
                          "delivered"
                        )
                      }
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                        selectedOrderDetails.status === "delivered"
                          ? "bg-teal-800 text-white"
                          : "border border-teal-300 text-teal-700 hover:bg-teal-50"
                      }`}
                    >
                      <PackageCheck className="h-3.5 w-3.5" />
                      <span>Delivered</span>
                    </button>
                  </div>
                )}
            </div>

            {/* Artworks Purchased */}
            <div className="space-y-2">
              <p className="font-semibold text-zinc-900 uppercase tracking-wider text-[10px]">
                Acquired Masterpieces
              </p>
              <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 overflow-hidden">
                {selectedOrderDetails.order_items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white text-xs">
                    <div className="flex items-center gap-3">
                      {item.artwork?.image_url && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={item.artwork.image_url}
                          alt={item.artwork.title}
                          className="h-10 w-10 rounded object-cover border border-zinc-200"
                        />
                      )}
                      <div>
                        <p className="font-medium text-zinc-900">
                          {item.artwork?.title || "Masterpiece"}
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          By {item.artwork?.artist_name || "Unknown Artist"} • {item.artwork?.medium || "Original"}
                        </p>
                      </div>
                    </div>
                    <span className="font-serif font-semibold text-zinc-950">
                      ₹{Number(item.price_at_purchase).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total and Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
              <div>
                <span className="text-xs text-zinc-500">Total Order Amount</span>
                <p className="font-serif text-xl font-bold text-zinc-950">
                  ₹{Number(selectedOrderDetails.total_amount).toLocaleString("en-IN")}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {selectedOrderDetails.status === "payment_pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        handleVerify(selectedOrderDetails.id);
                        setSelectedOrderDetails(null);
                      }}
                      className="px-4 py-2 rounded-full bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors"
                    >
                      Verify Payment
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleReject(selectedOrderDetails.id);
                        setSelectedOrderDetails(null);
                      }}
                      className="px-4 py-2 rounded-full border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50 transition-colors"
                    >
                      Reject Order
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedOrderDetails(null)}
                  className="px-4 py-2 rounded-full bg-zinc-950 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Inspecting Secure Signed Receipt */}
      {selectedOrderForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div>
                <h3 className="font-serif text-lg font-medium text-zinc-950">
                  Payment Verification Receipt
                </h3>
                <p className="text-xs text-zinc-500 font-mono">
                  Order: {selectedOrderForModal.id} • UTR: {selectedOrderForModal.transaction_ref}
                </p>
              </div>
              <button
                type="button"
                onClick={closeReceiptModal}
                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center min-h-[300px] max-h-[500px] overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              {activeReceiptUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={activeReceiptUrl}
                  alt="Customer Payment Receipt"
                  className="max-h-[460px] max-w-full rounded object-contain shadow-sm"
                />
              ) : (
                <div className="text-center py-12 space-y-2">
                  <FileText className="h-10 w-10 text-zinc-400 mx-auto" />
                  <p className="text-xs text-zinc-600">
                    No receipt file uploaded, or signed token expired.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-zinc-400">
                15-minute secure authenticated preview URL
              </span>
              <button
                type="button"
                onClick={closeReceiptModal}
                className="rounded-full bg-zinc-950 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-zinc-800"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
