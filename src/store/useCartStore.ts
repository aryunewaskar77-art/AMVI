import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Artwork } from "@/types/database.types";

interface CartState {
  items: Artwork[];
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (artwork: Artwork) => boolean;
  removeItem: (artworkId: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,

      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

      /**
       * Adds an artwork to the cart.
       * Since fine art pieces are unique (1-of-1), duplicate additions are blocked.
       * Opens the cart drawer immediately upon addition.
       */
      addItem: (artwork: Artwork) => {
        const { items } = get();
        const alreadyInCart = items.some((item) => item.id === artwork.id);

        if (alreadyInCart) {
          set({ isCartOpen: true });
          return false;
        }

        set({
          items: [...items, artwork],
          isCartOpen: true,
        });
        return true;
      },

      removeItem: (artworkId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== artworkId),
        }));
      },

      clearCart: () => {
        set({ items: [], isCartOpen: false });
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem("amvi-cart-storage");
          } catch {
            // ignore
          }
        }
      },

      getTotalPrice: () => {
        return get().items.reduce((sum, item) => sum + Number(item.price || 0), 0);
      },
    }),
    {
      name: "amvi-cart-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
