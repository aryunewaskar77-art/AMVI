"use client";

import { useCartStore } from "@/store/useCartStore";
import Image from "next/image";
import Link from "next/link";
import { X, Trash2, ArrowRight, ShieldCheck, ShoppingBag } from "lucide-react";
import { useEffect } from "react";
import { useMounted } from "@/lib/useMounted";

export function CartDrawer() {
  const { isCartOpen, closeCart, items, removeItem, clearCart, getTotalPrice } =
    useCartStore();
  const mounted = useMounted();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isCartOpen) {
        closeCart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCartOpen, closeCart]);

  if (!mounted || !isCartOpen) {
    return null;
  }

  const subtotal = getTotalPrice();
  const formattedSubtotal = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(subtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-5">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-zinc-900" />
              <h2 className="font-serif text-lg font-medium text-zinc-950">
                Your Acquisition Bag
              </h2>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600">
                {items.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-[11px] text-zinc-400 hover:text-red-600 transition-colors uppercase tracking-wider"
                >
                  Clear Bag
                </button>
              )}
              <button
                onClick={closeCart}
                type="button"
                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                aria-label="Close cart drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-zinc-100">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center py-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 mb-4">
                  <ShoppingBag className="h-8 w-8" />
                </div>
                <h3 className="font-serif text-lg font-medium text-zinc-900">
                  Your bag is currently empty
                </h3>
                <p className="mt-1 max-w-xs text-xs text-zinc-500">
                  Explore our curated collection of original contemporary and traditional Indian masterpieces.
                </p>
                <button
                  type="button"
                  onClick={closeCart}
                  className="mt-6 rounded-full border border-zinc-950 px-5 py-2 text-xs font-medium uppercase tracking-wider text-zinc-950 hover:bg-zinc-950 hover:text-white transition-all"
                >
                  Browse Catalog
                </button>
              </div>
            ) : (
              items.map((item) => {
                const itemPrice = new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
                }).format(Number(item.price));

                return (
                  <div key={item.id} className="flex gap-4 py-4">
                    {/* Thumbnail */}
                    <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xs bg-zinc-100">
                      <Image
                        src={item.image_url}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <Link
                            href={`/artworks/${item.id}`}
                            onClick={closeCart}
                            className="font-serif text-sm font-medium text-zinc-900 hover:text-amber-800 transition-colors line-clamp-1"
                          >
                            {item.title}
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-zinc-400 hover:text-red-600 transition-colors p-1"
                            title="Remove artwork from bag"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-xs text-zinc-500">{item.artist_name}</p>
                        <p className="text-[11px] text-zinc-400">
                          {item.medium || "Original Work"} • {item.dimensions}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[11px] uppercase tracking-wider text-zinc-400">
                          Unique 1-of-1
                        </span>
                        <span className="font-serif text-sm font-semibold text-zinc-950">
                          {itemPrice}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout Action */}
          {items.length > 0 && (
            <div className="border-t border-zinc-200 bg-zinc-50/50 p-6 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>Artwork Subtotal</span>
                  <span className="font-medium text-zinc-900">{formattedSubtotal}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>Insured White-Glove Shipping</span>
                  <span className="text-emerald-700 font-medium">Complimentary</span>
                </div>
                <div className="flex items-center justify-between border-t border-zinc-200/80 pt-2 text-sm font-serif font-semibold text-zinc-950">
                  <span>Total Acquisition Amount</span>
                  <span>{formattedSubtotal}</span>
                </div>
              </div>

              {/* Provenance Badge */}
              <div className="flex items-center gap-2 rounded-xs border border-zinc-200 bg-white p-2.5 text-[11px] text-zinc-600">
                <ShieldCheck className="h-4 w-4 text-amber-700 shrink-0" />
                <span>Includes physical Certificate of Authenticity signed by artist.</span>
              </div>

              {/* Proceed to Checkout Button */}
              <Link
                href="/checkout"
                onClick={closeCart}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#d97757] to-[#e8a86a] py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all hover:opacity-95 shadow-md amvi-glow"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
