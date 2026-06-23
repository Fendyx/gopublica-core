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
import CategoryGrid, { CategoryCardData } from '@/widgets/Catalog/CategoryGrid' // <--- ИМПОРТ
import type { MenuItem } from '@/entities/menu-item/types'

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
  const variant = tenant?.theme?.productCardVariant ?? 'action-bar'
  const currencySymbol = primaryCurrency === 'PLN' ? 'zł' : primaryCurrency || '€'

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
    // Подготавливаем данные для CategoryGrid (считаем кол-во товаров)
    const categoryCardsData: CategoryCardData[] = categories.map(cat => {
      const productCount = items.filter(item => (item.categoryKey || item.category) === cat.key).length;
      return {
        name: cat.name,
        key: cat.key,
        coverImage: cat.coverImage,
        productCount,
        cardBgColor: cat.cardBgColor
      };
    }).filter(cat => cat.productCount > 0);

    // Группируем товары по категориям
    const groupedItems = items.reduce((acc, item) => {
      const key = item.categoryKey || item.category || 'uncategorized';
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);

    return (
      <div className="bg-background">
        {/* Сетка категорий сверху */}
        <CategoryGrid categories={categoryCardsData} bgColor={tenant?.theme?.categoryBgColor} />

        {/* Сами товары */}
        <div className="py-16 bg-surface-page space-y-12">
          {Object.entries(groupedItems).map(([key, products]) => {
            const category = categories.find(c => c.key === key);
            const layout = category?.layout || 'grid-3';
            const categoryName = category?.name || key;
            const bgColor = category?.cardBgColor;

            return (
              // Секция с фоном тянется на всю ширину
              <section 
                key={key} 
                style={bgColor ? { backgroundColor: bgColor } : undefined}
                className={!bgColor ? '' : 'py-12 shadow-sm border-y border-border'}
              >
                {/* Контейнер с отступами внутри секции */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <span>{category?.icon}</span> {categoryName}
                  </h2>

                  {layout === 'carousel' && <EcommerceCarouselLayout items={products} locale={locale} variant={variant} currencySymbol={currencySymbol} />}
                  {layout === 'dynamic' && <EcommerceDynamicGrid items={products} locale={locale} variant={variant} currencySymbol={currencySymbol} />}
                  {layout === 'grid-4' && <EcommerceGridLayout items={products} locale={locale} columns={4} variant={variant} currencySymbol={currencySymbol} />}
                  {(layout === 'grid-3' || !layout) && <EcommerceGridLayout items={products} locale={locale} columns={3} variant={variant} currencySymbol={currencySymbol} />}
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