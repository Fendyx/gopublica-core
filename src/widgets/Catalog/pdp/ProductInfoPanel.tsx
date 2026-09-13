'use client';
import { AlertTriangle } from 'lucide-react';
import AddToCartButton from '@/widgets/Catalog/AddToCartButton';
import VariantSelector from '@/widgets/Catalog/VariantSelector';
import ShareButton from '@/widgets/Catalog/ShareButton';
import PriceDisplay from '@/widgets/Catalog/pdp/PriceDisplay';
import DeliveryRow from '@/widgets/Catalog/pdp/DeliveryRow';
import ProductTabs from '@/widgets/Catalog/pdp/ProductTabs';
import type { ProductDetailData } from '@/widgets/Catalog/useProductDetail';
import type { MenuItem } from '@/entities/menu-item/types';
import type { LinkedAttribute } from '@/shared/hooks/useLinkedAttributes';
import { Heart } from 'lucide-react';
import { resolveName } from '@/shared/lib/localization';

interface ProductInfoPanelProps {
  product: MenuItem;
  detail: ProductDetailData;
  /** When true, renders in compact mobile mode (no sticky, smaller heading) */
  compact?: boolean;
  locale?: string;
  t: ReturnType<() => any>;
}

export default function ProductInfoPanel({
  product,
  detail,
  compact = false,
  locale,
  t,
}: ProductInfoPanelProps) {
  const {
    activeVariant,
    priceProps,
    variantProps,
    inStock,
    lowStock,
    stock,
    hasSpecs,
    linkedAttrs,
    wishlisted,
    handleWishlistToggle,
  } = detail;

  if (compact) {
    // ── Mobile layout ──────────────────────────────────────────────────
    return (
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
          {resolveName(product, locale)}
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
          <ProductTabs product={product} hasSpecs={hasSpecs} linkedAttrs={linkedAttrs} locale={locale} t={t} />
        </div>
      </div>
    );
  }

  // ── Desktop layout ──────────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-center justify-end gap-3 mb-8">
        <button
          onClick={handleWishlistToggle}
          className="group flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors duration-150"
        >
          <Heart
            size={13}
            className={wishlisted ? 'fill-primary text-primary' : 'group-hover:text-foreground'}
          />
          {wishlisted ? t('inWishlist') : t('addToWishlist')}
        </button>
        <span className="text-border-light">|</span>
        <ShareButton productName={resolveName(product, locale)} />
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
        {resolveName(product, locale)}
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
        <ProductTabs product={product} hasSpecs={hasSpecs} linkedAttrs={linkedAttrs} locale={locale} t={t} />
      </div>
    </div>
  );
}
