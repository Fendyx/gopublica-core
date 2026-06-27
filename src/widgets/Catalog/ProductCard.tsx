'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { MenuItem, ProductCardVariant } from '@/entities/menu-item/types';
import { useCartStore } from '@/shared/store/cartStore';
import { useCartToast } from '@/shared/ui/CartToast';
import { ShoppingBag, Eye } from 'lucide-react';

interface Props {
  product: MenuItem;
  variant: ProductCardVariant;
  locale?: string;
  currencySymbol?: string;
  imageAspectRatio?: string;
}

export default function ProductCard({ product, variant, locale, currencySymbol = 'zł', imageAspectRatio = '1/1' }: Props) {
  return (
    <div className="group">
      {variant === 'overlay' && <OverlayCard product={product} locale={locale} currencySymbol={currencySymbol} imageAspectRatio={imageAspectRatio} />}
      {variant === 'action-bar' && <ActionBarCard product={product} locale={locale} currencySymbol={currencySymbol} imageAspectRatio={imageAspectRatio} />}
      {variant === 'minimal' && <MinimalCard product={product} locale={locale} currencySymbol={currencySymbol} imageAspectRatio={imageAspectRatio} />}
      {variant === 'hover-vertical' && <HoverVerticalCard product={product} locale={locale} currencySymbol={currencySymbol} imageAspectRatio={imageAspectRatio} />}
      {variant === 'action-overlay' && <ActionOverlayCard product={product} locale={locale} currencySymbol={currencySymbol} imageAspectRatio={imageAspectRatio} />}
      {variant === 'clean' && <CleanCard product={product} locale={locale} imageAspectRatio={imageAspectRatio} />}
    </div>
  );
}

function CardImage({ product, aspectRatio = '1/1' }: { product: MenuItem; aspectRatio?: string }) {
  const isVideo = /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(product.image || '');

  return (
    <div className="relative w-full overflow-hidden bg-muted/50" style={{ aspectRatio }}>
      {product.image ? (
        isVideo ? (
          <video
            src={product.image}
            className="w-full h-full object-contain"
            muted
            loop
            playsInline
            autoPlay
          />
        ) : (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain transition-transform duration-500 ease-out group-hover:scale-105"
          />
        )
      ) : (
        <div className="flex items-center justify-center w-full h-full text-muted-foreground text-sm">
          No Image
        </div>
      )}
    </div>
  );
}

/* ---------- 1. OVERLAY ---------- */
function OverlayCard({ product, locale, currencySymbol, imageAspectRatio }: { product: MenuItem; locale?: string; currencySymbol: string; imageAspectRatio?: string }) {
  const addItem = useCartStore((s) => s.addItem);
  const { showToast } = useCartToast();
  const [loading, setLoading] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    addItem({ uid: product._id!, menuItemId: product._id!, name: product.name, basePrice: product.price, price: product.price, quantity: 1 });
    showToast(product.name);
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <Link href={`/${locale}/catalog/${product._id}`} className="block relative rounded-2xl overflow-hidden border border-border transition-all duration-300 hover:shadow-lg">
      <CardImage product={product} aspectRatio={imageAspectRatio} />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-center gap-3">
        <button onClick={handleAdd} disabled={loading} className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-gray-200 transition-colors">
          <ShoppingBag size={14} /> Add to Bag
        </button>
        <div className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 cursor-pointer">
          <Eye size={14} /> Quick View
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
        <h3 className="font-semibold text-base truncate">{product.name}</h3>
        <p className="text-sm font-bold">{product.price.toFixed(2)} {currencySymbol}</p>
      </div>
      <div className="md:hidden absolute top-2 right-2 bg-white p-2 rounded-full shadow-md">
        <button onClick={handleAdd}><ShoppingBag size={16} className="text-black" /></button>
      </div>
    </Link>
  );
}

/* ---------- 2. ACTION-BAR ---------- */
function ActionBarCard({ product, locale, currencySymbol, imageAspectRatio }: { product: MenuItem; locale?: string; currencySymbol: string; imageAspectRatio?: string }) {
  const addItem = useCartStore((s) => s.addItem);
  const { showToast } = useCartToast();
  const [loading, setLoading] = useState(false);

  const handleAdd = () => {
    setLoading(true);
    addItem({ uid: product._id!, menuItemId: product._id!, name: product.name, basePrice: product.price, price: product.price, quantity: 1 });
    showToast(product.name);
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div className="flex flex-col h-full border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md">
      <Link href={`/${locale}/catalog/${product._id}`}>
        <CardImage product={product} aspectRatio={imageAspectRatio} />
      </Link>
      <div className="flex flex-col flex-1 p-4 gap-2 bg-transparent">
        <Link href={`/${locale}/catalog/${product._id}`}>
          <h3 className="font-semibold text-base text-foreground leading-snug line-clamp-2 hover:underline">{product.name}</h3>
        </Link>
        <div className="text-lg font-bold text-foreground mb-3">{product.price.toFixed(2)} {currencySymbol}</div>
        <button 
          onClick={handleAdd} 
          disabled={loading}
          className="mt-auto w-full bg-primary text-primary-foreground py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <ShoppingBag size={16} /> Add to Bag
        </button>
      </div>
    </div>
  );
}

/* ---------- 3. MINIMAL ---------- */
function MinimalCard({ product, locale, currencySymbol, imageAspectRatio }: { product: MenuItem; locale?: string; currencySymbol: string; imageAspectRatio?: string }) {
  return (
    <Link href={`/${locale}/catalog/${product._id}`} className="block group">
      <CardImage product={product} aspectRatio={imageAspectRatio} />
      <div className="mt-3 flex justify-between items-start gap-2 border-b border-transparent group-hover:border-border pb-2 transition-all">
        <h3 className="text-sm font-medium text-foreground leading-snug">{product.name}</h3>
        <span className="text-sm font-bold text-foreground whitespace-nowrap">{product.price.toFixed(2)} {currencySymbol}</span>
      </div>
    </Link>
  );
}

/* ---------- 4. HOVER-VERTICAL ---------- */
function HoverVerticalCard({ product, locale, currencySymbol, imageAspectRatio }: { product: MenuItem; locale?: string; currencySymbol: string; imageAspectRatio?: string }) {
  const addItem = useCartStore((s) => s.addItem);
  const { showToast } = useCartToast();
  const [loading, setLoading] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    addItem({ uid: product._id!, menuItemId: product._id!, name: product.name, basePrice: product.price, price: product.price, quantity: 1 });
    showToast(product.name);
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <Link href={`/${locale}/catalog/${product._id}`} className="block relative rounded-2xl overflow-hidden border border-border transition-all duration-300 hover:shadow-lg">
      <CardImage product={product} aspectRatio={imageAspectRatio} />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex flex-col items-center justify-center gap-3">
        <button onClick={handleAdd} disabled={loading} className="bg-white text-black px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-gray-200 transition-colors">
          <ShoppingBag size={14} /> Add to Bag
        </button>
        <div className="bg-white/20 backdrop-blur-sm text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 cursor-pointer">
          <Eye size={14} /> Quick View
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
        <h3 className="font-semibold text-base truncate">{product.name}</h3>
        <p className="text-sm font-bold">{product.price.toFixed(2)} {currencySymbol}</p>
      </div>
      <div className="md:hidden absolute top-2 right-2 bg-white p-2 rounded-full shadow-md">
        <button onClick={handleAdd}><ShoppingBag size={16} className="text-black" /></button>
      </div>
    </Link>
  );
}

/* ---------- 5. ACTION-OVERLAY ---------- */
function ActionOverlayCard({ product, locale, currencySymbol, imageAspectRatio }: { product: MenuItem; locale?: string; currencySymbol: string; imageAspectRatio?: string }) {
  const addItem = useCartStore((s) => s.addItem);
  const { showToast } = useCartToast();
  const [loading, setLoading] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    addItem({ uid: product._id!, menuItemId: product._id!, name: product.name, basePrice: product.price, price: product.price, quantity: 1 });
    showToast(product.name);
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div className="flex flex-col h-full border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md group">
      <Link href={`/${locale}/catalog/${product._id}`} className="relative block">
        <CardImage product={product} aspectRatio={imageAspectRatio} />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex flex-col items-center justify-center gap-3">
          <button onClick={handleAdd} disabled={loading} className="bg-white text-black px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-gray-200 transition-colors">
            <ShoppingBag size={14} /> Add to Bag
          </button>
          <div className="bg-white/20 backdrop-blur-sm text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 cursor-pointer">
            <Eye size={14} /> Quick View
          </div>
        </div>
        <div className="md:hidden absolute top-2 right-2 bg-white p-2 rounded-full shadow-md">
          <button onClick={handleAdd}><ShoppingBag size={16} className="text-black" /></button>
        </div>
      </Link>
      <div className="flex flex-col flex-1 p-4 gap-1 bg-transparent">
        <Link href={`/${locale}/catalog/${product._id}`}>
          <h3 className="font-semibold text-base text-foreground leading-snug line-clamp-2 hover:underline">{product.name}</h3>
        </Link>
        <div className="text-lg font-bold text-foreground">{product.price.toFixed(2)} {currencySymbol}</div>
      </div>
    </div>
  );
}

/* ---------- 6. CLEAN ---------- */
function CleanCard({ product, locale, imageAspectRatio }: { product: MenuItem; locale?: string; imageAspectRatio?: string }) {
  return (
    <Link href={`/${locale}/catalog/${product._id}`} className="block relative rounded-2xl overflow-hidden border border-border group transition-all duration-300 hover:shadow-lg">
      <CardImage product={product} aspectRatio={imageAspectRatio} />
      <div className="absolute bottom-0 left-0 p-4 bg-gradient-to-t from-black/80 to-transparent w-full">
        <h3 className="text-white font-semibold text-base truncate">{product.name}</h3>
      </div>
    </Link>
  );
}