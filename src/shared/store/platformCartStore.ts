'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PlatformCartItem {
  productId: string;
  title: string;
  price: number;
  currency: string;
  photo: string;
  quantity: number;
}

interface PlatformCartState {
  items: PlatformCartItem[];
  addItem: (item: Omit<PlatformCartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  getSubtotal: () => number;
  getItemCount: () => number;
  clear: () => void;
}

export const usePlatformCartStore = create<PlatformCartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity }] };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        }));
      },

      getSubtotal: () => {
        return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      },

      getItemCount: () => {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },

      clear: () => set({ items: [] }),
    }),
    { name: 'gp-platform-cart' }
  )
);
