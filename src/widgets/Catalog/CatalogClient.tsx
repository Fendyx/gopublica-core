'use client'
import { useBranch } from '@/entities/branch/BranchContext'
import { useBranchSettings } from '@/entities/branch/useBranchSettings'
import { useEffect, useState } from 'react'
import { useTenant } from '@/entities/tenant/TenantContext'
import { useLocale } from 'next-intl'
import Menu from '@/widgets/Menu'
import EcommerceGridLayout from '@/widgets/Catalog/EcommerceGridLayout'
import EcommerceCarouselLayout from '@/widgets/Catalog/EcommerceCarouselLayout'
import EcommerceDynamicGrid from '@/widgets/Catalog/EcommerceDynamicGrid'
import CategoryGrid, { CategoryCardData } from '@/widgets/Catalog/CategoryGrid'
import FeaturedProductBanner from '@/widgets/Catalog/FeaturedProductBanner'
import type { MenuItem, ProductCardVariant } from '@/entities/menu-item/types'

const CURRENCY_SYMBOLS: Record<string, string> = {
  PLN: 'zł', EUR: '€', USD: '$', UAH: '₴', GBP: '£', CZK: 'Kč', CHF: 'CHF',
};

function getCurrencySymbol(currencyCode?: string): string {
  return currencyCode ? CURRENCY_SYMBOLS[currencyCode] || currencyCode : 'zł';
}

const FEATURED_KEY = 'featured';

export default function CatalogClient() {
  const { selectedBranch } = useBranch()
  const { primaryCurrency } = useBranchSettings();
  const tenant = useTenant()
  const locale = useLocale();
  const [items, setItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const tenantId = selectedBranch?.tenantId ?? tenant?.tenantId
  const menuStyle = tenant?.theme?.menuStyle ?? 'grid'
  const niche = tenant?.niche ?? 'food'

  const ecommerceLayout = tenant?.theme?.ecommerceLayout ?? 'grid-3'
  const globalVariant = (tenant?.theme?.productCardVariant as ProductCardVariant) || 'action-bar';
  const currencySymbol = getCurrencySymbol(primaryCurrency);

  useEffect(() => {
    const fetchCatalog = async () => {
      if (!selectedBranch || !tenantId) return
      try {
        const url = `${process.env.NEXT_PUBLIC_API_URL}/api/saas/menu?tenantId=${tenantId}&branchId=${selectedBranch._id}`
        const res = await fetch(url)
        if (!res.ok) throw new Error('Failed to load catalog')
        const data: MenuItem[] = await res.json()
        setItems(data)

        const catRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/categories?tenantId=${tenantId}&niche=ecommerce`)
        const catData = await catRes.json()
        setCategories(catData)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchCatalog()
  }, [selectedBranch, tenantId])

  if (loading) return <div className="text-center py-10">Загрузка...</div>

  if (niche === 'ecommerce') {
    const featuredItems = items.filter(item => item.isFeatured === true);
    const allItems = items;

    // Категории + виртуальная featured, если есть featured‑товары
    const hasFeatured = featuredItems.length > 0;
    const allCategories = hasFeatured
      ? [{ key: FEATURED_KEY, name: 'Featured', layout: 'featured' }, ...categories]
      : categories;

    // Карточки категорий (без featured)
    const categoryCardsData: CategoryCardData[] = categories
      .filter(cat => cat.key !== FEATURED_KEY)
      .map(cat => {
        const productCount = allItems.filter(item => (item.categoryKey || item.category) === cat.key).length;
        return {
          name: cat.name,
          key: cat.key,
          coverImage: cat.coverImage,
          productCount,
          cardBgColor: cat.cardBgColor,
          description: cat.description,
          imageAspectRatio: cat.imageAspectRatio,
          productImageAspectRatio: cat.productImageAspectRatio,
        };
      })
      .filter(cat => cat.productCount > 0);

    // Группировка всех товаров по категориям
    const groupedItems = allItems.reduce((acc, item) => {
      const key = item.categoryKey || item.category || 'uncategorized';
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);

    // Восстановленный порядок категорий (если есть в localStorage)
    const savedOrder = (typeof window !== 'undefined') ? localStorage.getItem(`${tenant?.tenantId}_categories_order`) : null;
    let orderedCats = allCategories;
    if (savedOrder) {
      try {
        const orderKeys: string[] = JSON.parse(savedOrder);
        orderedCats = orderKeys
          .map(key => allCategories.find(c => c.key === key))
          .filter(Boolean) as any[];
        const missingCats = allCategories.filter(c => !orderedCats.some(oc => oc.key === c.key));
        orderedCats = [...orderedCats, ...missingCats];
      } catch {}
    }

    return (
      <div className="bg-transparent">
        <CategoryGrid categories={categoryCardsData} bgColor={tenant?.theme?.categoryBgColor} />

        <div className="py-16 bg-transparent space-y-12">
          {orderedCats.map(cat => {
            if (cat.key === FEATURED_KEY) {
              return featuredItems.length > 0 ? (
                <div key={FEATURED_KEY} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                  {featuredItems.map(product => (
                    <FeaturedProductBanner
                      key={product._id}
                      product={product}
                      locale={locale}
                      currencySymbol={currencySymbol}
                    />
                  ))}
                </div>
              ) : null;
            }
            const products = groupedItems[cat.key] || [];
            if (products.length === 0) return null;

            const layout = cat.layout || 'grid-3';
            const bgColor = cat.cardBgColor;
            const variant = (cat.productCardVariant || globalVariant) as ProductCardVariant;

            return (
              <section 
                key={cat.key} 
                style={bgColor ? { backgroundColor: bgColor } : undefined}
                className={!bgColor ? '' : 'py-12 shadow-sm border-y border-border'}
              >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <h2 className="text-2xl font-bold text-foreground mb-1">
                    {cat.name}
                  </h2>
                  {cat.description && (
                    <p className="text-muted-foreground mb-6">{cat.description}</p>
                  )}

                  {layout === 'carousel' && <EcommerceCarouselLayout items={products} locale={locale} variant={variant} currencySymbol={currencySymbol} productImageAspectRatio={cat.productImageAspectRatio || '1/1'} autoplay={cat.carouselAutoplay ?? false} productCardWidth={cat.productCardWidth || 'default'}/>}
                  {layout === 'dynamic' && <EcommerceDynamicGrid items={products} locale={locale} variant={variant} currencySymbol={currencySymbol} productImageAspectRatio={cat.productImageAspectRatio || '1/1'} productCardWidth={cat.productCardWidth || 'default'}/> }
                  {layout === 'grid-4' && <EcommerceGridLayout items={products} locale={locale} columns={4} variant={variant} currencySymbol={currencySymbol} productImageAspectRatio={cat.productImageAspectRatio || '1/1'} productCardWidth={cat.productCardWidth || 'default'}/>}
                  {(layout === 'grid-3' || !layout) && <EcommerceGridLayout items={products} locale={locale} columns={3} variant={variant} currencySymbol={currencySymbol} productImageAspectRatio={cat.productImageAspectRatio || '1/1'} productCardWidth={cat.productCardWidth || 'default'}/>}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    )
  }

  return <Menu items={items} menuStyle={menuStyle} />
}