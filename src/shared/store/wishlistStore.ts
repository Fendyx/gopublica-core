import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchWishlist, addToWishlist, removeFromWishlist } from '@/entities/wishlist/api';

interface WishlistState {
  /** Product IDs the user has wishlisted. */
  items: string[];
  /** Whether the initial server load has completed. */
  loaded: boolean;
  /** Toggle a product in/out of the wishlist (optimistic update). */
  toggle: (productId: string) => void;
  /** Check if a product is wishlisted. */
  isWishlisted: (productId: string) => boolean;
  /** Load wishlisted IDs from the server (called on mount when JWT exists). */
  loadFromServer: () => Promise<void>;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      loaded: false,

      toggle: (productId) => {
        const { items } = get();
        const isCurrentlyWishlisted = items.includes(productId);

        // Optimistic update — flip instantly for snappy UI
        set({
          items: isCurrentlyWishlisted
            ? items.filter((id) => id !== productId)
            : [...items, productId],
        });

        // Fire-and-forget server sync (fire in background, no await)
        if (isCurrentlyWishlisted) {
          removeFromWishlist(productId).catch(() => {
            // Revert on failure — re-add the item
            set((s) => ({
              items: s.items.includes(productId) ? s.items : [...s.items, productId],
            }));
          });
        } else {
          addToWishlist(productId).catch(() => {
            // Revert on failure — remove the item
            set((s) => ({
              items: s.items.filter((id) => id !== productId),
            }));
          });
        }
      },

      isWishlisted: (productId) => get().items.includes(productId),

      loadFromServer: async () => {
        try {
          const serverItems = await fetchWishlist();
          if (serverItems.length > 0) {
            // Merge: keep any local-only items, add server items
            set((s) => ({
              items: [...new Set([...s.items, ...serverItems])],
              loaded: true,
            }));
          } else {
            set({ loaded: true });
          }
        } catch {
          set({ loaded: true });
        }
      },
    }),
    {
      name: 'gp-wishlist',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
