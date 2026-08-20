'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useRef, useCallback, useEffect, useState } from 'react';
import { BranchSection, BranchSectionItem, FeatureCarouselSettings } from '@/entities/branch-section/types';
import type { MenuItem } from '@/entities/menu-item/types';
import ProductCard from '@/widgets/Catalog/ProductCard';
import MenuItemCard from '@/entities/menu-item/MenuItemCard';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface FeatureCarouselProps {
  section: BranchSection;
  locale: string;
  tenantDomain: string;
  /** Pre-fetched dynamic items for ecommerce/menu modes (server-side resolved) */
  dynamicItems?: MenuItem[];
  /** Currency symbol for price display (server-side resolved) */
  currencySymbol?: string;
}

export default function FeatureCarousel({ section, locale, tenantDomain, dynamicItems = [], currencySymbol = 'zł' }: FeatureCarouselProps) {
  const settings = (section.settings || {}) as FeatureCarouselSettings;
  const mode = settings.mode || 'manual';
  const selectionMode = settings.selectionMode || 'items';
  const selectedProductIds = settings.selectedProductIds || [];
  const selectedMenuItemIds = settings.selectedMenuItemIds || [];
  const selectedCategoryKeys = settings.selectedCategoryKeys || [];
  const productIdsKey = selectedProductIds.join(',');
  const menuItemIdsKey = selectedMenuItemIds.join(',');
  const categoryKeysKey = selectedCategoryKeys.join(',');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  const scrollByAmount = useCallback((amount: number) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollBy({ left: amount, behavior: 'smooth' });
    setTimeout(updateScrollButtons, 300);
  }, [updateScrollButtons]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener('scroll', updateScrollButtons);
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [updateScrollButtons]);

  const sectionTitle = section.translations?.[locale]?.title;

  // Manual mode: use existing BranchSectionItem[] rendering
  if (mode === 'manual') {
    const items: BranchSectionItem[] = section.items || [];
    if (items.length === 0) return null;

    return (
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            {sectionTitle && (
              <h2 className="text-3xl font-bold">{sectionTitle}</h2>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => scrollByAmount(-320)}
                disabled={!canScrollLeft}
                className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-full bg-surface-card border border-border text-text-primary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scrollByAmount(320)}
                disabled={!canScrollRight}
                className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-full bg-surface-card border border-border text-text-primary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-4 snap-x snap-mandatory scrollbar-hide"
          >
            {items.map((item) => {
              const itemTranslations = item.translations[locale] ?? {};

              return (
                <div
                  key={item._id}
                  className="snap-start flex-none w-[80%] sm:w-[60%] md:w-[25%] block group"
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
                    {item.media?.url ? (
                      item.media.type === 'video' ? (
                        <video
                          autoPlay
                          muted
                          loop
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        >
                          <source src={item.media.url} type="video/mp4" />
                        </video>
                      ) : (
                        <Image
                          src={item.media.url}
                          alt={itemTranslations.title ?? ''}
                          fill
                          sizes="(max-width: 640px) 80vw, (max-width: 1024px) 60vw, 25vw"
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                      )
                    ) : (
                      <div className="absolute inset-0 w-full h-full bg-surface-hover flex items-center justify-center text-text-tertiary">
                        No Image
                      </div>
                    )}
                    {/* Bottom-to-top gradient scrim */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
                    {/* Text overlay at bottom-left */}
                    <div className="absolute bottom-4 left-4 right-4">
                      {itemTranslations.title && (
                        <h3 className="text-white font-semibold text-base line-clamp-2">
                          {itemTranslations.title}
                        </h3>
                      )}
                      {itemTranslations.subtitle && (
                        <p className="text-white/80 text-sm mt-1 line-clamp-2">
                          {itemTranslations.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // Dynamic modes: ecommerce or menu - use pre-fetched items from props
  if (dynamicItems.length === 0) return null;

  const productCardVariant = settings.productCardVariant || 'action-bar';
  const productImageAspectRatio = settings.productImageAspectRatio || '1/1';

  // Calculate "View All" URL
  const baseViewAllHref = mode === 'ecommerce'
    ? `/${locale}/${tenantDomain}/catalog`
    : `/${locale}/${tenantDomain}/menu`;
  const viewAllHref = (selectionMode === 'categories' && selectedCategoryKeys.length === 1)
    ? `${baseViewAllHref}?category=${encodeURIComponent(selectedCategoryKeys[0])}`
    : baseViewAllHref;
  const viewAllLabel = settings.viewAllLabel || (mode === 'ecommerce' ? 'View All Products' : 'View All Menu');

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          {sectionTitle && (
            <h2 className="text-3xl font-bold">{sectionTitle}</h2>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollByAmount(-320)}
              disabled={!canScrollLeft}
              className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-full bg-surface-card border border-border text-text-primary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollByAmount(320)}
              disabled={!canScrollRight}
              className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-full bg-surface-card border border-border text-text-primary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            {settings.showViewAll && (
              <Link
                href={viewAllHref}
                className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                {viewAllLabel}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-4 snap-x snap-mandatory scrollbar-hide"
        >
          {dynamicItems.map((item) => (
            <div
              key={item._id || item.id}
              className="snap-start flex-none w-[80%] sm:w-[60%] md:w-[25%] block"
            >
              {mode === 'ecommerce' ? (
                <ProductCard
                  product={item}
                  variant={productCardVariant}
                  locale={locale}
                  currencySymbol={currencySymbol}
                  imageAspectRatio={productImageAspectRatio}
                />
              ) : (
                <MenuItemCard
                  item={item}
                  mode="public"
                  layout="carousel"
                  locale={locale}
                />
              )}
            </div>
          ))}

          {settings.showViewAll && (
            <Link
              href={viewAllHref}
              className="snap-start flex-none w-[80%] sm:w-[60%] md:w-[25%] block"
            >
              <div className="h-full flex flex-col items-center justify-center bg-muted/30 border border-border rounded-xl p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                <ArrowRight className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="font-semibold text-muted-foreground">{viewAllLabel}</span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
