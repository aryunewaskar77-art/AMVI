"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { Artwork } from "@/types/database.types";
import { ArtworkCard } from "./ArtworkCard";

interface ArtworkGridClientProps {
  initialArtworks: Artwork[];
  lockedMap?: Record<string, boolean>;
}

export function ArtworkGridClient({
  initialArtworks,
  lockedMap = {},
}: ArtworkGridClientProps) {
  const searchParams = useSearchParams();
  const urlQuery = searchParams?.get("q") || "";
  const selectedCategory = searchParams?.get("category") || "All";

  const filteredArtworks = useMemo(() => {
    return initialArtworks.filter((artwork) => {
      // 1. Category match
      let matchesCategory = true;
      if (selectedCategory && selectedCategory !== "All") {
        const catQuery = selectedCategory.toLowerCase();
        const medium = (artwork.medium || "").toLowerCase();
        const title = (artwork.title || "").toLowerCase();
        const desc = (artwork.description || "").toLowerCase();
        matchesCategory =
          medium.includes(catQuery) ||
          title.includes(catQuery) ||
          desc.includes(catQuery);
      }

      // 2. Search query match
      let matchesSearch = true;
      if (urlQuery.trim()) {
        const q = urlQuery.toLowerCase().trim();
        const title = (artwork.title || "").toLowerCase();
        const artist = (artwork.artist_name || "").toLowerCase();
        const medium = (artwork.medium || "").toLowerCase();
        const desc = (artwork.description || "").toLowerCase();
        matchesSearch =
          title.includes(q) ||
          artist.includes(q) ||
          medium.includes(q) ||
          desc.includes(q);
      }

      return matchesCategory && matchesSearch;
    });
  }, [initialArtworks, selectedCategory, urlQuery]);

  return (
    <div className="w-full space-y-6">
      {/* Header Info Status */}
      <div className="flex items-center justify-between text-xs text-stone-500 pb-2">
        <span>
          Showing <strong className="text-stone-900">{filteredArtworks.length}</strong> masterwork{filteredArtworks.length !== 1 ? "s" : ""}
        </span>
        {selectedCategory !== "All" && (
          <span className="font-mono text-[11px] bg-stone-100 px-3 py-1 rounded-full text-stone-700 font-medium">
            Medium: {selectedCategory}
          </span>
        )}
      </div>

      {filteredArtworks.length === 0 ? (
        <div className="py-24 text-center rounded-2xl border border-stone-200 bg-white p-8 space-y-3">
          <p className="font-serif text-lg text-stone-700 font-medium">
            No artworks match your search or filter.
          </p>
          <p className="text-xs text-stone-400">
            Try adjusting your search query or switching back to &quot;All&quot; mediums.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredArtworks.map((artwork) => (
            <ArtworkCard
              key={artwork.id}
              artwork={artwork}
              isLocked={Boolean(lockedMap[artwork.id])}
            />
          ))}
        </div>
      )}
    </div>
  );
}
