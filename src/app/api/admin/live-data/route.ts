import { NextResponse } from "next/server";
import { getAdminOrdersAction } from "@/app/actions/admin";
import { getAllArtworksForAdmin } from "@/lib/artworks";
import { getArtworkLockStatus } from "@/lib/locks";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const [orders, artworks] = await Promise.all([
      getAdminOrdersAction(),
      getAllArtworksForAdmin(),
    ]);

    const lockEntries = await Promise.all(
      artworks.map(async (art) => {
        const lock = await getArtworkLockStatus(art.id);
        return [art.id, lock.isLocked] as const;
      })
    );
    const lockedMap = Object.fromEntries(lockEntries);

    return NextResponse.json(
      {
        orders,
        artworks,
        lockedMap,
        timestamp: Date.now(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[api/admin/live-data GET Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch live admin data" },
      { status: 500 }
    );
  }
}
