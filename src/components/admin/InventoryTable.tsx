"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  toggleArtworkAvailabilityAction,
  deleteArtworkAction,
  updateArtworkQuantityAction,
} from "@/app/actions/admin";
import type { Artwork } from "@/types/database.types";
import {
  Check,
  Clock,
  Eye,
  AlertCircle,
  Loader2,
  Trash2,
  Edit2,
  Plus,
  Minus,
  Save,
  X,
} from "lucide-react";

interface InventoryTableProps {
  artworks: Artwork[];
  lockedMap?: Record<string, boolean>;
  onInventoryUpdated?: () => void;
  onAddArtwork?: () => void;
}

export function InventoryTable({
  artworks,
  lockedMap = {},
  onInventoryUpdated,
  onAddArtwork,
}: InventoryTableProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempQty, setTempQty] = useState<number>(1);
  const [, startTransition] = useTransition();

  const handleStartEditQty = (artwork: Artwork) => {
    const current =
      typeof artwork.quantity === "number"
        ? artwork.quantity
        : artwork.is_available
        ? 1
        : 0;
    setEditingStockId(artwork.id);
    setTempQty(current);
  };

  const handleSaveQty = (artworkId: string) => {
    setUpdatingId(artworkId);
    startTransition(async () => {
      const res = await updateArtworkQuantityAction(artworkId, tempQty);
      setUpdatingId(null);
      setEditingStockId(null);
      if (res.success) {
        onInventoryUpdated?.();
      } else {
        alert(res.message || "Failed to update stock quantity.");
      }
    });
  };

  const handleQuickAdjustQty = (artworkId: string, currentStock: number, delta: number) => {
    const nextStock = Math.max(0, currentStock + delta);
    setUpdatingId(artworkId);
    startTransition(async () => {
      const res = await updateArtworkQuantityAction(artworkId, nextStock);
      setUpdatingId(null);
      if (res.success) {
        onInventoryUpdated?.();
      } else {
        alert(res.message || "Failed to adjust stock quantity.");
      }
    });
  };

  const handleToggle = (artworkId: string, currentAvailable: boolean) => {
    setUpdatingId(artworkId);
    startTransition(async () => {
      const res = await toggleArtworkAvailabilityAction(
        artworkId,
        !currentAvailable
      );
      setUpdatingId(null);
      if (res.success) {
        onInventoryUpdated?.();
      } else {
        alert(res.message || "Failed to toggle availability.");
      }
    });
  };

  const handleDelete = (artworkId: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      return;
    }

    setUpdatingId(artworkId);
    startTransition(async () => {
      const res = await deleteArtworkAction(artworkId);
      setUpdatingId(null);
      if (res.success) {
        if (res.message) alert(res.message);
        onInventoryUpdated?.();
      } else {
        alert(res.message || "Failed to delete artwork.");
      }
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
      {onAddArtwork && (
        <div className="px-5 py-3 border-b border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-900">
              Catalog Inventory
            </span>
            <span className="text-[11px] text-zinc-400">
              ({artworks.length} items cataloged • 0-unit items preserved for admin)
            </span>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-zinc-600 divide-y divide-zinc-200">
          <thead className="bg-zinc-50/80 font-semibold uppercase tracking-wider text-zinc-900 text-[11px]">
            <tr>
              <th className="px-5 py-4">Artwork Piece</th>
              <th className="px-5 py-4">Artist</th>
              <th className="px-5 py-4">Medium & Dimensions</th>
              <th className="px-5 py-4">Valuation (INR)</th>
              <th className="px-5 py-4">Units / Stock</th>
              <th className="px-5 py-4">Hold / Reservation</th>
              <th className="px-5 py-4">Catalog Status</th>
              <th className="px-5 py-4 text-right">Availability Toggle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 font-normal">
            {artworks.map((artwork) => {
              const isLocked = Boolean(lockedMap[artwork.id]);
              const isUpdating = updatingId === artwork.id;
              const stock = typeof artwork.quantity === "number" ? artwork.quantity : (artwork.is_available ? 1 : 0);

              const formattedPrice = new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              }).format(Number(artwork.price));

              return (
                <tr key={artwork.id} className="hover:bg-zinc-50/60 transition-colors">
                  {/* Artwork Piece */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-xs bg-zinc-100">
                        <Image
                          src={artwork.image_url}
                          alt={artwork.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <Link
                          href={`/artworks/${artwork.id}`}
                          target="_blank"
                          className="font-serif text-sm font-medium text-zinc-900 hover:text-amber-800 transition-colors inline-flex items-center gap-1"
                        >
                          <span>{artwork.title}</span>
                          <Eye className="h-3 w-3 text-zinc-400" />
                        </Link>
                        <p className="font-mono text-[10px] text-zinc-400">
                          {artwork.id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Artist */}
                  <td className="px-5 py-4 font-medium text-zinc-900">
                    {artwork.artist_name}
                  </td>

                  {/* Medium & Dimensions */}
                  <td className="px-5 py-4">
                    <p className="text-zinc-800">{artwork.medium || "Original Work"}</p>
                    <p className="text-[11px] text-zinc-400">{artwork.dimensions}</p>
                  </td>

                  {/* Valuation */}
                  <td className="px-5 py-4 font-serif font-semibold text-zinc-950 text-sm">
                    {formattedPrice}
                  </td>

                  {/* Stock Units / Edit Quantity */}
                  <td className="px-5 py-4">
                    {editingStockId === artwork.id ? (
                      <div className="flex items-center gap-1.5 bg-zinc-50 p-1.5 rounded-lg border border-zinc-300">
                        <button
                          type="button"
                          onClick={() => setTempQty((q) => Math.max(0, q - 1))}
                          className="h-6 w-6 rounded bg-white border border-zinc-200 flex items-center justify-center text-zinc-700 hover:bg-zinc-100"
                        >
                          <Minus className="h-3 w-3" />
                        </button>

                        <input
                          type="number"
                          min={0}
                          max={9999}
                          value={tempQty}
                          onChange={(e) =>
                            setTempQty(Math.max(0, parseInt(e.target.value, 10) || 0))
                          }
                          className="w-12 text-center font-mono text-xs font-bold text-zinc-950 bg-white border border-zinc-200 rounded py-0.5"
                        />

                        <button
                          type="button"
                          onClick={() => setTempQty((q) => q + 1)}
                          className="h-6 w-6 rounded bg-white border border-zinc-200 flex items-center justify-center text-zinc-700 hover:bg-zinc-100"
                        >
                          <Plus className="h-3 w-3" />
                        </button>

                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleSaveQty(artwork.id)}
                          className="h-6 px-2 rounded bg-zinc-950 text-white flex items-center justify-center text-[10px] font-semibold hover:bg-zinc-800 disabled:opacity-50 ml-1"
                          title="Save Quantity"
                        >
                          {isUpdating ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Save className="h-3 w-3" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingStockId(null)}
                          className="h-6 w-6 rounded bg-zinc-200 text-zinc-600 flex items-center justify-center hover:bg-zinc-300"
                          title="Cancel"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={isUpdating || stock <= 0}
                            onClick={() => handleQuickAdjustQty(artwork.id, stock, -1)}
                            className="h-5 w-5 rounded border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-30 flex items-center justify-center"
                            title="Decrease 1 Unit"
                          >
                            <Minus className="h-2.5 w-2.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStartEditQty(artwork)}
                            className="px-2 py-0.5 rounded border border-transparent hover:border-zinc-300 hover:bg-stone-50 transition-colors text-left"
                            title="Click to edit quantity"
                          >
                            {stock > 0 ? (
                              <span className="font-mono text-xs font-semibold text-zinc-950">
                                {stock} unit{stock !== 1 ? "s" : ""}
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-800 uppercase">
                                Out of Stock (0)
                              </span>
                            )}
                          </button>

                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleQuickAdjustQty(artwork.id, stock, 1)}
                            className="h-5 w-5 rounded border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 flex items-center justify-center"
                            title="Add 1 Unit"
                          >
                            <Plus className="h-2.5 w-2.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleStartEditQty(artwork)}
                          className="text-zinc-400 hover:text-zinc-800 opacity-60 hover:opacity-100 transition-opacity"
                          title="Edit quantity"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Redis Hold Status */}
                  <td className="px-5 py-4">
                    {isLocked ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                        <Clock className="h-3 w-3" />
                        10-Min Redis Hold
                      </span>
                    ) : (
                      <span className="text-[11px] text-zinc-400">No active hold</span>
                    )}
                  </td>

                  {/* Catalog Status */}
                  <td className="px-5 py-4">
                    {artwork.is_available && stock > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                        <Check className="h-3 w-3" />
                        Available for Sale
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-600">
                        <AlertCircle className="h-3 w-3" />
                        Out of Stock / Sold
                      </span>
                    )}
                  </td>


                  {/* Actions: Toggle & Delete */}
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleToggle(artwork.id, artwork.is_available)}
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 ${
                          artwork.is_available
                            ? "border border-zinc-300 text-zinc-700 hover:border-zinc-950 hover:bg-zinc-100"
                            : "bg-zinc-950 text-white hover:bg-zinc-800"
                        }`}
                      >
                        {isUpdating ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : null}
                        <span>
                          {artwork.is_available ? "Mark Sold" : "Make Available"}
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleDelete(artwork.id, artwork.title)}
                        className="inline-flex items-center gap-1 rounded-full border border-red-200 px-2.5 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Delete Piece"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
