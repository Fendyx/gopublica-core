'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Heart, Share2, ChevronLeft, Truck, RotateCcw } from 'lucide-react';
import AddToCartButton from '@/widgets/Catalog/AddToCartButton';
import ProductGallery from '@/widgets/Catalog/ProductGallery';
import VariantSelector from '@/widgets/Catalog/VariantSelector';
import type { MenuItem } from '@/entities/menu-item/types';
import { useBranchSettings } from '@/entities/branch/useBranchSettings';

const CURRENCY_SYMBOLS: Record<string, string> = {
  PLN: 'zł', EUR: '€', USD: '$', UAH: '₴', GBP: '£', CZK: 'Kč', CHF: 'CHF',
};

function getCurrencySymbol(currencyCode?: string): string {
  return currencyCode ? CURRENCY_SYMBOLS[currencyCode] || currencyCode : 'zł';
}

export default function ProductDetail({
  product,
  locale,
  tenant,
}: {
  product: MenuItem;
  locale: string;
  tenant: any;
}) {
  const t = useTranslations('productDetail');
  const { primaryCurrency } = useBranchSettings();
  const currencySymbol = getCurrencySymbol(primaryCurrency);

  const hasVariants = Boolean(product.variants?.length);

  const defaultVariant = useMemo(() => {
    if (!hasVariants) return null;
    const priced = [...product.variants!].filter(v => (v.price ?? 0) > 0);
    return (priced.length ? priced : product.variants!)
      .sort((a, b) => (a.price ?? 0) - (b.price ?? 0))[0];
  }, [product.variants, hasVariants]);

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    defaultVariant?.id ?? null
  );
  const [wishlisted, setWishlisted] = useState(false);

  const activeVariant =
    (selectedVariantId
      ? product.variants?.find(v => v.id === selectedVariantId)
      : null) ?? defaultVariant;

  const displayPrice   = hasVariants ? activeVariant?.price        : product.price;
  const compareAtPrice = hasVariants ? activeVariant?.compareAtPrice : product.compareAtPrice;
  const stock          = hasVariants ? activeVariant?.stock         : product.stock;

  const hasDiscount =
    compareAtPrice != null && compareAtPrice > 0 && compareAtPrice > (displayPrice ?? 0);
  const discountPercent = hasDiscount
    ? Math.round(((compareAtPrice! - (displayPrice ?? 0)) / compareAtPrice!) * 100)
    : 0;

  const showPrice = (displayPrice ?? 0) > 0;
  const inStock   = stock == null || stock > 0;

  const allImages = [
    ...(product.image ? [product.image] : []),
    ...(product.images ?? []),
  ];

  const priceProps = { showPrice, displayPrice, compareAtPrice, hasDiscount, discountPercent, currencySymbol };
  const variantProps = hasVariants
    ? { variants: product.variants!, selectedId: selectedVariantId, onChange: setSelectedVariantId }
    : null;

  return (
    <div>
      {/* MOBILE */}
      <div className="lg:hidden">
        <div className="sticky top-0 h-[75vh] z-0 overflow-hidden bg-muted">
          <ProductGallery images={allImages} />

          <div className="absolute inset-x-0 top-0 px-4 pt-4 flex items-center justify-between z-10">
            <Link
              href={`/${locale}/catalog`}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] tracking-widest uppercase text-foreground bg-background/60 backdrop-blur-md"
            >
              <ChevronLeft size={10} strokeWidth={2.5} />
              {t('backToCatalog')}
            </Link>

            <div className="flex gap-1">
              <button
                onClick={() => setWishlisted(w => !w)}
                aria-label={wishlisted ? t('removeFromWishlist') : t('addToWishlist')}
                className="w-9 h-9 flex items-center justify-center bg-background/60 backdrop-blur-md"
              >
                <Heart
                  size={16}
                  className={wishlisted ? 'fill-primary text-primary' : 'text-foreground'}
                />
              </button>
              <button
                aria-label={t('share')}
                className="w-9 h-9 flex items-center justify-center bg-background/60 backdrop-blur-md"
              >
                <Share2 size={16} className="text-foreground" />
              </button>
            </div>
          </div>
        </div>

        <div className="relative z-10 bg-background -mt-6 min-h-[65vh]">
          <div className="flex justify-center pt-3 pb-2">
            <span className="w-8 h-px bg-border" />
          </div>

          <div className="px-5 pt-3 pb-36 space-y-7">
            {product.sku && (
              <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
                {t('sku')} {product.sku}
              </p>
            )}

            <h1
              className="text-[1.75rem] leading-tight font-bold text-foreground"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {product.name}
            </h1>

            <PriceDisplay {...priceProps} />

            {variantProps && <VariantSelector {...variantProps} />}

            <AddToCartButton product={product} selectedVariant={activeVariant} />

            <DeliveryRow inStock={inStock} />

            {product.description && (
              <div className="border-t border-border-light pt-6">
                <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
                  {t('description')}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
              </div>
            )}

            <SpecsTable product={product} />
          </div>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden lg:block">
        <div className="max-w-[1400px] mx-auto px-12 py-10">
          <nav className="flex items-center gap-2.5 text-[10px] tracking-widest uppercase text-muted-foreground mb-12">
            <Link
              href={`/${locale}/catalog`}
              className="hover:text-foreground transition-colors"
            >
              {t('backToCatalog')}
            </Link>
            <span>/</span>
            <span className="text-foreground truncate max-w-[260px]">{product.name}</span>
          </nav>

          <div className="grid grid-cols-[1fr_420px] xl:grid-cols-[1fr_460px] gap-20 items-start">
            <div className="space-y-2">
              {allImages.length > 0 ? (
                allImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="group relative overflow-hidden bg-muted w-full aspect-[3/4]"
                  >
                    <img
                      src={img}
                      alt={`${product.name} — ${t('view')} ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-[1.03]"
                    />
                  </div>
                ))
              ) : (
                <div className="w-full aspect-[3/4] bg-muted flex items-center justify-center">
                  <span className="text-[10px] tracking-widest uppercase text-muted-foreground">
                    {t('noPhoto')}
                  </span>
                </div>
              )}
            </div>

            <div className="sticky top-10 h-fit">
              <div className="flex items-center justify-end gap-3 mb-8">
                <button
                  onClick={() => setWishlisted(w => !w)}
                  className="group flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors duration-150"
                >
                  <Heart
                    size={13}
                    className={wishlisted ? 'fill-primary text-primary' : 'group-hover:text-foreground'}
                  />
                  {wishlisted ? t('inWishlist') : t('addToWishlist')}
                </button>
                <span className="text-border-light">|</span>
                <button className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors duration-150">
                  <Share2 size={13} />
                  {t('share')}
                </button>
              </div>

              {product.sku && (
                <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-5">
                  {t('sku')} {product.sku}
                </p>
              )}

              <h1
                className="text-3xl xl:text-[2.5rem] leading-[1.1] font-bold text-foreground mb-6"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {product.name}
              </h1>

              <div className="mb-7">
                <PriceDisplay {...priceProps} />
              </div>

              {product.description && (
                <p className="text-sm leading-relaxed text-muted-foreground mb-7">
                  {product.description}
                </p>
              )}

              <div className="border-t border-border-light mb-7" />

              {variantProps && (
                <div className="mb-7">
                  <VariantSelector {...variantProps} />
                </div>
              )}

              <AddToCartButton product={product} selectedVariant={activeVariant} />

              <div className="mt-7 pt-6 border-t border-border-light">
                <DeliveryRow inStock={inStock} />
              </div>

              <SpecsTable product={product} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------- Sub-components -------- */

function PriceDisplay({
  showPrice,
  displayPrice,
  compareAtPrice,
  hasDiscount,
  discountPercent,
  currencySymbol,
}: {
  showPrice: boolean;
  displayPrice?: number | null;
  compareAtPrice?: number | null;
  hasDiscount: boolean;
  discountPercent: number;
  currencySymbol: string;
}) {
  const t = useTranslations('productDetail');
  if (!showPrice) {
    return (
      <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
        {t('noPrice')}
      </p>
    );
  }

  return (
    <div className="flex items-baseline gap-3 flex-wrap">
      <span className={`text-2xl font-bold ${hasDiscount ? 'text-destructive' : 'text-foreground'}`}>
        {displayPrice}&nbsp;{currencySymbol}
      </span>
      {hasDiscount && (
        <>
          <span className="text-base text-muted-foreground line-through">
            {compareAtPrice}&nbsp;{currencySymbol}
          </span>
          <span className="text-[9px] tracking-widest uppercase px-2 py-0.5 border border-destructive text-destructive">
            −{discountPercent}%
          </span>
        </>
      )}
    </div>
  );
}

function DeliveryRow({ inStock }: { inStock: boolean }) {
  const t = useTranslations('productDetail');
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${inStock ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="tracking-wide">
          {inStock ? t('inStock') : t('outOfStock')}
        </span>
      </div>

      <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
        <Truck size={13} className="flex-shrink-0" />
        <span className="tracking-wide">{t('delivery')}</span>
      </div>

      <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
        <RotateCcw size={13} className="flex-shrink-0" />
        <span className="tracking-wide">{t('returnPolicy')}</span>
      </div>
    </div>
  );
}

function SpecsTable({ product }: { product: MenuItem }) {
  const t = useTranslations('productDetail');
  const hasWeight = product.weight && product.weight > 0;
  const hasDims =
    product.dimensions &&
    (product.dimensions.length || product.dimensions.width || product.dimensions.height);
  const hasTags = product.tags && product.tags.length > 0;

  if (!hasWeight && !hasDims && !hasTags) return null;

  return (
    <div className="mt-6 pt-6 border-t border-border-light space-y-3">
      <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-4">
        {t('specifications')}
      </p>

      {hasWeight && (
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground tracking-wide">{t('weight')}</span>
          <span className="text-foreground">
            {product.weight}&nbsp;{product.weightUnit || 'kg'}
          </span>
        </div>
      )}

      {hasDims && (
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground tracking-wide">{t('dimensions')}</span>
          <span className="text-foreground">
            {product.dimensions!.length}&nbsp;×&nbsp;
            {product.dimensions!.width}&nbsp;×&nbsp;
            {product.dimensions!.height}&nbsp;
            {product.dimensions!.unit || 'cm'}
          </span>
        </div>
      )}

      {hasTags && (
        <div className="flex justify-between items-start gap-4 text-xs">
          <span className="text-muted-foreground tracking-wide flex-shrink-0">{t('tags')}</span>
          <div className="flex flex-wrap gap-1 justify-end">
            {product.tags!.map(tag => (
              <span
                key={tag}
                className="border border-border px-2 py-0.5 text-[9px] tracking-widest uppercase text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}