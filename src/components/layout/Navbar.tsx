"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";

const FILTER_CATEGORIES = [
  "All",
  "Madhubani",
  "Tanjore",
  "Contemporary",
  "Modernist",
  "Watercolor",
  "Acrylic",
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentQ = searchParams?.get("q") || "";
  const currentCategory = searchParams?.get("category") || "All";

  const [searchTerm, setSearchTerm] = useState(currentQ);

  useEffect(() => {
    setSearchTerm(currentQ);
  }, [currentQ]);

  // If we are on /admin, hide this top navbar because the Admin portal has its own layout
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    if (searchTerm.trim()) {
      params.set("q", searchTerm.trim());
    } else {
      params.delete("q");
    }
    router.push(`/artworks?${params.toString()}`);
  };

  const handleCategorySelect = (category: string) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    if (category === "All") {
      params.delete("category");
    } else {
      params.set("category", category);
    }
    router.push(`/artworks?${params.toString()}`);
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-stone-200/80 bg-white/95 backdrop-blur-md transition-all shadow-2xs">
      <div className="mx-auto flex flex-col items-center justify-center px-4 sm:px-6 py-3.5 space-y-3 max-w-5xl">
        {/* Top Centered Search Bar */}
        <form onSubmit={handleSearch} className="relative w-full max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            name="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search masterworks, artists, mediums..."
            className="w-full pl-11 pr-5 py-2.5 rounded-full border border-stone-300 bg-stone-50/80 text-xs text-stone-900 placeholder-stone-400 shadow-2xs focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white transition-all"
          />
        </form>

        {/* Filter Pills right below the search bar */}
        <div className="flex items-center justify-center gap-1.5 overflow-x-auto no-scrollbar w-full py-0.5">
          {FILTER_CATEGORIES.map((cat) => {
            const isSelected =
              currentCategory === cat || (cat === "All" && !searchParams?.get("category"));
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wider transition-all duration-150 ${
                  isSelected
                    ? "bg-zinc-950 text-white shadow-xs"
                    : "border border-stone-200 bg-white text-stone-600 hover:border-stone-400 hover:text-stone-900"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
