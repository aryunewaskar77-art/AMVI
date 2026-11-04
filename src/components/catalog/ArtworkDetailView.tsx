"use client";

import { useState, useRef, MouseEvent } from "react";
import Image from "next/image";
import type { Artwork } from "@/types/database.types";
import { useCartStore } from "@/store/useCartStore";
import {
  Sparkles,
  Check,
  ShieldCheck,
  Truck,
  Palette,
  Maximize2,
} from "lucide-react";

interface ArtworkDetailViewProps {
  artwork: Artwork;
  isLocked?: boolean;
}

export function ArtworkDetailView({
  artwork,
  isLocked = false,
}: ArtworkDetailViewProps) {
  const { addItem, items } = useCartStore();
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  const isInCart = items.some((item) => item.id === artwork.id);

  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(artwork.price));

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const { left, top, width, height } =
      containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePosition({ x, y });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
      {/* High-Resolution Artwork Viewer with Hover Magnification */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <div
          ref={containerRef}
          onMouseEnter={() => setIsZoomed(true)}
          onMouseLeave={() => setIsZoomed(false)}
          onMouseMove={handleMouseMove}
          className="relative aspect-4/5 w-full overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 cursor-crosshair shadow-md select-none"
        >
          <Image
            src={artwork.image_url}
            alt={artwork.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 60vw"
            className={`object-cover transition-transform duration-200 ${
              isZoomed ? "scale-225" : "scale-100"
            }`}
            style={
              isZoomed
                ? {
                    transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                  }
                : undefined
            }
          />

          {/* Hint Overlay */}
          {!isZoomed && (
            <div className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold tracking-wider text-stone-800 uppercase backdrop-blur-md shadow-xs pointer-events-none">
              <Maximize2 className="h-3.5 w-3.5 text-[#d97757]" />
              Hover to Magnify
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
            {!artwork.is_available || artwork.quantity === 0 ? (
              <span className="inline-flex items-center rounded-full bg-stone-900/90 px-3 py-1 text-xs font-semibold tracking-wider text-white uppercase backdrop-blur-sm">
                Out of Stock / Acquired
              </span>
            ) : isLocked ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d97757]/95 px-3 py-1 text-xs font-semibold tracking-wider text-white uppercase backdrop-blur-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                Reserved by Collector
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#78a98f]/95 px-3 py-1 text-xs font-semibold tracking-wider text-white uppercase backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-white" />
                Available ({typeof artwork.quantity === "number" ? `${artwork.quantity} in stock` : "In stock"})
              </span>
            )}
          </div>
        </div>


        <p className="text-center text-xs text-stone-400">
          Photographed under 5000K museum-grade CRI 98 balanced daylight illumination.
        </p>
      </div>

      {/* Piece Information & Acquisition Controls */}
      <div className="lg:col-span-5 flex flex-col justify-between space-y-8">
        <div className="space-y-6">
          <div>
            <span className="text-xs font-bold tracking-widest text-[#d97757] uppercase">
              {artwork.medium || "Original Work"}
            </span>
            <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-normal text-stone-950 tracking-tight leading-snug">
              {artwork.title}
            </h1>
            <p className="mt-2 text-base text-stone-600 font-medium">
              By {artwork.artist_name}
            </p>
          </div>

          {/* Valuation / Price */}
          <div className="border-y border-stone-200/90 py-5">
            <span className="text-[10px] font-semibold tracking-widest text-stone-400 uppercase">
              Collector Valuation
            </span>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="font-serif text-3xl font-bold text-stone-900">
                {formattedPrice}
              </span>
              <span className="text-xs text-stone-500">Taxes & Insurance included</span>
            </div>
          </div>

          {/* Curatorial Description */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-stone-900">
              Curatorial Commentary
            </h2>
            <p className="text-sm leading-relaxed text-stone-600">
              {artwork.description ||
                "A distinguished one-of-a-kind original composition exemplifying the artistic lineage and rigorous technical precision of authentic Indian artistic traditions."}
            </p>
          </div>

          {/* Technical Specifications */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-stone-900">
              Physical Specifications
            </h2>
            <dl className="grid grid-cols-2 gap-4 rounded-xl border border-stone-200 bg-white/80 p-4 text-xs shadow-xs">
              <div>
                <dt className="text-stone-400 uppercase tracking-wider text-[10px] font-semibold">
                  Medium
                </dt>
                <dd className="mt-0.5 font-medium text-stone-800">
                  {artwork.medium || "Mixed Medium"}
                </dd>
              </div>
              <div>
                <dt className="text-stone-400 uppercase tracking-wider text-[10px] font-semibold">
                  Dimensions
                </dt>
                <dd className="mt-0.5 font-medium text-stone-800">
                  {artwork.dimensions || "Dimensions on inquiry"}
                </dd>
              </div>
              <div>
                <dt className="text-stone-400 uppercase tracking-wider text-[10px] font-semibold">
                  Edition
                </dt>
                <dd className="mt-0.5 font-medium text-stone-800">Unique (1 of 1)</dd>
              </div>
              <div>
                <dt className="text-stone-400 uppercase tracking-wider text-[10px] font-semibold">
                  Framing
                </dt>
                <dd className="mt-0.5 font-medium text-stone-800">
                  Archival Conservation Mount
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Acquisition Action & Guarantees */}
        <div className="space-y-6 pt-6 border-t border-stone-200">
          <button
            type="button"
            disabled={!artwork.is_available || artwork.quantity === 0 || isInCart}
            onClick={() => addItem(artwork)}
            className={`flex w-full items-center justify-center gap-2 rounded-full py-4 text-xs font-bold uppercase tracking-widest transition-all shadow-md ${
              !artwork.is_available || artwork.quantity === 0
                ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                : isInCart
                ? "bg-[#569172] text-white cursor-default"
                : "bg-gradient-to-r from-[#d97757] via-[#e8a86a] to-[#d97757] text-white hover:opacity-95 amvi-glow"
            }`}
          >
            {!artwork.is_available || artwork.quantity === 0 ? (
              "Out of Stock / Acquired"
            ) : isInCart ? (
              <>
                <Check className="h-4 w-4" />
                Reserved in Your Bag
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-white" />
                Acquire Artwork
              </>
            )}
          </button>


          {/* Provenance & Shipping Badges */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2 text-[11px] text-stone-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#d97757] shrink-0" />
              <span>COA Authenticity Guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-[#569172] shrink-0" />
              <span>White-Glove Insured Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-[#3d8fac] shrink-0" />
              <span>Direct Artist Provenance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
