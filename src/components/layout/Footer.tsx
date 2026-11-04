"use client";

import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  // The footer should only render on the home page ("/")
  if (pathname !== "/") {
    return null;
  }

  return (
    <footer className="border-t border-stone-200/80 bg-white/70 backdrop-blur-md py-12 text-zinc-600">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <span className="font-serif font-semibold text-zinc-900 tracking-wider">
            AMVI
          </span>
          <span className="hidden sm:inline text-zinc-300">•</span>
          <span>Direct Artist Lineage & Authenticated Indian Masterpieces</span>
        </div>
        <p className="text-zinc-400">
          © {new Date().getFullYear()} AMVI Fine Art. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
