'use client';
import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { BranchSection } from '@/entities/branch-section/types';
import SectionBackground from './SectionBackground';
import { useTenant } from '@/entities/tenant/TenantContext';
import EcommerceGridLayout from '@/widgets/Catalog/EcommerceGridLayout';
import CategoryGrid from '@/widgets/Catalog/CategoryGrid';
import type { MenuItem } from '@/entities/menu-item/types';
import type { CategoryCardData } from '@/widgets/Catalog/CategoryGrid';
import type { ProductCardVariant } from '@/entities/menu-item/types';

interface EnrichedCategoryData extends CategoryCardData {
  productCardVariant?: ProductCardVariant;
  productImageAspectRatio?: string;
  productCardWidth?: string;
}

interface SystemCatalogSectionProps {
  section: BranchSection;
  locale: string;
  tenantDomain: string;
  branchSlug?: string;
  allMenuItems?: MenuItem[];
  categories?: Array<{ key: string; name: string; coverImage?: string; productCount?: number; cardBgColor?: string; description?: string; imageAspectRatio?: string; parentCategoryKey?: string; productCardVariant?: string; productImageAspectRatio?: string; productCardWidth?: string; translations?: Record<string, { name?: string; description?: string }> }>;
}

export default function SystemCatalogSection({ section, locale, branchSlug, allMenuItems, categories: preloadedCategories }: SystemCatalogSectionProps) {
  const t = useTranslations('catalog');
  const tenant = useTenant();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<EnrichedCategoryData[]>([]);
  const [loading, setLoading] = useState(!allMenuItems);

  const tenantId = tenant?.tenantId;
  const branchId = (section as any).branchId;
  const globalVariant: ProductCardVariant = (tenant?.theme?.productCardVariant as ProductCardVariant) || 'action-bar';
  const currencySymbol = tenant?.primaryCurrency === 'PLN' ? 'zł' : tenant?.primaryCurrency || '€';

  // Section-level card overrides (from page builder settings)
  const sectionSettings = (section.settings || {}) as Record<string, unknown>;
  const sectionVariant = sectionSettings.productCardVariant as ProductCardVariant | undefined;
  const sectionAspectRatio = sectionSettings.productImageAspectRatio as string | undefined;
  const sectionCardWidth = sectionSettings.productCardWidth as string | undefined;

  useEffect(() => {
    // Use pre-fetched data when available
    if (allMenuItems && preloadedCategories) {
      setItems(allMenuItems.filter((item) => item.productType === 'physical_product'));
      setCategories(preloadedCategories.map((cat) => ({
        name: cat.name,
        key: cat.key,
        coverImage: cat.coverImage,
        productCount: cat.productCount,
        cardBgColor: cat.cardBgColor,
        description: cat.description,
        imageAspectRatio: cat.imageAspectRatio,
        parentCategoryKey: cat.parentCategoryKey,
        productCardVariant: cat.productCardVariant as ProductCardVariant | undefined,
        productImageAspectRatio: cat.productImageAspectRatio,
        productCardWidth: cat.productCardWidth,
        translations: cat.translations || {},
      })));
      setLoading(false);
      return;
    }

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
          productCardVariant: cat.productCardVariant || undefined,
          productImageAspectRatio: cat.productImageAspectRatio || undefined,
          productCardWidth: cat.productCardWidth || undefined,
          translations: cat.translations || {},
        })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tenantId, branchId, allMenuItems, preloadedCategories]);

  // Group items by category and resolve per-category card settings
  // Fallback chain: section setting → category setting → global → default
  const groupedByCategory = useMemo(() => {
    const grouped: Record<string, { category: EnrichedCategoryData; products: MenuItem[] }> = {};

    for (const cat of categories) {
      if (cat.parentCategoryKey) continue; // skip subcategories in top-level grouping
      grouped[cat.key] = { category: cat, products: [] };
    }

    for (const item of items) {
      const key = (item.categoryKey || item.category || 'uncategorized') as string;
      if (!grouped[key]) {
        grouped[key] = {
          category: { name: key, key },
          products: [],
        };
      }
      grouped[key].products.push(item);
    }

    return Object.values(grouped).filter(g => g.products.length > 0);
  }, [categories, items]);

  const bg = (section.settings as any)?.background;

  if (loading) {
    return <div className="py-10 text-center text-muted-foreground">Loading catalog…</div>;
  }

  return (
    <section className="relative py-10 lg:py-16">
      <SectionBackground background={bg} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold mb-8 text-foreground">{t('ourProducts')}</h2>
        {categories.length > 0 && (
          <div className="mb-10">
            <CategoryGrid categories={categories} />
          </div>
        )}

        {groupedByCategory.map(({ category, products }) => {
          const variant: ProductCardVariant =
            sectionVariant ||
            category.productCardVariant ||
            globalVariant;
          const aspectRatio = sectionAspectRatio || category.productImageAspectRatio || '1/1';
          const cardWidth = sectionCardWidth || category.productCardWidth || 'default';

          return (
            <div key={category.key} className="mb-10 last:mb-0">
              <h3 className="text-xl font-semibold text-foreground mb-4">{(category as any).translations?.[locale]?.name || category.name}</h3>
              <EcommerceGridLayout
                items={products}
                variant={variant}
                currencySymbol={currencySymbol}
                locale={locale}
                productImageAspectRatio={aspectRatio}
                productCardWidth={cardWidth}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
