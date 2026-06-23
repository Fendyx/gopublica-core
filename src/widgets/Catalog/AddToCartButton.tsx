'use client';
import { useState } from 'react';
import { useCartStore } from '@/shared/store/cartStore';
import { Loader2, ShoppingBag } from 'lucide-react';
import type { MenuItem, ProductVariant } from '@/entities/menu-item/types';

export default function AddToCartButton({
  product,
  selectedVariant,
}: {
  product: MenuItem;
  selectedVariant?: ProductVariant | null;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const [loading, setLoading] = useState(false);

  const price = selectedVariant?.price ?? product.price;
  const variantName = selectedVariant?.name ?? '';

  const handleAdd = () => {
    setLoading(true);
    addItem({
      uid: selectedVariant ? `${product._id}-${selectedVariant.id}` : product._id!,
      menuItemId: product._id!,
      variantId: selectedVariant?.id,
      name: variantName ? `${product.name} (${variantName})` : product.name,
      basePrice: price,
      price: price,
      quantity: 1,
    });
    setTimeout(() => setLoading(false), 500);
  };

  const disabled = loading || (product.variants && product.variants.length > 0 && !selectedVariant);

  return (
    <button
      onClick={handleAdd}
      disabled={disabled}
      className="w-full lg:w-auto lg:px-12 bg-primary text-white py-4 rounded-xl font-semibold text-lg shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingBag className="w-5 h-5" />}
      {product.variants && product.variants.length > 0 && !selectedVariant
        ? 'Выберите вариант'
        : 'Добавить в корзину'}
    </button>
  );
}