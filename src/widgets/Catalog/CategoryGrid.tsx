'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { ImageOff } from 'lucide-react';

export interface CategoryCardData {
  name: string;
  key: string;
  coverImage?: string;
  productCount?: number;
  cardBgColor?: string;
  description?: string;
  imageAspectRatio?: string;
  parentCategoryKey?: string;
  children?: CategoryCardData[];
}

export default function CategoryGrid({ categories, bgColor }: { categories: CategoryCardData[], bgColor?: string }) {
  const locale = useLocale();
  const { branchSlug } = useParams();
  const t = useTranslations('catalog');

  if (!categories || categories.length === 0) return null;

  // Only show top-level categories (no parentCategoryKey)
  const topLevel = categories.filter(c => !c.parentCategoryKey);
  const childMap = new Map<string, CategoryCardData[]>();
  for (const cat of categories) {
    if (cat.parentCategoryKey) {
      const children = childMap.get(cat.parentCategoryKey) || [];
      children.push(cat);
      childMap.set(cat.parentCategoryKey, children);
    }
  }

  return (
    <section className="py-12" style={{ backgroundColor: bgColor || 'transparent' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="uppercase tracking-[0.2em] text-xs text-muted-foreground mb-6 font-semibold">
          {t('shopByCategory')}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {topLevel.map((cat) => {
            const children = childMap.get(cat.key) || [];
            return (
              <div key={cat.key} className="space-y-2">
                <Link
                  href={`/${locale}/${branchSlug}/catalog/${cat.key}`}
                  className="relative overflow-hidden rounded-xl border border-border group block"
                  style={{
                    aspectRatio: cat.imageAspectRatio || '1/1',
                    backgroundColor: cat.cardBgColor || 'transparent',
                  }}
                >
                  {cat.coverImage ? (
                    <Image
                      src={cat.coverImage}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover w-full h-full transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                      <ImageOff className="w-8 h-8" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  <div className="absolute bottom-0 left-0 p-4 z-10">
                    <h3 className="text-lg font-medium text-white drop-shadow-md">{cat.name}</h3>
                    {cat.description && (
                      <p className="text-sm text-white/70 drop-shadow-md mt-1">{cat.description}</p>
                    )}
                    {cat.productCount !== undefined && (
                      <p className="text-sm text-white/80 drop-shadow-md mt-1">
                        {cat.productCount} {cat.productCount === 1 ? 'item' : 'items'}
                      </p>
                    )}
                  </div>
                </Link>

                {/* Subcategory chips */}
                {children.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pl-1">
                    {children.map(child => (
                      <Link
                        key={child.key}
                        href={`/${locale}/${branchSlug}/catalog/${child.key}`}
                        className="text-xs text-muted-foreground hover:text-foreground border border-border-light rounded-full px-2.5 py-1 hover:bg-muted/50 transition-colors"
                      >
                        {child.name}
                        {child.productCount !== undefined && (
                          <span className="ml-1 text-muted-foreground/60">({child.productCount})</span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}