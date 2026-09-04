'use client';
import Image from 'next/image';
import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Heart, Share2, ChevronLeft, Truck, RotateCcw, AlertTriangle } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import AddToCartButton from '@/widgets/Catalog/AddToCartButton';
import ProductGallery from '@/widgets/Catalog/ProductGallery';
import VariantSelector from '@/widgets/Catalog/VariantSelector';
import RelatedProducts from '@/widgets/Catalog/RelatedProducts';
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
  const { branchSlug } = useParams();
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

  const lowStock = stock != null && stock > 0 && stock <= 5;

  const priceProps = { showPrice, displayPrice, compareAtPrice, hasDiscount, discountPercent, currencySymbol };
  const variantProps = hasVariants
    ? { variants: product.variants!, selectedId: selectedVariantId, onChange: setSelectedVariantId }
    : null;

  const handleShare = useCallback(async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try { await navigator.share({ title: product.name, url }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
    }
  }, [product.name]);

  const hasSpecs = hasAttributes(product) || hasWeightVal(product) || hasDims(product) || hasTagsList(product);

  return (
    <div>
      {/* MOBILE */}
      <div className="lg:hidden">
        <div className="sticky top-0 h-[75vh] z-0 overflow-hidden bg-muted">
          <ProductGallery images={allImages} />

          <div className="absolute inset-x-0 top-0 px-4 pt-4 flex items-center justify-between z-10">
            <Link
              href={`/${locale}/${branchSlug}/catalog`}
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
                onClick={handleShare}
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

            {lowStock && (
              <div className="flex items-center gap-2 text-xs text-amber-600">
                <AlertTriangle size={14} />
                <span className="tracking-wide">{t('stockLeft', { count: stock })}</span>
              </div>
            )}

            <div className="border-t border-border-light pt-4">
              <ProductTabs product={product} hasSpecs={hasSpecs} t={t} />
            </div>
          </div>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden lg:block">
        <div className="max-w-[1400px] mx-auto px-12 py-10">
          <nav className="flex items-center gap-2.5 text-[10px] tracking-widest uppercase text-muted-foreground mb-12">
            <Link
              href={`/${locale}/${branchSlug}/catalog`}
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
                    <Image
                      src={img}
                      alt={`${product.name} — ${t('view')} ${idx + 1}`}
                      fill
                      sizes="(max-width: 768px) 33vw, 25vw"
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
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors duration-150"
                >
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

              {variantProps && (
                <div className="mb-7">
                  <VariantSelector {...variantProps} />
                </div>
              )}

              <AddToCartButton product={product} selectedVariant={activeVariant} />

              {lowStock && (
                <div className="flex items-center gap-2 text-xs text-amber-600 mt-4">
                  <AlertTriangle size={14} />
                  <span className="tracking-wide">{t('stockLeft', { count: stock })}</span>
                </div>
              )}

              <div className="mt-7 pt-6 border-t border-border-light">
                <DeliveryRow inStock={inStock} />
              </div>

              <div className="mt-7">
                <ProductTabs product={product} hasSpecs={hasSpecs} t={t} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {product._id && <RelatedProducts productId={product._id} />}
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
    <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${inStock ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className="tracking-wide">
        {inStock ? t('inStock') : t('outOfStock')}
      </span>
    </div>
  );
}

/* ────────── Attribute helpers ────────── */

function hasAttributes(product: MenuItem) {
  return (product.attributes ?? []).some(a => a.key?.trim() && a.value?.trim());
}
function hasWeightVal(product: MenuItem) {
  return product.weight != null && product.weight > 0;
}
function hasDims(product: MenuItem) {
  if (!product.dimensions) return false;
  return (
    (product.dimensions.length ?? 0) > 0 ||
    (product.dimensions.width ?? 0) > 0 ||
    (product.dimensions.height ?? 0) > 0
  );
}
function hasTagsList(product: MenuItem) {
  return Boolean(product.tags && product.tags.length > 0);
}

/* ────────── Product Tabs ────────── */

function ProductTabs({
  product,
  hasSpecs,
  t,
}: {
  product: MenuItem;
  hasSpecs: boolean;
  t: ReturnType<typeof useTranslations<'productDetail'>>;
}) {
  const hasDescription = Boolean(product.description);
  if (!hasDescription && !hasSpecs) return null;

  // Single content → no tab chrome
  if (hasDescription && !hasSpecs) {
    return (
      <div>
        <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-3">
          {t('description')}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {product.description}
        </p>
      </div>
    );
  }

  const defaultTab = hasDescription ? 'description' : 'specifications';

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="w-full justify-start border-b border-border-light rounded-none bg-transparent p-0 gap-0">
        {hasDescription && (
          <TabsTrigger value="description" className="text-[10px] tracking-widest uppercase rounded-none">
            {t('tabDescription')}
          </TabsTrigger>
        )}
        {hasSpecs && (
          <TabsTrigger value="specifications" className="text-[10px] tracking-widest uppercase rounded-none">
            {t('tabSpecifications')}
          </TabsTrigger>
        )}
        <TabsTrigger value="shipping" className="text-[10px] tracking-widest uppercase rounded-none">
          {t('tabShipping')}
        </TabsTrigger>
      </TabsList>

      {hasDescription && (
        <TabsContent value="description" className="pt-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        </TabsContent>
      )}

      {hasSpecs && (
        <TabsContent value="specifications" className="pt-4">
          <SpecificationsTab product={product} t={t} />
        </TabsContent>
      )}

      <TabsContent value="shipping" className="pt-4">
        <ShippingTab t={t} />
      </TabsContent>
    </Tabs>
  );
}

/* ────────── Specifications table ────────── */

function SpecificationsTab({
  product,
  t,
}: {
  product: MenuItem;
  t: ReturnType<typeof useTranslations<'productDetail'>>;
}) {
  const attrs = (product.attributes ?? []).filter(a => a.key?.trim() && a.value?.trim());
  const wgt = hasWeightVal(product);
  const dims = hasDims(product);
  const tags = hasTagsList(product);

  if (!wgt && !dims && !tags && attrs.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('noSpecifications')}</p>;
  }

  // Build dimension string — only non-zero parts
  let dimStr = '';
  if (dims) {
    const parts: string[] = [];
    if ((product.dimensions!.length ?? 0) > 0) parts.push(String(product.dimensions!.length));
    if ((product.dimensions!.width ?? 0) > 0) parts.push(String(product.dimensions!.width));
    if ((product.dimensions!.height ?? 0) > 0) parts.push(String(product.dimensions!.height));
    dimStr = parts.join(' \u00d7 ') + ' ' + (product.dimensions!.unit || 'cm');
  }

  return (
    <div className="space-y-0">
      <table className="w-full text-xs border-collapse">
        <tbody>
          {attrs.map((attr, idx) => (
            <tr key={`${attr.key}-${idx}`} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
              <td className="py-2.5 px-3 text-muted-foreground tracking-wide w-[40%]">{attr.key}</td>
              <td className="py-2.5 px-3 text-foreground">{attr.value}</td>
            </tr>
          ))}
          {wgt && (
            <tr className={attrs.length % 2 === 0 ? 'bg-muted/30' : ''}>
              <td className="py-2.5 px-3 text-muted-foreground tracking-wide w-[40%]">{t('weight')}</td>
              <td className="py-2.5 px-3 text-foreground">
                {product.weight} {product.weightUnit || 'kg'}
              </td>
            </tr>
          )}
          {dims && (
            <tr className={(attrs.length + (wgt ? 1 : 0)) % 2 === 0 ? 'bg-muted/30' : ''}>
              <td className="py-2.5 px-3 text-muted-foreground tracking-wide w-[40%]">{t('dimensions')}</td>
              <td className="py-2.5 px-3 text-foreground">{dimStr}</td>
            </tr>
          )}
        </tbody>
      </table>

      {tags && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {product.tags!.map(tag => (
            <span
              key={tag}
              className="border border-border px-2.5 py-1 text-[9px] tracking-widest uppercase text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ────────── Shipping & Returns tab ────────── */

function ShippingTab({
  t,
}: {
  t: ReturnType<typeof useTranslations<'productDetail'>>;
}) {
  return (
    <div className="space-y-4 text-xs text-muted-foreground">
      <div className="flex items-start gap-3">
        <Truck size={14} className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-foreground font-medium mb-1">{t('shippingInfo')}</p>
          <p className="leading-relaxed">{t('estimatedDelivery')}</p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <RotateCcw size={14} className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-foreground font-medium mb-1">{t('returnInfo')}</p>
          <p className="leading-relaxed">{t('returnWindow')}</p>
        </div>
      </div>
    </div>
  );
}