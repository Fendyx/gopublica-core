import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartModifier } from '@/entities/menu-item/types';

export interface CartItem {
  uid: string; // Уникальный ID комбинации (menuItemId + модификаторы)
  menuItemId: string;
  variantId?: string; // <-- добавлено для вариантов
  name: string;
  basePrice: number;
  price: number; // Итоговая цена с учетом модификаторов
  quantity: number;
  notes?: string;
  modifiers?: CartModifier[];
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (uid: string) => void;
  updateQuantity: (uid: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.uid === item.uid);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.uid === item.uid
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),
      removeItem: (uid) =>
        set((state) => ({ items: state.items.filter((i) => i.uid !== uid) })),
      updateQuantity: (uid, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.uid !== uid)
              : state.items.map((i) => (i.uid === uid ? { ...i, quantity } : i)),
        })),
      clearCart: () => set({ items: [] }),
      getSubtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'gp-cart' }
  )
);