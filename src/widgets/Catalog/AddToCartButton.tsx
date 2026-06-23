'use client';
import { useState } from 'react';
import { useCartStore } from '@/shared/store/cartStore';
import { useBranchSettings } from '@/entities/branch/useBranchSettings';
import { Loader2, ShoppingBag } from 'lucide-react';
import type { MenuItem } from '@/entities/menu-item/types';

export default function AddToCartButton({ product }: { product: MenuItem }) {
  const addItem = useCartStore((s) => s.addItem);
  const { primaryCurrency } = useBranchSettings();
  const [loading, setLoading] = useState(false);

  const handleAdd = () => {
    setLoading(true);
    addItem({
      uid: product._id!,
      menuItemId: product._id!,
      name: product.name,
      basePrice: product.price,
      price: product.price,
      quantity: 1,
    });
    
    // Имитация загрузки для UX
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <button 
      onClick={handleAdd}
      disabled={loading}
      className="w-full lg:w-auto lg:px-12 bg-primary text-white py-4 rounded-xl font-semibold text-lg shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingBag className="w-5 h-5" />}
      Добавить в корзину
    </button>
  );
}