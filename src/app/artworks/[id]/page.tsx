import { getArtworkById } from "@/lib/artworks";
import { getArtworkLockStatus } from "@/lib/locks";
import { ArtworkDetailView } from "@/components/catalog/ArtworkDetailView";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const revalidate = 60;

interface ArtworkPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ArtworkPage({ params }: ArtworkPageProps) {
  const { id } = await params;
  const artwork = await getArtworkById(id);

  if (!artwork) {
    notFound();
  }

  const lock = await getArtworkLockStatus(artwork.id);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-zinc-500">
        <Link
          href="/artworks"
          className="inline-flex items-center gap-1 hover:text-zinc-950 transition-colors uppercase tracking-wider"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to Gallery
        </Link>
        <span>/</span>
        <span className="text-zinc-800 font-medium truncate max-w-xs">
          {artwork.title}
        </span>
      </nav>

      {/* Detail View */}
      <ArtworkDetailView artwork={artwork} isLocked={lock.isLocked} />
    </div>
  );
}
