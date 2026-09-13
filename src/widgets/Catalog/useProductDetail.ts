'use client';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { MenuItem } from '@/entities/menu-item/types';
import { useBranchSettings } from '@/entities/branch/useBranchSettings';
import { useLinkedAttributes, type LinkedAttribute } from '@/shared/hooks/useLinkedAttributes';
import { useWishlistStore } from '@/shared/store/wishlistStore';
import { useToast } from '@/shared/ui/Toast';
import { hasAttributes, hasWeightVal, hasDims, hasTagsList } from '@/widgets/Catalog/useProductDetailHelpers';

const CURRENCY_SYMBOLS: Record<string, string> = {
  PLN: 'zł', EUR: '€', USD: '$', UAH: '₴', GBP: '£', CZK: 'Kč', CHF: 'CHF',
};

export function getCurrencySymbol(currencyCode?: string): string {
  return currencyCode ? CURRENCY_SYMBOLS[currencyCode] || currencyCode : 'zł';
}

export interface ProductDetailData {
  hasVariants: boolean;
  defaultVariant: any;
  activeVariant: any;
  selectedVariantId: string | null;
  setSelectedVariantId: (id: string | null) => void;
  displayPrice: number | null | undefined;
  compareAtPrice: number | null | undefined;
  stock: number | null | undefined;
  hasDiscount: boolean;
  discountPercent: number;
  showPrice: boolean;
  inStock: boolean;
  lowStock: boolean;
  allImages: string[];
  priceProps: {
    showPrice: boolean;
    displayPrice: number | null | undefined;
    compareAtPrice: number | null | undefined;
    hasDiscount: boolean;
    discountPercent: number;
    currencySymbol: string;
  };
  variantProps: {
    variants: any[];
    selectedId: string | null;
    onChange: (id: string | null) => void;
  } | null;
  linkedAttrs: LinkedAttribute[];
  hasSpecs: boolean;
  wishlisted: boolean;
  handleWishlistToggle: () => void;
}

export function useProductDetail(
  product: MenuItem,
  locale: string,
  tenant: any,
): ProductDetailData {
  const { branchSlug } = useParams();
  const router = useRouter();
  const { primaryCurrency } = useBranchSettings();
  const currencySymbol = getCurrencySymbol(primaryCurrency);
  const { showToast } = useToast();
  const t = useTranslations('productDetail');

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

  // ── Wishlist (Zustand store) ────────────────────────────────────────────
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const loadFromServer = useWishlistStore((s) => s.loadFromServer);
  // Subscribe to items array directly so the component re-renders on toggle
  const wishlisted = useWishlistStore((s) => product._id ? s.items.includes(product._id) : false);

  // Hydrate wishlist from server on mount when authenticated
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('customer_token')) {
      loadFromServer();
    }
  }, [loadFromServer]);

  const handleWishlistToggle = useCallback(() => {
    if (!localStorage.getItem('customer_token')) {
      showToast(t('loginToWishlist'), 'info');
      router.push(`/${locale}/login`);
      return;
    }
    if (product._id) {
      toggleWishlist(product._id);
    }
  }, [product._id, toggleWishlist, showToast, t, router, locale]);

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

  const linkedAttrs = useLinkedAttributes(product.attributeRefs, tenant.tenantId, locale);
  const hasSpecs = hasAttributes(product) || hasWeightVal(product) || hasDims(product) || hasTagsList(product) || linkedAttrs.length > 0;

  return {
    hasVariants,
    defaultVariant,
    activeVariant,
    selectedVariantId,
    setSelectedVariantId,
    displayPrice,
    compareAtPrice,
    stock,
    hasDiscount,
    discountPercent,
    showPrice,
    inStock,
    lowStock,
    allImages,
    priceProps,
    variantProps,
    linkedAttrs,
    hasSpecs,
    wishlisted,
    handleWishlistToggle,
  };
}
