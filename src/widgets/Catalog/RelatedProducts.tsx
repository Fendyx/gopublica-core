'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useTenant } from '@/entities/tenant/TenantContext';
import type { MenuItem } from '@/entities/menu-item/types';
import EcommerceGridLayout from './EcommerceGridLayout';
import type { ProductCardVariant } from '@/entities/menu-item/types';

const CURRENCY_SYMBOLS: Record<string, string> = {
  PLN: 'zł', EUR: '€', USD: '$', UAH: '₴', GBP: '£',
};

function getCurrencySymbol(currencyCode?: string): string {
  return currencyCode ? CURRENCY_SYMBOLS[currencyCode] || currencyCode : 'zł';
}

interface RelatedProductsProps {
  productId: string;
}

export default function RelatedProducts({ productId }: RelatedProductsProps) {
  const t = useTranslations('productDetail');
  const tenant = useTenant();
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const tenantId = tenant?.tenantId;
  const currencySymbol = getCurrencySymbol(tenant?.theme?.primary as any);
  const variant = (tenant?.theme?.productCardVariant as ProductCardVariant) || 'action-bar';

  useEffect(() => {
    if (!tenantId || !productId) return;
    const fetchRelated = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/public/products/related?productId=${productId}&tenantId=${tenantId}&limit=6`,
          { cache: 'no-store' },
        );
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRelated();
  }, [productId, tenantId]);

  if (loading || products.length === 0) return null;

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold text-foreground mb-6">
          {t('relatedProducts')}
        </h2>
        <EcommerceGridLayout
          items={products}
          columns={3}
          variant={variant}
          currencySymbol={currencySymbol}
        />
      </div>
    </section>
  );
}
