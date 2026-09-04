'use client';
import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { BranchSection, CategoryListSettings } from '@/entities/branch-section/types';
import { useTenant } from '@/entities/tenant/TenantContext';
import Image from 'next/image';

interface CategoryListSectionProps {
  section: BranchSection;
  locale: string;
  tenantDomain: string;
  branchSlug?: string;
}

interface CategoryData {
  key: string;
  name: string;
  coverImage?: string;
  productCount?: number;
  cardBgColor?: string;
  description?: string;
  imageAspectRatio?: string;
  parentCategoryKey?: string;
}

export default function CategoryListSection({ section, locale, branchSlug }: CategoryListSectionProps) {
  const tenant = useTenant();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  const tenantId = tenant?.tenantId;
  const settings = (section.settings || {}) as CategoryListSettings;
  const categoryOrder = settings.categoryOrder || [];
  const layout = settings.layout || 'grid';
  const columns = settings.columns || 3;

  useEffect(() => {
    if (!tenantId) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/categories?tenantId=${tenantId}&niche=ecommerce`)
      .then(r => r.json())
      .then(data => {
        setCategories(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tenantId]);

  if (loading) {
    return <div className="py-10 text-center text-muted-foreground">Loading categories…</div>;
  }

  // Sort categories by the defined order, then append any not in the order list
  const sortedCategories = categoryOrder.length > 0
    ? [
        ...categoryOrder
          .map(key => categories.find(c => c.key === key))
          .filter(Boolean) as CategoryData[],
        ...categories.filter(c => !categoryOrder.includes(c.key)),
      ]
    : categories;

  // Filter out subcategories (they're rendered under their parent)
  const topLevel = sortedCategories.filter(c => !c.parentCategoryKey);

  if (!topLevel.length) return null;

  const gridCols = columns === 2 ? 'md:grid-cols-2' : columns === 4 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-3';

  if (layout === 'carousel') {
    return (
      <section className="py-10 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-foreground">Shop by Category</h2>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {topLevel.map(cat => (
              <Link
                key={cat.key}
                href={`/${locale}/${branchSlug}/catalog/${cat.key}`}
                className="flex-shrink-0 w-64 group"
              >
                <div className="rounded-xl overflow-hidden border bg-card hover:shadow-lg transition-shadow">
                  {cat.coverImage && (
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <Image
                        src={cat.coverImage}
                        alt={cat.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="font-semibold">{cat.name}</h3>
                    {settings.showProductCount && cat.productCount != null && (
                      <p className="text-sm text-muted-foreground">{cat.productCount} products</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold mb-8 text-foreground">Shop by Category</h2>
        <div className={`grid grid-cols-1 ${gridCols} gap-4 lg:gap-6`}>
          {topLevel.map(cat => (
            <Link
              key={cat.key}
              href={`/${locale}/${branchSlug}/catalog/${cat.key}`}
              className="group"
            >
              <div
                className="rounded-xl overflow-hidden border bg-card hover:shadow-lg transition-shadow"
                style={cat.cardBgColor ? { backgroundColor: cat.cardBgColor } : undefined}
              >
                {cat.coverImage && (
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <Image
                      src={cat.coverImage}
                      alt={cat.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{cat.name}</h3>
                  {cat.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{cat.description}</p>
                  )}
                  {settings.showProductCount && cat.productCount != null && (
                    <p className="text-sm text-muted-foreground mt-2">{cat.productCount} products</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
