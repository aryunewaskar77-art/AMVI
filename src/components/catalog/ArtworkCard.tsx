"use client";

import Image from "next/image";
import Link from "next/link";
import type { Artwork } from "@/types/database.types";
import { useCartStore } from "@/store/useCartStore";
import { Sparkles, Eye, Check } from "lucide-react";
import { useMounted } from "@/lib/useMounted";

interface ArtworkCardProps {
  artwork: Artwork;
  isLocked?: boolean;
}

export function ArtworkCard({ artwork, isLocked = false }: ArtworkCardProps) {
  const { addItem, items } = useCartStore();
  const mounted = useMounted();

  const isInCart = mounted && items.some((item) => item.id === artwork.id);

  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(artwork.price));

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-stone-200/90 bg-white transition-all duration-300 hover:border-[#e8a86a] hover:shadow-lg">
      {/* Thumbnail Container */}
      <Link
        href={`/artworks/${artwork.id}`}
        className="relative aspect-4/5 w-full overflow-hidden bg-stone-100"
      >
        <Image
          src={artwork.image_url}
          alt={artwork.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Live Status Badge */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
          {!artwork.is_available || artwork.quantity === 0 ? (
            <span className="inline-flex items-center rounded-full bg-stone-900/90 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-white uppercase backdrop-blur-sm">
              Out of Stock
            </span>
          ) : isLocked ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#d97757]/90 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-white uppercase backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              On Hold
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#78a98f]/90 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-white uppercase backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              Available {typeof artwork.quantity === "number" && artwork.quantity > 1 ? `(${artwork.quantity})` : ""}
            </span>
          )}
        </div>


        {/* Hover View Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-stone-900 shadow-md backdrop-blur-sm">
            <Eye className="h-3.5 w-3.5 text-[#d97757]" />
            Inspect Details
          </span>
        </div>
      </Link>

      {/* Artwork Metadata */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex-1">
          <p className="text-[10px] font-semibold tracking-widest text-[#d97757] uppercase">
            {artwork.medium || "Original Artwork"}
          </p>
          <Link href={`/artworks/${artwork.id}`}>
            <h3 className="mt-1 font-serif text-lg font-medium text-stone-900 transition-colors group-hover:text-[#d97757]">
              {artwork.title}
            </h3>
          </Link>
          <p className="text-xs text-stone-600 font-medium">{artwork.artist_name}</p>
          {artwork.dimensions && (
            <p className="mt-1 text-[11px] text-stone-400">{artwork.dimensions}</p>
          )}
        </div>

        {/* Pricing and Action */}
        <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4">
          <div>
            <span className="text-[10px] tracking-wider text-stone-400 uppercase font-medium">
              Acquisition Value
            </span>
            <p className="font-serif text-lg font-bold text-stone-900">
              {formattedPrice}
            </p>
          </div>

          {artwork.is_available && (
            <button
              type="button"
              disabled={isInCart}
              onClick={() => addItem(artwork)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all shadow-xs ${
                isInCart
                  ? "bg-stone-100 text-stone-500 cursor-default"
                  : "bg-gradient-to-r from-[#d97757] to-[#e8a86a] text-white hover:opacity-95"
              }`}
            >
              {isInCart ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[#569172]" />
                  In Bag
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                  Acquire
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
