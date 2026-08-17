'use client';
import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { BranchSection, BranchSectionItem, EntityCarouselSettings } from '@/entities/branch-section/types';
import { useTenant } from '@/entities/tenant/TenantContext';
import { useBranch } from '@/entities/branch/BranchContext';
import { useBranchSettings } from '@/entities/branch/useBranchSettings';
import type { MenuItem } from '@/entities/menu-item/types';
import ProductCard from '@/widgets/Catalog/ProductCard';
import MenuItemCard from '@/entities/menu-item/MenuItemCard';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePathname, useParams } from 'next/navigation';

interface EntityCarouselProps {
  section: BranchSection;
  locale: string;
  tenantDomain: string;
}

export default function EntityCarousel({ section, locale, tenantDomain }: EntityCarouselProps) {
  const settings = (section.settings || {}) as EntityCarouselSettings;
  const mode = settings.mode || 'manual';
  const selectionMode = settings.selectionMode || 'items';
  const selectedProductIds = settings.selectedProductIds || [];
  const selectedMenuItemIds = settings.selectedMenuItemIds || [];
  const selectedCategoryKeys = settings.selectedCategoryKeys || [];
  const productIdsKey = selectedProductIds.join(',');
  const menuItemIdsKey = selectedMenuItemIds.join(',');
  const categoryKeysKey = selectedCategoryKeys.join(',');

  const tenant = useTenant();
  const { selectedBranch } = useBranch();
  const { branchSlug } = useParams();
  const { primaryCurrency } = useBranchSettings();
  const [dynamicItems, setDynamicItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
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

  const pathname = usePathname()

  useEffect(() => {
    if (mode === 'manual') return;

    const loadItems = async () => {
      const currentTenantId = selectedBranch?.tenantId ?? tenant?.tenantId;
      if (!currentTenantId) return;

      setLoading(true);
      try {
        const params = new URLSearchParams({ tenantId: currentTenantId });
        if (selectedBranch?._id) params.set('branchId', selectedBranch._id);

        const url = `${process.env.NEXT_PUBLIC_API_URL}/api/saas/menu?${params.toString()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch menu');
        const allItems: MenuItem[] = await res.json();

        let filtered: MenuItem[];

        if (selectionMode === 'categories' && selectedCategoryKeys.length > 0) {
          // Category mode: filter items by categoryKey or category name
          filtered = allItems.filter((item) => {
            const itemCategory = item.categoryKey || item.category || '';
            return selectedCategoryKeys.includes(itemCategory);
          });
        } else {
          // Item mode: filter by selected IDs
          const ids = mode === 'ecommerce' ? selectedProductIds : selectedMenuItemIds;
          filtered = allItems.filter((item) => {
            const itemId = item._id || item.id || '';
            return ids.includes(itemId);
          });
        }

        setDynamicItems(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadItems();
  }, [mode, selectionMode, selectedBranch?.tenantId, selectedBranch?._id, tenant?.tenantId, productIdsKey, menuItemIdsKey, categoryKeysKey, pathname]);

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
                <Link
                  key={item._id}
                  href={`/${locale || 'en'}/${branchSlug}/entity/${item.slug}`}
                  className="snap-start flex-none w-[80%] sm:w-[60%] md:w-[30%] block group"
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
                    {item.media.type === 'video' ? (
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
                      <img
                        src={item.media.url}
                        alt={itemTranslations.title ?? ''}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
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
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // Dynamic modes: ecommerce or menu
  if (loading) {
    return (
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            {sectionTitle && (
              <h2 className="text-3xl font-bold">{sectionTitle}</h2>
            )}
            <div className="flex items-center gap-2">
              <div className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-full bg-surface-card border border-border" />
              <div className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-full bg-surface-card border border-border" />
            </div>
          </div>
          <div className="flex overflow-x-auto gap-4 snap-x snap-mandatory scrollbar-hide">
            <div className="snap-start flex-none w-[80%] sm:w-[60%] md:w-[30%] p-4 bg-muted animate-pulse rounded-xl">
              <div className="h-60 bg-muted/50 rounded-lg mb-2"></div>
              <div className="h-4 bg-muted/50 rounded mb-1"></div>
              <div className="h-4 bg-muted/50 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (dynamicItems.length === 0) return null;

  const productCardVariant = settings.productCardVariant || 'action-bar';
  const productImageAspectRatio = settings.productImageAspectRatio || '1/1';
  const currencySymbol = primaryCurrency ? (primaryCurrency === 'PLN' ? 'zł' : primaryCurrency === 'EUR' ? '€' : primaryCurrency === 'USD' ? '$' : primaryCurrency) : 'zł';

  // Calculate "View All" URL
  const baseViewAllHref = mode === 'ecommerce'
    ? `/${locale}/${branchSlug}/catalog`
    : `/${locale}/${branchSlug}/menu`;
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
              className="snap-start flex-none w-[80%] sm:w-[60%] md:w-[30%] block"
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
              className="snap-start flex-none w-[80%] sm:w-[60%] md:w-[30%] block"
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
