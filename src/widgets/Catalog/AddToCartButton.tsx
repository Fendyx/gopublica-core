'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCartStore } from '@/shared/store/cartStore';
import { useCartToast } from '@/shared/ui/CartToast';
import { Loader2, ShoppingBag } from 'lucide-react';
import type { MenuItem, ProductVariant } from '@/entities/menu-item/types';

export default function AddToCartButton({
  product,
  selectedVariant,
}: {
  product: MenuItem;
  selectedVariant?: ProductVariant | null;
}) {
  const t = useTranslations('productDetail');
  const addItem = useCartStore((s) => s.addItem);
  const { showToast } = useCartToast();
  const [loading, setLoading] = useState(false);

  const price = selectedVariant?.price ?? product.price;
  const variantName = selectedVariant?.name ?? '';

  const handleAdd = () => {
    setLoading(true);
    const finalName = variantName ? `${product.name} (${variantName})` : product.name;
    addItem({
      uid: selectedVariant ? `${product._id}-${selectedVariant.id}` : product._id!,
      menuItemId: product._id!,
      variantId: selectedVariant?.id,
      name: finalName,
      basePrice: price,
      price: price,
      quantity: 1,
    });
    showToast(finalName);
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
        ? t('selectVariant')
        : t('addToCart')}
    </button>
  );
}