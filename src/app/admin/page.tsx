import { getAdminOrdersAction } from "@/app/actions/admin";
import { getAllArtworksForAdmin } from "@/lib/artworks";
import { getArtworkLockStatus } from "@/lib/locks";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Fetch orders and inventory in parallel
  const [orders, artworks] = await Promise.all([
    getAdminOrdersAction(),
    getAllArtworksForAdmin(),
  ]);

  // Query Redis lock status for all artworks
  const lockEntries = await Promise.all(
    artworks.map(async (art) => {
      const lock = await getArtworkLockStatus(art.id);
      return [art.id, lock.isLocked] as const;
    })
  );
  const lockedMap = Object.fromEntries(lockEntries);

  return (
    <AdminDashboardClient
      initialOrders={orders}
      initialArtworks={artworks}
      lockedMap={lockedMap}
      initialTab="pulse"
    />
  );
}
