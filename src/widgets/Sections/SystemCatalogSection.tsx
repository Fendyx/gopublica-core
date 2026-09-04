'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { BranchSection } from '@/entities/branch-section/types';
import { useTenant } from '@/entities/tenant/TenantContext';
import EcommerceGridLayout from '@/widgets/Catalog/EcommerceGridLayout';
import CategoryGrid from '@/widgets/Catalog/CategoryGrid';
import type { MenuItem } from '@/entities/menu-item/types';
import type { CategoryCardData } from '@/widgets/Catalog/CategoryGrid';
import type { ProductCardVariant } from '@/entities/menu-item/types';

interface SystemCatalogSectionProps {
  section: BranchSection;
  locale: string;
  tenantDomain: string;
  branchSlug?: string;
}

export default function SystemCatalogSection({ section, locale, branchSlug }: SystemCatalogSectionProps) {
  const t = useTranslations('catalog');
  const tenant = useTenant();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<CategoryCardData[]>([]);
  const [loading, setLoading] = useState(true);

  const tenantId = tenant?.tenantId;
  const branchId = (section as any).branchId;
  const variant: ProductCardVariant = (tenant?.theme?.productCardVariant as ProductCardVariant) || 'action-bar';
  const currencySymbol = tenant?.primaryCurrency === 'PLN' ? 'zł' : tenant?.primaryCurrency || '€';

  useEffect(() => {
    if (!tenantId || !branchId) return;

    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/menu?tenantId=${tenantId}&branchId=${branchId}`).then(r => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/categories?tenantId=${tenantId}&niche=ecommerce`).then(r => r.json()),
    ])
      .then(([menuData, catData]) => {
        setItems(menuData.filter((item: any) => item.productType === 'physical_product'));
        setCategories(catData.map((cat: any) => ({
          name: cat.name,
          key: cat.key,
          coverImage: cat.coverImage,
          productCount: cat.productCount,
          cardBgColor: cat.cardBgColor,
          description: cat.description,
          imageAspectRatio: cat.imageAspectRatio,
          parentCategoryKey: cat.parentCategoryKey,
        })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tenantId, branchId]);

  if (loading) {
    return <div className="py-10 text-center text-muted-foreground">Loading catalog…</div>;
  }

  return (
    <section className="py-10 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold mb-8 text-foreground">{t('ourProducts')}</h2>
        {categories.length > 0 && (
          <div className="mb-10">
            <CategoryGrid categories={categories} locale={locale} branchSlug={branchSlug} />
          </div>
        )}
        <EcommerceGridLayout
          items={items}
          variant={variant}
          currencySymbol={currencySymbol}
          locale={locale}
        />
      </div>
    </section>
  );
}
