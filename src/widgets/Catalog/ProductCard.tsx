'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import type { MenuItem, ProductCardVariant } from '@/entities/menu-item/types';
import { useCartStore } from '@/shared/store/cartStore';
import { useWishlistStore } from '@/shared/store/wishlistStore';
import { useCartToast } from '@/shared/ui/CartToast';
import { ShoppingBag, Eye, Heart, ArrowRight } from 'lucide-react';
import { resolveName, resolveDescription } from '@/shared/lib/localization';

interface Props {
  product: MenuItem;
  variant: ProductCardVariant;
  locale?: string;
  currencySymbol?: string;
  imageAspectRatio?: string;
}

// ── Shared helpers ──────────────────────────────────────────────────────────

/** Render price with optional compareAtPrice strikethrough. */
function renderPrice(price: number, compareAtPrice?: number, currencySymbol = 'zł') {
  if (compareAtPrice && compareAtPrice > price) {
    const discount = Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-lg font-bold text-foreground">{price.toFixed(2)} {currencySymbol}</span>
        <span className="text-sm line-through text-muted-foreground">{compareAtPrice.toFixed(2)} {currencySymbol}</span>
        <span className="text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-950 px-1.5 py-0.5 rounded">-{discount}%</span>
      </div>
    );
  }
  return <span className="text-lg font-bold text-foreground">{price.toFixed(2)} {currencySymbol}</span>;
}

/** Sale badge — top-left of image area. */
function SaleBadge({ compareAtPrice, price }: { compareAtPrice?: number; price: number }) {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  const discount = Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
  return (
    <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
      -{discount}%
    </div>
  );
}

/** Wishlist heart button — top-right of image area. */
function WishlistButton({ productId }: { productId: string }) {
  const toggle = useWishlistStore((s) => s.toggle);
  const active = useWishlistStore((s) => s.items.includes(productId));

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(productId); }}
      className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-md hover:bg-white transition-colors"
      aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        size={16}
        className={active ? 'fill-red-500 text-red-500' : 'text-gray-600'}
      />
    </button>
  );
}

// ── CardImage with secondary hover swap ─────────────────────────────────────

function CardImage({ product, locale, aspectRatio = '1/1' }: { product: MenuItem; locale?: string; aspectRatio?: string }) {
  const isVideo = /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(product.image || '');
  const hasSecondary = product.images && product.images.length > 0;
  const secondarySrc = hasSecondary ? product.images![0] : null;

  if (isVideo) {
    return (
      <div className="relative w-full overflow-hidden bg-muted/50" style={{ aspectRatio }}>
        <video
          src={product.image}
          className="w-full h-full object-contain"
          muted loop playsInline autoPlay
        />
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden bg-muted/50" style={{ aspectRatio }}>
      {product.image ? (
        <Image
          src={product.image}
          alt={resolveName(product, locale)}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, (max-width: 1600px) 33vw, 25vw"
          className="object-contain transition-opacity duration-500 ease-out group-hover:opacity-0"
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full text-muted-foreground text-sm">
          No Image
        </div>
      )}
      {secondarySrc && (
        <Image
          src={secondarySrc}
          alt={resolveName(product, locale)}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, (max-width: 1600px) 33vw, 25vw"
          className="object-contain absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out"
        />
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function ProductCard({ product, variant, locale, currencySymbol = 'zł', imageAspectRatio = '1/1' }: Props) {
  const { branchSlug } = useParams();
  const branchSlugStr = Array.isArray(branchSlug) ? branchSlug[0] : branchSlug;

  return (
    <div className="group">
      {variant === 'overlay' && <OverlayCard product={product} locale={locale} branchSlug={branchSlugStr} currencySymbol={currencySymbol} imageAspectRatio={imageAspectRatio} />}
      {variant === 'action-bar' && <ActionBarCard product={product} locale={locale} branchSlug={branchSlugStr} currencySymbol={currencySymbol} imageAspectRatio={imageAspectRatio} />}
      {variant === 'minimal' && <MinimalCard product={product} locale={locale} branchSlug={branchSlugStr} currencySymbol={currencySymbol} imageAspectRatio={imageAspectRatio} />}
      {variant === 'horizontal' && <HorizontalCard product={product} locale={locale} branchSlug={branchSlugStr} currencySymbol={currencySymbol} imageAspectRatio={imageAspectRatio} />}
      {variant === 'action-overlay' && <ActionOverlayCard product={product} locale={locale} branchSlug={branchSlugStr} currencySymbol={currencySymbol} imageAspectRatio={imageAspectRatio} />}
      {variant === 'clean' && <CleanCard product={product} locale={locale} branchSlug={branchSlugStr} currencySymbol={currencySymbol} imageAspectRatio={imageAspectRatio} />}
      {variant === 'badge-top' && <BadgeTopCard product={product} locale={locale} branchSlug={branchSlugStr} currencySymbol={currencySymbol} imageAspectRatio={imageAspectRatio} />}
      {variant === 'split-action' && <SplitActionCard product={product} locale={locale} branchSlug={branchSlugStr} currencySymbol={currencySymbol} imageAspectRatio={imageAspectRatio} />}
    </div>
  );
}

/* ---------- 1. OVERLAY ---------- */
function OverlayCard({ product, locale, branchSlug, currencySymbol, imageAspectRatio }: { product: MenuItem; locale?: string; branchSlug?: string; currencySymbol: string; imageAspectRatio?: string }) {
  const addItem = useCartStore((s) => s.addItem);
  const { showToast } = useCartToast();
  const [loading, setLoading] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    addItem({ uid: product._id!, menuItemId: product._id!, name: resolveName(product, locale), basePrice: product.price, price: product.price, quantity: 1 });
    showToast(resolveName(product, locale));
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <Link href={`/${locale}/${branchSlug}/catalog/${product._id}`} className="block relative rounded-2xl overflow-hidden border border-border transition-all duration-300 hover:shadow-lg">
      <CardImage product={product} locale={locale} aspectRatio={imageAspectRatio} />
      <SaleBadge compareAtPrice={product.compareAtPrice} price={product.price} />
      <WishlistButton productId={product._id!} />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-center gap-3">
        <button onClick={handleAdd} disabled={loading} className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-gray-200 transition-colors">
          <ShoppingBag size={14} /> Add to Bag
        </button>
        <div className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 cursor-pointer">
          <Eye size={14} /> Quick View
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
        <h3 className="font-semibold text-base truncate">{resolveName(product, locale)}</h3>
        <div className="text-white/90">{renderPrice(product.price, product.compareAtPrice, ' ')}</div>
      </div>
      <div className="md:hidden absolute top-2 right-12 bg-white p-2 rounded-full shadow-md">
        <button onClick={handleAdd}><ShoppingBag size={16} className="text-black" /></button>
      </div>
    </Link>
  );
}

/* ---------- 2. ACTION-BAR ---------- */
function ActionBarCard({ product, locale, branchSlug, currencySymbol, imageAspectRatio }: { product: MenuItem; locale?: string; branchSlug?: string; currencySymbol: string; imageAspectRatio?: string }) {
  const addItem = useCartStore((s) => s.addItem);
  const { showToast } = useCartToast();
  const [loading, setLoading] = useState(false);

  const handleAdd = () => {
    setLoading(true);
    addItem({ uid: product._id!, menuItemId: product._id!, name: resolveName(product, locale), basePrice: product.price, price: product.price, quantity: 1 });
    showToast(resolveName(product, locale));
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div className="flex flex-col h-full border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
      <Link href={`/${locale}/${branchSlug}/catalog/${product._id}`} className="relative block">
        <CardImage product={product} locale={locale} aspectRatio={imageAspectRatio} />
        <SaleBadge compareAtPrice={product.compareAtPrice} price={product.price} />
        <WishlistButton productId={product._id!} />
      </Link>
      <div className="flex flex-col flex-1 p-4 gap-2 bg-transparent">
        <Link href={`/${locale}/${branchSlug}/catalog/${product._id}`}>
          <h3 className="font-semibold text-base text-foreground leading-snug line-clamp-2 hover:underline">{resolveName(product, locale)}</h3>
        </Link>
        {renderPrice(product.price, product.compareAtPrice, currencySymbol)}
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
function MinimalCard({ product, locale, branchSlug, currencySymbol, imageAspectRatio }: { product: MenuItem; locale?: string; branchSlug?: string; currencySymbol: string; imageAspectRatio?: string }) {
  return (
    <Link href={`/${locale}/${branchSlug}/catalog/${product._id}`} className="block group">
      <div className="relative">
        <CardImage product={product} locale={locale} aspectRatio={imageAspectRatio} />
        <SaleBadge compareAtPrice={product.compareAtPrice} price={product.price} />
        <WishlistButton productId={product._id!} />
      </div>
      <div className="mt-3 flex justify-between items-start gap-2 border-b border-transparent group-hover:border-border pb-2 transition-all">
        <h3 className="text-sm font-medium text-foreground leading-snug">{resolveName(product, locale)}</h3>
        <div className="whitespace-nowrap">
          {product.compareAtPrice && product.compareAtPrice > product.price ? (
            <div className="flex items-center gap-1.5">
              <span className="text-sm line-through text-muted-foreground">{product.compareAtPrice.toFixed(2)}</span>
              <span className="text-sm font-bold text-foreground">{product.price.toFixed(2)} {currencySymbol}</span>
            </div>
          ) : (
            <span className="text-sm font-bold text-foreground">{product.price.toFixed(2)} {currencySymbol}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ---------- 4. HORIZONTAL (Shopify Dawn side-by-side) ---------- */
function HorizontalCard({ product, locale, branchSlug, currencySymbol, imageAspectRatio }: { product: MenuItem; locale?: string; branchSlug?: string; currencySymbol: string; imageAspectRatio?: string }) {
  const addItem = useCartStore((s) => s.addItem);
  const { showToast } = useCartToast();
  const [loading, setLoading] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    addItem({ uid: product._id!, menuItemId: product._id!, name: resolveName(product, locale), basePrice: product.price, price: product.price, quantity: 1 });
    showToast(resolveName(product, locale));
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <Link href={`/${locale}/${branchSlug}/catalog/${product._id}`} className="flex flex-col sm:flex-row h-full border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
      <div className="relative w-full sm:w-[40%] shrink-0">
        <CardImage product={product} locale={locale} aspectRatio={imageAspectRatio} />
        <SaleBadge compareAtPrice={product.compareAtPrice} price={product.price} />
        <WishlistButton productId={product._id!} />
      </div>
      <div className="flex flex-col flex-1 p-4 gap-2 justify-center">
        <h3 className="font-semibold text-base text-foreground leading-snug line-clamp-2">{resolveName(product, locale)}</h3>
        {resolveDescription(product, locale) && (
          <p className="text-sm text-muted-foreground line-clamp-2">{resolveDescription(product, locale)}</p>
        )}
        {renderPrice(product.price, product.compareAtPrice, currencySymbol)}
        <button
          onClick={handleAdd}
          disabled={loading}
          className="mt-2 w-full sm:w-auto bg-primary text-primary-foreground py-2.5 px-6 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <ShoppingBag size={16} /> Add to Bag
        </button>
      </div>
    </Link>
  );
}

/* ---------- 5. ACTION-OVERLAY ---------- */
function ActionOverlayCard({ product, locale, branchSlug, currencySymbol, imageAspectRatio }: { product: MenuItem; locale?: string; branchSlug?: string; currencySymbol: string; imageAspectRatio?: string }) {
  const addItem = useCartStore((s) => s.addItem);
  const { showToast } = useCartToast();
  const [loading, setLoading] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    addItem({ uid: product._id!, menuItemId: product._id!, name: resolveName(product, locale), basePrice: product.price, price: product.price, quantity: 1 });
    showToast(resolveName(product, locale));
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div className="flex flex-col h-full border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md group">
      <Link href={`/${locale}/${branchSlug}/catalog/${product._id}`} className="relative block">
        <CardImage product={product} locale={locale} aspectRatio={imageAspectRatio} />
        <SaleBadge compareAtPrice={product.compareAtPrice} price={product.price} />
        <WishlistButton productId={product._id!} />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex flex-col items-center justify-center gap-3">
          <button onClick={handleAdd} disabled={loading} className="bg-white text-black px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-gray-200 transition-colors">
            <ShoppingBag size={14} /> Add to Bag
          </button>
          <div className="bg-white/20 backdrop-blur-sm text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 cursor-pointer">
            <Eye size={14} /> Quick View
          </div>
        </div>
        <div className="md:hidden absolute top-2 right-12 bg-white p-2 rounded-full shadow-md">
          <button onClick={handleAdd}><ShoppingBag size={16} className="text-black" /></button>
        </div>
      </Link>
      <div className="flex flex-col flex-1 p-4 gap-1 bg-transparent">
        <Link href={`/${locale}/${branchSlug}/catalog/${product._id}`}>
          <h3 className="font-semibold text-base text-foreground leading-snug line-clamp-2 hover:underline">{resolveName(product, locale)}</h3>
        </Link>
        {renderPrice(product.price, product.compareAtPrice, currencySymbol)}
      </div>
    </div>
  );
}

/* ---------- 6. CLEAN ---------- */
function CleanCard({ product, locale, branchSlug, currencySymbol, imageAspectRatio }: { product: MenuItem; locale?: string; branchSlug?: string; currencySymbol?: string; imageAspectRatio?: string }) {
  return (
    <Link href={`/${locale}/${branchSlug}/catalog/${product._id}`} className="block relative rounded-2xl overflow-hidden border border-border group transition-all duration-300 hover:shadow-lg">
      <CardImage product={product} locale={locale} aspectRatio={imageAspectRatio} />
      <SaleBadge compareAtPrice={product.compareAtPrice} price={product.price} />
      <WishlistButton productId={product._id!} />
      <div className="absolute bottom-0 left-0 p-4 bg-gradient-to-t from-black/80 to-transparent w-full">
        <h3 className="text-white font-semibold text-base truncate">{resolveName(product, locale)}</h3>
        <p className="text-white/90 text-sm font-bold mt-1">{product.price.toFixed(2)} {currencySymbol || 'zł'}</p>
      </div>
    </Link>
  );
}

/* ---------- 7. BADGE-TOP (Prestige / Warehouse style) ---------- */
function BadgeTopCard({ product, locale, branchSlug, currencySymbol, imageAspectRatio }: { product: MenuItem; locale?: string; branchSlug?: string; currencySymbol: string; imageAspectRatio?: string }) {
  const addItem = useCartStore((s) => s.addItem);
  const { showToast } = useCartToast();
  const [loading, setLoading] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    addItem({ uid: product._id!, menuItemId: product._id!, name: resolveName(product, locale), basePrice: product.price, price: product.price, quantity: 1 });
    showToast(resolveName(product, locale));
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div className="flex flex-col h-full border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg group">
      <Link href={`/${locale}/${branchSlug}/catalog/${product._id}`} className="relative block">
        <CardImage product={product} locale={locale} aspectRatio={imageAspectRatio} />
        <SaleBadge compareAtPrice={product.compareAtPrice} price={product.price} />
        <WishlistButton productId={product._id!} />
        {/* Quick Add bar — slides up on hover (desktop) */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out hidden md:block">
          <button
            onClick={handleAdd}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-3 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <ShoppingBag size={16} /> Quick Add
          </button>
        </div>
        {/* Mobile add button */}
        <div className="md:hidden absolute bottom-2 right-2 z-10">
          <button
            onClick={handleAdd}
            disabled={loading}
            className="bg-primary text-primary-foreground p-2.5 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
          >
            <ShoppingBag size={16} />
          </button>
        </div>
      </Link>
      <div className="flex flex-col flex-1 p-4 gap-1.5 bg-transparent">
        <Link href={`/${locale}/${branchSlug}/catalog/${product._id}`}>
          <h3 className="font-semibold text-base text-foreground leading-snug line-clamp-2 hover:underline">{resolveName(product, locale)}</h3>
        </Link>
        {renderPrice(product.price, product.compareAtPrice, currencySymbol)}
      </div>
    </div>
  );
}

/* ---------- 8. SPLIT-ACTION (Dawn "Quick Add" style) ---------- */
function SplitActionCard({ product, locale, branchSlug, currencySymbol, imageAspectRatio }: { product: MenuItem; locale?: string; branchSlug?: string; currencySymbol: string; imageAspectRatio?: string }) {
  const addItem = useCartStore((s) => s.addItem);
  const { showToast } = useCartToast();
  const [loading, setLoading] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    addItem({ uid: product._id!, menuItemId: product._id!, name: resolveName(product, locale), basePrice: product.price, price: product.price, quantity: 1 });
    showToast(resolveName(product, locale));
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div className="flex flex-col h-full border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md group">
      <Link href={`/${locale}/${branchSlug}/catalog/${product._id}`} className="relative block">
        <CardImage product={product} locale={locale} aspectRatio={imageAspectRatio} />
        <SaleBadge compareAtPrice={product.compareAtPrice} price={product.price} />
        <WishlistButton productId={product._id!} />
      </Link>
      <div className="flex flex-col flex-1">
        <div className="px-4 pt-3">
          {renderPrice(product.price, product.compareAtPrice, currencySymbol)}
        </div>
        <div className="mt-auto border-t border-border">
          <div className="flex divide-x divide-border">
            <Link
              href={`/${locale}/${branchSlug}/catalog/${product._id}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Eye size={16} /> Quick view
            </Link>
            <button
              onClick={handleAdd}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
            >
              <ShoppingBag size={16} /> Add to cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}