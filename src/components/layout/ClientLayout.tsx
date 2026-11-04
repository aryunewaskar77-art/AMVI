"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return (
      <div className="relative z-10 flex min-h-screen flex-col">
        <main className="flex-1">{children}</main>
        <CartDrawer />
      </div>
    );
  }

  return (
    <div className="relative z-10 flex min-h-screen flex-col md:flex-row">
      {/* Fixed Left Sidebar (w-64 on md, w-72 on lg) */}
      <AppSidebar />

      {/* Main Content Area offset by sidebar width on desktop */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64 lg:pl-72">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>

      <CartDrawer />
    </div>
  );
}
