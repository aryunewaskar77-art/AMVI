"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { InventoryTable } from "@/components/admin/InventoryTable";
import { AddArtworkModal } from "@/components/admin/AddArtworkModal";
import type { AdminOrderWithDetails } from "@/app/actions/admin";
import type { Artwork } from "@/types/database.types";
import {
  DollarSign,
  Clock,
  Palette,
  ShoppingBag,
  PlusCircle,
  ArrowUpRight,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  RefreshCw,
  Activity,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  BarChart3,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Radio,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

interface AdminDashboardClientProps {
  initialOrders: AdminOrderWithDetails[];
  initialArtworks: Artwork[];
  lockedMap?: Record<string, boolean>;
  initialTab?: "pulse" | "orders" | "inventory" | "analytics";
}

export function AdminDashboardClient({
  initialOrders,
  initialArtworks,
  lockedMap = {},
  initialTab = "pulse",
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"pulse" | "orders" | "inventory" | "analytics">(initialTab);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  // Dynamic live state: automatically updates when actions complete or background polling detects changes
  const [orders, setOrders] = useState<AdminOrderWithDetails[]>(initialOrders);
  const [artworks, setArtworks] = useState<Artwork[]>(initialArtworks);
  const [locks, setLocks] = useState<Record<string, boolean>>(lockedMap);

  // Sync with new props from server if provided
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  useEffect(() => {
    setArtworks(initialArtworks);
  }, [initialArtworks]);

  useEffect(() => {
    setLocks(lockedMap);
  }, [lockedMap]);

  // Real-time synchronization fetcher
  const syncLiveData = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsSyncing(true);
    try {
      const res = await fetch("/api/admin/live-data", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.orders) setOrders(data.orders);
        if (data.artworks) setArtworks(data.artworks);
        if (data.lockedMap) setLocks(data.lockedMap);
      }
    } catch (e) {
      console.warn("[Admin Live Sync Error]:", e);
    } finally {
      if (showIndicator) {
        setTimeout(() => setIsSyncing(false), 300);
      }
    }
  }, []);

  // Background real-time polling every 3 seconds & on window focus/visibilitychange
  useEffect(() => {
    const interval = setInterval(() => {
      syncLiveData(false);
    }, 3000);

    const handleFocus = () => {
      syncLiveData(false);
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [syncLiveData]);

  // Compute live metrics: all registered orders that are not cancelled
  const activeOrders = orders.filter((o) => o.status !== "cancelled");

  const pendingOrders = orders.filter(
    (o) => o.status === "payment_pending"
  );

  const verifiedOrders = orders.filter(
    (o) => o.status === "verified" || o.status === "dispatched" || o.status === "out_for_delivery" || o.status === "delivered"
  );

  const totalRevenue = verifiedOrders.reduce(
    (sum, o) => sum + Number(o.total_amount || 0),
    0
  );

  const formattedRevenue = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(totalRevenue);

  const availableArtworks = artworks.filter((a) => a.is_available);

  const handleRefresh = async () => {
    await syncLiveData(true);
    router.refresh();
  };

  const handleLogout = async () => {
    await logoutAction();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-stone-50/60 flex flex-col md:flex-row">
      {/* Vertical Left Sidebar */}
      <aside className="w-full md:w-72 md:min-h-screen shrink-0 border-r border-stone-200/90 bg-white p-6 flex flex-col justify-between shadow-xs">
        <div className="space-y-8">
          {/* Brand Emblem & Role */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative h-10 w-16 overflow-hidden rounded-md transition-transform group-hover:scale-105">
                <Image
                  src="/amvi-logo.png"
                  alt="AMVI Fine Art Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <span className="font-serif text-xl font-bold tracking-wider text-amvi-gradient block">
                  AMVI
                </span>
                <span className="text-[9px] uppercase tracking-[0.25em] text-stone-400 font-semibold">
                  Curatorial Console
                </span>
              </div>
            </Link>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-amber-900">
              <ShieldCheck className="h-3 w-3 text-[#d97757]" />
              <span>Admin Authorized</span>
            </div>
          </div>

          {/* Vertical Navigation Links */}
          <nav className="space-y-1.5 text-xs font-medium">
            <Link
              href="/admin"
              onClick={() => setActiveTab("pulse")}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all ${
                activeTab === "pulse"
                  ? "bg-zinc-950 text-white shadow-xs font-semibold"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Activity className="h-4 w-4" />
                <span>Gallery Pulse</span>
              </div>
              <span
                className={`text-[10px] ${
                  activeTab === "pulse" ? "text-zinc-400" : "text-stone-400"
                }`}
              >
                Overview
              </span>
            </Link>

            <Link
              href="/admin/orders"
              onClick={() => setActiveTab("orders")}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all ${
                activeTab === "orders"
                  ? "bg-zinc-950 text-white shadow-xs font-semibold"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="h-4 w-4" />
                <span>Orders & Proofs</span>
              </div>
              {pendingOrders.length > 0 ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    activeTab === "orders"
                      ? "bg-amber-400 text-zinc-950"
                      : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {pendingOrders.length}
                </span>
              ) : (
                <span
                  className={`text-[10px] ${
                    activeTab === "orders" ? "text-zinc-400" : "text-stone-400"
                  }`}
                >
                  {orders.length}
                </span>
              )}
            </Link>

            <Link
              href="/admin/inventory"
              onClick={() => setActiveTab("inventory")}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all ${
                activeTab === "inventory"
                  ? "bg-zinc-950 text-white shadow-xs font-semibold"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Palette className="h-4 w-4" />
                <span>Catalog Inventory</span>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === "inventory"
                    ? "bg-zinc-800 text-zinc-200"
                    : "bg-stone-100 text-stone-600"
                }`}
              >
                {artworks.length}
              </span>
            </Link>

            <Link
              href="/admin/analytics"
              onClick={() => setActiveTab("analytics")}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all ${
                activeTab === "analytics"
                  ? "bg-zinc-950 text-white shadow-xs font-semibold"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="h-4 w-4" />
                <span>Sales Statistics</span>
              </div>
              <span
                className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${
                  activeTab === "analytics"
                    ? "bg-emerald-400 text-zinc-950"
                    : "bg-emerald-50 text-emerald-800"
                }`}
              >
                KPIs
              </span>
            </Link>
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="pt-6 border-t border-stone-200 space-y-2">
          <Link
            href="/artworks"
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-stone-700 hover:bg-stone-100 hover:text-stone-950 transition-colors"
          >
            <span>Public Gallery</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-stone-400" />
          </Link>

          <button
            type="button"
            onClick={handleRefresh}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <span>Refresh State</span>
            <RefreshCw className="h-3.5 w-3.5 text-stone-400" />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors"
          >
            <span>Log Out</span>
            <LogOut className="h-3.5 w-3.5 text-red-600" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-x-hidden">
        {activeTab === "pulse" ? (
          <div className="space-y-8 max-w-6xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#d97757]/10 border border-[#d97757]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#d97757] uppercase tracking-wider mb-2">
                  <Activity className="h-3.5 w-3.5" />
                  <span>Real-Time Gallery Analytics</span>
                </div>
                <h1 className="font-serif text-3xl font-semibold text-zinc-950">
                  Gallery Pulse Overview
                </h1>
                <p className="text-xs text-stone-500 mt-1">
                  Executive snapshot of revenue realization, active collector orders, and museum catalog availability.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-semibold text-emerald-800">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                  </span>
                  <span>Live Sync</span>
                </div>

                <button
                  type="button"
                  onClick={handleRefresh}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors shadow-xs"
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-stone-400 ${isSyncing ? "animate-spin text-[#d97757]" : ""}`} />
                  <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
                </button>
              </div>
            </div>

            {/* Primary KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Acquisition Volume */}
              <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs relative overflow-hidden group hover:border-stone-400 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                    Acquisition Volume
                  </span>
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <p className="font-serif text-3xl font-bold text-zinc-950 mt-4">
                  {formattedRevenue}
                </p>
                <p className="text-[11px] text-stone-500 mt-1.5">
                  Verified & completed transactions
                </p>
              </div>

              {/* Active Orders (Not Cancelled) */}
              <Link
                href="/admin/orders"
                onClick={() => setActiveTab("orders")}
                className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs relative overflow-hidden group hover:border-amber-400 transition-all block"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                    Active Collector Orders
                  </span>
                  <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
                <p className="font-serif text-3xl font-bold text-amber-800 mt-4">
                  {activeOrders.length} {activeOrders.length === 1 ? "Order" : "Orders"}
                </p>
                <p className="text-[11px] text-amber-700/80 mt-1.5 flex items-center gap-1">
                  <span>
                    {pendingOrders.length > 0
                      ? `${pendingOrders.length} pending audit`
                      : "All orders in fulfillment"}
                  </span>
                  <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                </p>
              </Link>

              {/* Available Masterpieces */}
              <Link
                href="/admin/inventory"
                onClick={() => setActiveTab("inventory")}
                className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs relative overflow-hidden group hover:border-[#d97757] transition-all block"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                    Available Masterpieces
                  </span>
                  <div className="h-9 w-9 rounded-xl bg-orange-50 text-[#d97757] flex items-center justify-center">
                    <Palette className="h-4 w-4" />
                  </div>
                </div>
                <p className="font-serif text-3xl font-bold text-zinc-950 mt-4">
                  {availableArtworks.length}{" "}
                  <span className="text-sm font-normal text-stone-400">
                    / {initialArtworks.length} Total
                  </span>
                </p>
                <p className="text-[11px] text-stone-500 mt-1.5 flex items-center gap-1">
                  <span>Live across collector gallery</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                </p>
              </Link>
            </div>

            {/* Quick Navigation Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="rounded-2xl border border-stone-200/90 bg-white p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-zinc-950" />
                    <h3 className="font-serif text-lg font-semibold text-zinc-950">
                      Orders & Proofs Audits
                    </h3>
                  </div>
                  <Link
                    href="/admin/orders"
                    onClick={() => setActiveTab("orders")}
                    className="text-xs font-semibold text-[#d97757] hover:underline"
                  >
                    View All ({initialOrders.length}) &rarr;
                  </Link>
                </div>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Review collector payments, verify transaction proofs, confirm physical bank credits, and dispatch orders with real-time tracking numbers.
                </p>
                <div className="pt-2">
                  <Link
                    href="/admin/orders"
                    onClick={() => setActiveTab("orders")}
                    className="inline-flex items-center gap-2 rounded-xl bg-stone-100 hover:bg-stone-200 px-4 py-2.5 text-xs font-semibold text-stone-900 transition-colors"
                  >
                    <span>Open Orders Console</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-stone-500" />
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-stone-200/90 bg-white p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-zinc-950" />
                    <h3 className="font-serif text-lg font-semibold text-zinc-950">
                      Catalog Inventory Management
                    </h3>
                  </div>
                  <Link
                    href="/admin/inventory"
                    onClick={() => setActiveTab("inventory")}
                    className="text-xs font-semibold text-[#d97757] hover:underline"
                  >
                    View All ({initialArtworks.length}) &rarr;
                  </Link>
                </div>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Update inventory unit stock, manage 10-minute Redis concurrency locks, toggle availability status, and add new curated masterpieces.
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <Link
                    href="/admin/inventory"
                    onClick={() => setActiveTab("inventory")}
                    className="inline-flex items-center gap-2 rounded-xl bg-stone-100 hover:bg-stone-200 px-4 py-2.5 text-xs font-semibold text-stone-900 transition-colors"
                  >
                    <span>Open Inventory Console</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-stone-500" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "orders" ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-4">
              <div>
                <h1 className="font-serif text-2xl font-semibold text-zinc-950">
                  Collector Orders & Payment Proof Audits
                </h1>
                <p className="text-xs text-stone-500 mt-0.5">
                  Verify UTR transactions, manage white-glove dispatch, and audit acquisitions.
                </p>
              </div>
              <span className="text-xs font-mono text-stone-400">
                {orders.length} Total Registered
              </span>
            </div>

            <OrdersTable
              orders={orders}
              onOrderUpdated={handleRefresh}
            />
          </div>
        ) : activeTab === "analytics" ? (
          <div className="space-y-8 max-w-6xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 uppercase tracking-wider mb-2">
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span>Curatorial Sales Intelligence</span>
                </div>
                <h1 className="font-serif text-3xl font-semibold text-zinc-950">
                  Sales Statistics & Financial Breakdown
                </h1>
                <p className="text-xs text-stone-500 mt-1">
                  In-depth realization statistics across all artwork mediums, customer volume, and order lifecycle conversion.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors shadow-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-stone-400" />
                  <span>Update Data</span>
                </button>
              </div>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
              <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
                <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold block">
                  Gross Realized Sales
                </span>
                <p className="font-serif text-2xl font-bold text-zinc-950 mt-2">
                  {formattedRevenue}
                </p>
                <span className="text-[10px] text-emerald-700 font-medium mt-1 inline-flex items-center gap-1">
                  <span>From {verifiedOrders.length} verified acquisitions</span>
                </span>
              </div>

              <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
                <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold block">
                  Average Order Value (AOV)
                </span>
                <p className="font-serif text-2xl font-bold text-zinc-950 mt-2">
                  {verifiedOrders.length > 0
                    ? new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 0,
                      }).format(totalRevenue / verifiedOrders.length)
                    : "₹0"}
                </p>
                <span className="text-[10px] text-stone-500 mt-1 block">
                  Per completed collector order
                </span>
              </div>

              <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
                <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold block">
                  Total Orders Processed
                </span>
                <p className="font-serif text-2xl font-bold text-zinc-950 mt-2">
                  {initialOrders.length}
                </p>
                <span className="text-[10px] text-stone-500 mt-1 block">
                  {initialOrders.filter((o) => o.status !== "cancelled").length} active, {initialOrders.filter((o) => o.status === "cancelled").length} cancelled
                </span>
              </div>

              <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
                <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold block">
                  Inventory Realization Rate
                </span>
                <p className="font-serif text-2xl font-bold text-zinc-950 mt-2">
                  {initialArtworks.length > 0
                    ? `${Math.round(((initialArtworks.length - availableArtworks.length) / initialArtworks.length) * 100)}%`
                    : "0%"}
                </p>
                <span className="text-[10px] text-stone-500 mt-1 block">
                  {initialArtworks.length - availableArtworks.length} of {initialArtworks.length} pieces sold
                </span>
              </div>
            </div>

            {/* Sales Pipeline & Status Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Order Status Breakdown */}
              <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-4">
                <h3 className="font-serif text-lg font-semibold text-zinc-950">
                  Acquisition Pipeline Breakdown
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      label: "Payment Pending (Awaiting UTR audit)",
                      count: initialOrders.filter((o) => o.status === "payment_pending").length,
                      color: "bg-amber-500",
                      badgeBg: "bg-amber-100 text-amber-900",
                    },
                    {
                      label: "Verified & Confirmed",
                      count: initialOrders.filter((o) => o.status === "verified").length,
                      color: "bg-emerald-500",
                      badgeBg: "bg-emerald-100 text-emerald-900",
                    },
                    {
                      label: "In Transit / Dispatched",
                      count: initialOrders.filter((o) => o.status === "dispatched").length,
                      color: "bg-blue-500",
                      badgeBg: "bg-blue-100 text-blue-900",
                    },
                    {
                      label: "Out for White-Glove Delivery",
                      count: initialOrders.filter((o) => o.status === "out_for_delivery").length,
                      color: "bg-purple-500",
                      badgeBg: "bg-purple-100 text-purple-900",
                    },
                    {
                      label: "Successfully Delivered & Fulfilled",
                      count: initialOrders.filter((o) => o.status === "delivered").length,
                      color: "bg-teal-500",
                      badgeBg: "bg-teal-100 text-teal-900",
                    },
                    {
                      label: "Cancelled / Expired Sessions",
                      count: initialOrders.filter((o) => o.status === "cancelled").length,
                      color: "bg-red-400",
                      badgeBg: "bg-red-100 text-red-900",
                    },
                  ].map((item) => {
                    const percentage = initialOrders.length > 0
                      ? Math.round((item.count / initialOrders.length) * 100)
                      : 0;

                    return (
                      <div key={item.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-stone-700 font-medium">{item.label}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeBg}`}>
                            {item.count} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${item.color} transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Day-Wise Income & Orders Chart + Calendar Review */}
              <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-6">
                {/* Header & Date Picker */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-zinc-950 flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-[#d97757]" />
                      <span>Day-Wise Income & Orders Review</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Visual realization trend and day-by-day collector audit.
                    </p>
                  </div>

                  {/* Calendar Date Picker Controls */}
                  <div className="flex items-center gap-2">
                    <label htmlFor="calendar-date-picker" className="text-[11px] font-medium text-stone-500 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-stone-400" />
                      <span>Review Date:</span>
                    </label>
                    <input
                      id="calendar-date-picker"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-stone-300 bg-stone-50 text-xs text-stone-900 font-mono shadow-2xs focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Day-Wise Bar Chart for the Last 7 Days */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-700">
                      7-Day Revenue & Volume Trend
                    </span>
                    <div className="flex items-center gap-4 text-[11px]">
                      <span className="flex items-center gap-1.5 text-stone-600">
                        <span className="h-2.5 w-2.5 rounded-xs bg-[#d97757]" />
                        <span>Income (₹)</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-stone-600">
                        <span className="h-2.5 w-2.5 rounded-xs bg-zinc-900" />
                        <span>Orders</span>
                      </span>
                    </div>
                  </div>

                  {/* 7-Day Chart Grid */}
                  {(() => {
                    const days = Array.from({ length: 7 }, (_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() - (6 - i));
                      const dateKey = d.toISOString().split("T")[0];
                      const dayLabel = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

                      // Compute orders and income on this date
                      const dayOrders = initialOrders.filter((o) => {
                        const oDate = new Date(o.created_at).toISOString().split("T")[0];
                        return oDate === dateKey;
                      });

                      const dayIncome = dayOrders
                        .filter((o) => o.status !== "cancelled")
                        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

                      return {
                        dateKey,
                        dayLabel,
                        orderCount: dayOrders.length,
                        income: dayIncome,
                        isCurrentSelected: dateKey === selectedDate,
                      };
                    });

                    const maxIncome = Math.max(...days.map((d) => d.income), 10000);

                    return (
                      <div className="grid grid-cols-7 gap-2 pt-4 pb-2 border-b border-stone-100">
                        {days.map((day) => {
                          const heightPct = Math.max(10, Math.round((day.income / maxIncome) * 100));

                          return (
                            <button
                              key={day.dateKey}
                              type="button"
                              onClick={() => setSelectedDate(day.dateKey)}
                              className={`flex flex-col items-center justify-end h-44 p-2 rounded-xl transition-all ${
                                day.isCurrentSelected
                                  ? "bg-amber-50/90 border border-amber-300 shadow-2xs ring-1 ring-[#d97757]"
                                  : "hover:bg-stone-50 border border-transparent"
                              }`}
                            >
                              <div className="w-full flex items-end justify-center gap-1 h-28 pb-1">
                                {/* Income Bar */}
                                <div
                                  className="w-3 rounded-t-sm bg-[#d97757] transition-all hover:opacity-85"
                                  style={{ height: `${heightPct}%` }}
                                  title={`Income: ₹${day.income.toLocaleString("en-IN")}`}
                                />
                                {/* Orders Bar */}
                                <div
                                  className="w-3 rounded-t-sm bg-zinc-900 transition-all hover:opacity-85"
                                  style={{
                                    height: `${Math.max(8, Math.min(100, day.orderCount * 25))}%`,
                                  }}
                                  title={`Orders: ${day.orderCount}`}
                                />
                              </div>
                              <span className="text-[10px] font-mono text-zinc-900 font-semibold block mt-1">
                                {day.income > 0 ? `₹${Math.round(day.income / 1000)}k` : "₹0"}
                              </span>
                              <span className="text-[9px] text-stone-500 truncate text-center block mt-0.5">
                                {day.dayLabel}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Day-Wise Details for the Selected Date */}
                {(() => {
                  const selectedOrders = initialOrders.filter((o) => {
                    const oDate = new Date(o.created_at).toISOString().split("T")[0];
                    return oDate === selectedDate;
                  });

                  const selectedIncome = selectedOrders
                    .filter((o) => o.status !== "cancelled")
                    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

                  const formattedDateHeader = new Date(selectedDate + "T12:00:00").toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  });

                  return (
                    <div className="space-y-4 pt-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                            Audit Details for Selected Date
                          </span>
                          <p className="font-serif text-sm font-semibold text-zinc-900">
                            {formattedDateHeader}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <div>
                            <span className="text-stone-400 text-[10px] uppercase block">Day Orders</span>
                            <span className="font-mono font-bold text-zinc-950">{selectedOrders.length}</span>
                          </div>
                          <div>
                            <span className="text-stone-400 text-[10px] uppercase block">Realized Income</span>
                            <span className="font-mono font-bold text-emerald-800">
                              {new Intl.NumberFormat("en-IN", {
                                style: "currency",
                                currency: "INR",
                                maximumFractionDigits: 0,
                              }).format(selectedIncome)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Orders List on this Date */}
                      {selectedOrders.length === 0 ? (
                        <div className="text-center py-6 text-xs text-stone-400 border border-dashed border-stone-200 rounded-xl">
                          No collector acquisitions recorded on this date.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {selectedOrders.map((ord) => (
                            <div
                              key={ord.id}
                              className="p-3 rounded-xl border border-stone-200/70 bg-white hover:border-stone-400 transition-colors flex items-center justify-between text-xs"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-zinc-900">{ord.customer_name}</span>
                                  <span className="text-[10px] text-stone-400 font-mono">
                                    {new Date(ord.created_at).toLocaleTimeString("en-IN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                                <p className="text-[11px] text-stone-500">
                                  {ord.order_items.map((i) => i.artwork?.title || "Artwork").join(", ")}
                                </p>
                              </div>

                              <div className="text-right space-y-1">
                                <span className="font-mono font-bold text-zinc-950 block">
                                  {new Intl.NumberFormat("en-IN", {
                                    style: "currency",
                                    currency: "INR",
                                    maximumFractionDigits: 0,
                                  }).format(Number(ord.total_amount))}
                                </span>
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                    ord.status === "verified" || ord.status === "delivered"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : ord.status === "payment_pending"
                                      ? "bg-amber-100 text-amber-800"
                                      : ord.status === "dispatched" || ord.status === "out_for_delivery"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-stone-100 text-stone-600"
                                  }`}
                                >
                                  {ord.status.replace(/_/g, " ")}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
              <div>
                <h1 className="font-serif text-2xl font-semibold text-zinc-950">
                  Catalog Inventory & Concurrency Locks
                </h1>
                <p className="text-xs text-stone-500 mt-0.5">
                  Manage editions, edit stock units, and inspect real-time Redis 10-minute locks.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-zinc-950 via-stone-900 to-zinc-950 hover:from-[#d97757] hover:to-[#e8a86a] px-5 py-2.5 text-xs font-medium tracking-wide text-white shadow-sm hover:shadow-md transition-all duration-200 active:scale-98"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Masterpiece to Catalogue</span>
                </button>
              </div>
            </div>

            <InventoryTable
              artworks={artworks}
              lockedMap={locks}
              onInventoryUpdated={handleRefresh}
              onAddArtwork={() => setIsAddModalOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Add Masterpiece Modal */}
      <AddArtworkModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onArtworkCreated={handleRefresh}
      />
    </div>
  );
}
