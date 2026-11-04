"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Palette,
  PlusCircle,
  ArrowUpRight,
  LogOut,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

interface AdminHeaderProps {
  activeTab: "orders" | "inventory";
  onTabChange: (tab: "orders" | "inventory") => void;
  onOpenAddModal: () => void;
  pendingCount: number;
  totalArtworksCount: number;
}

export function AdminHeader({
  activeTab,
  onTabChange,
  onOpenAddModal,
  pendingCount,
  totalArtworksCount,
}: AdminHeaderProps) {
  const router = useRouter();

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-950 text-white">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl font-semibold text-zinc-950">
                  AMVI Curatorial Console
                </span>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-amber-900 uppercase">
                  Admin Portal
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Provenance Verification & Inventory Operations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAddModal}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full bg-zinc-950 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-amber-900 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Catalog Masterpiece</span>
            </button>

            <Link
              href="/artworks"
              className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-3.5 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-950 transition-colors"
            >
              <span>Public Gallery</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>

            <button
              type="button"
              onClick={async () => {
                await logoutAction();
                router.push("/login");
                router.refresh();
              }}
              className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-8 border-t border-zinc-100 text-xs font-medium">
          <button
            type="button"
            onClick={() => onTabChange("orders")}
            className={`flex items-center gap-2 border-b-2 py-4 uppercase tracking-wider transition-colors ${
              activeTab === "orders"
                ? "border-zinc-950 text-zinc-950 font-semibold"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Orders & Payment Verifications</span>
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onTabChange("inventory")}
            className={`flex items-center gap-2 border-b-2 py-4 uppercase tracking-wider transition-colors ${
              activeTab === "inventory"
                ? "border-zinc-950 text-zinc-950 font-semibold"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Palette className="h-4 w-4" />
            <span>Masterpiece Inventory</span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600 font-semibold">
              {totalArtworksCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
