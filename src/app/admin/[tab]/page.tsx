import { notFound } from "next/navigation";
import { getAdminOrdersAction } from "@/app/actions/admin";
import { getAllArtworksForAdmin } from "@/lib/artworks";
import { getArtworkLockStatus } from "@/lib/locks";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const dynamic = "force-dynamic";

interface AdminSubRouteProps {
  params: Promise<{
    tab: string;
  }>;
}

export default async function AdminSubRoutePage({
  params,
}: AdminSubRouteProps) {
  const { tab } = await params;

  // Map allowed sub-route names: pulse, orders, inventory, analytics
  let initialTab: "pulse" | "orders" | "inventory" | "analytics" = "pulse";
  if (tab === "orders" || tab === "orders-and-proofs") {
    initialTab = "orders";
  } else if (tab === "inventory" || tab === "catalog-inventory" || tab === "catalog") {
    initialTab = "inventory";
  } else if (tab === "pulse" || tab === "gallery-pulse" || tab === "overview") {
    initialTab = "pulse";
  } else if (tab === "analytics" || tab === "sales-statistics" || tab === "statistics") {
    initialTab = "analytics";
  } else {
    // If unknown name, default to pulse
    initialTab = "pulse";
  }

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
      initialTab={initialTab}
    />
  );
}
