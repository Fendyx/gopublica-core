'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useTenant } from '@/entities/tenant/TenantContext';
import type { MenuItem } from '@/entities/menu-item/types';
import ProductCard from './ProductCard';
import type { ProductCardVariant } from '@/entities/menu-item/types';

const CURRENCY_SYMBOLS: Record<string, string> = {
  PLN: 'zł', EUR: '€', USD: '$', UAH: '₴', GBP: '£',
};

function getCurrencySymbol(currencyCode?: string): string {
  return currencyCode ? CURRENCY_SYMBOLS[currencyCode] || currencyCode : 'zł';
}

/** Minimal shape returned by the public categories API. */
interface CategoryInfo {
  key: string;
  productCardVariant?: string | null;
}

interface RelatedProductsProps {
  productId: string;
}

export default function RelatedProducts({ productId }: RelatedProductsProps) {
  const t = useTranslations('productDetail');
  const { locale } = useParams();
  const localeStr = Array.isArray(locale) ? locale[0] : locale;
  const tenant = useTenant();
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const tenantId = tenant?.tenantId;
  const currencySymbol = getCurrencySymbol(tenant?.theme?.primary as any);
  const globalVariant = (tenant?.theme?.productCardVariant as ProductCardVariant) || 'action-bar';

  useEffect(() => {
    if (!tenantId || !productId) return;
    const fetchRelated = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/public/products/related?productId=${productId}&tenantId=${tenantId}&limit=6`,
            { cache: 'no-store' },
          ),
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/saas/categories?tenantId=${tenantId}&niche=${tenant?.niche || 'ecommerce'}`,
            { cache: 'no-store' },
          ),
        ]);
        if (productsRes.ok) {
          setProducts(await productsRes.json());
        }
        if (categoriesRes.ok) {
          setCategories(await categoriesRes.json());
        }
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRelated();
  }, [productId, tenantId, tenant?.niche]);

  if (loading || products.length === 0) return null;

  // Build a lookup map: categoryKey → productCardVariant
  const variantMap = new Map<string, string>();
  for (const cat of categories) {
    if (cat.productCardVariant) {
      variantMap.set(cat.key, cat.productCardVariant);
    }
  }

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold text-foreground mb-6">
          {t('relatedProducts')}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {products.map((product) => {
            const variant = ((product.categoryKey && variantMap.get(product.categoryKey)) || globalVariant) as ProductCardVariant;
            return (
              <ProductCard
                key={product._id}
                product={product}
                variant={variant}
                locale={localeStr}
                currencySymbol={currencySymbol}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
