"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import {
  ShoppingBag,
  ShieldCheck,
  LogOut,
  User,
  LayoutGrid,
  Home,
  CheckCircle2,
} from "lucide-react";
import { useMounted } from "@/lib/useMounted";
import { logoutAction } from "@/app/actions/auth";

interface SessionUser {
  email: string;
  role: "admin" | "user";
  name: string;
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { items, openCart } = useCartStore();
  const mounted = useMounted();
  const [session, setSession] = useState<{
    isAuthenticated: boolean;
    user: SessionUser | null;
  }>({
    isAuthenticated: false,
    user: null,
  });

  const itemCount = mounted ? items.length : 0;
  const isAdminRoute = pathname?.startsWith("/admin");

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.isAuthenticated) {
          setSession(data);
        } else {
          setSession({ isAuthenticated: false, user: null });
        }
      })
      .catch(() => {
        setSession({ isAuthenticated: false, user: null });
      });
  }, [pathname]);

  // Don't render public AppSidebar inside /admin routes (admin has its own full sidebar)
  if (isAdminRoute) {
    return null;
  }

  const handleLogout = async () => {
    await logoutAction();
    setSession({ isAuthenticated: false, user: null });
    router.push("/login");
    router.refresh();
  };

  const navLinks = [
    {
      name: "Home",
      href: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      name: "The Gallery",
      href: "/artworks",
      icon: LayoutGrid,
      isActive: pathname?.startsWith("/artworks"),
    },
    {
      name: "Orders & Proofs",
      href: "/orders",
      icon: ShoppingBag,
      isActive: pathname?.startsWith("/orders"),
    },
  ];

  return (
    <aside className="w-full md:w-64 lg:w-72 md:fixed md:top-0 md:bottom-0 md:left-0 shrink-0 border-r border-stone-200/90 bg-white p-5 flex flex-col justify-between shadow-xs z-40 overflow-y-auto">
      <div className="space-y-7">
        {/* Brand Emblem / Logo & Typography */}
        <div className="pt-2">
          <Link href="/" className="group flex items-center gap-3.5">
            <div className="relative h-12 w-20 overflow-hidden rounded-md transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/amvi-logo.png"
                alt="AMVI Fine Art Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-2xl font-bold tracking-wider text-amvi-gradient">
                AMVI
              </span>
              <span className="text-[9px] tracking-[0.28em] uppercase text-stone-500 font-medium">
                Fine Art Gallery
              </span>
            </div>
          </Link>
        </div>

        {/* Global Navigation Links */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block px-2 mb-2">
            Navigation
          </span>
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all ${
                    link.isActive
                      ? "bg-zinc-950 text-white font-semibold shadow-xs"
                      : "text-stone-600 hover:bg-stone-50 hover:text-stone-950 font-medium"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}

            {/* Admin Console shortcut if user is admin */}
            {session.isAuthenticated && session.user?.role === "admin" && (
              <Link
                href="/admin"
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100/80 transition-colors border border-amber-200/70"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-[#d97757]" />
                  <span>Admin Console</span>
                </div>
                <span className="text-[9px] uppercase tracking-wider bg-amber-200/70 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                  Admin
                </span>
              </Link>
            )}
          </nav>
        </div>

        {/* Acquisition Collection Bag Trigger */}
        <div className="space-y-2 pt-2 border-t border-stone-100">
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block px-2">
            Curated Bag
          </span>
          <button
            onClick={openCart}
            type="button"
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-stone-200/90 bg-stone-50/70 text-xs font-semibold text-stone-800 transition-all hover:border-[#d97757] hover:text-[#d97757] hover:bg-white shadow-2xs group"
          >
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="h-4 w-4 text-[#d97757]" />
              <span>Acquisition Bag</span>
            </div>
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold transition-all ${
                itemCount > 0
                  ? "bg-gradient-to-r from-[#d97757] to-[#e8a86a] text-white shadow-2xs"
                  : "bg-stone-200/70 text-stone-600"
              }`}
            >
              {itemCount}
            </span>
          </button>
        </div>

        {/* Authenticity Guarantee Card */}
        <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/70 space-y-1.5">
          <div className="flex items-center gap-1.5 text-stone-700">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#78a98f]" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              100% Provenance
            </span>
          </div>
          <p className="text-[11px] text-stone-500 leading-relaxed font-light">
            Every masterwork carries physical authenticity documentation and direct artist lineage.
          </p>
        </div>
      </div>

      {/* Collector Session & Profile / Sign In / Log Out */}
      <div className="pt-6 border-t border-stone-200/80 space-y-3">
        {session.isAuthenticated ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="h-8 w-8 rounded-full bg-stone-100 border border-stone-300 flex items-center justify-center text-[#d97757]">
                <User className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-stone-900 truncate">
                  {session.user?.name || "Collector"}
                </span>
                <span className="text-[11px] text-stone-400 truncate">
                  {session.user?.email}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:text-red-700 hover:bg-red-50/70 border border-stone-200 hover:border-red-200 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-950 text-white hover:bg-[#d97757] text-xs font-semibold uppercase tracking-wider transition-colors shadow-2xs"
            >
              <User className="h-3.5 w-3.5" />
              <span>Collector Sign In</span>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
