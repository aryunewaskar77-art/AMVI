import { Suspense } from "react";
import { getAvailableArtworks } from "@/lib/artworks";
import { getArtworkLockStatus } from "@/lib/locks";
import { ArtworkGridClient } from "@/components/catalog/ArtworkGridClient";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ArtworksPage() {
  const artworks = await getAvailableArtworks();

  const lockEntries = await Promise.all(
    artworks.map(async (artwork) => {
      const lock = await getArtworkLockStatus(artwork.id);
      return [artwork.id, lock.isLocked] as const;
    })
  );
  const lockedMap = Object.fromEntries(lockEntries);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      <div className="border-b border-zinc-200 pb-8">
        <h1 className="font-serif text-3xl sm:text-5xl font-normal text-zinc-950">
          The Gallery Collection
        </h1>
        <p className="mt-3 text-sm text-zinc-500 max-w-2xl font-light">
          Explore curated original compositions across traditional Madhubani, Thanjavur gold foil, modern impasto acrylics, and atmospheric watercolors.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
          </div>
        }
      >
        <ArtworkGridClient
          initialArtworks={artworks}
          lockedMap={lockedMap}
        />
      </Suspense>
    </div>
  );
}
