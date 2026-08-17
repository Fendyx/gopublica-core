// src/widgets/Menu/MenuLayout.tsx
'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import type { MenuItem } from '@/entities/menu-item/types'
import MenuItemCard from '@/entities/menu-item/MenuItemCard'
import { useBranchSettings } from '@/entities/branch/useBranchSettings'
import { useTenant } from '@/entities/tenant/TenantContext'

interface CategoryData {
  name: string
  translations: Record<string, string>
  icon: string
}

interface CategoryApiItem {
  key: string
  name?: string
  translations?: Record<string, string>
  icon?: string
}

export default function MenuLayout({ items, menuStyle }: { items: MenuItem[]; menuStyle: 'grid' | 'list' }) {
  const searchParams = useSearchParams()
  const urlCategory = searchParams.get('category')
  const [activeCategory, setActiveCategory] = useState<string>(urlCategory || 'all')
  const menuContainerRef = useRef<HTMLDivElement>(null)
  const t = useTranslations('menu')
  const locale = useLocale()
  const { primaryLanguage, loading: settingsLoading } = useBranchSettings()

  // 👇 Достаем данные тенанта из контекста
  const tenant = useTenant()
  const tenantId = tenant?.tenantId
  // Always use 'food' niche for menu categories — hybrid tenants may have niche='ecommerce'
  const niche = 'food'

  const [categoryMap, setCategoryMap] = useState<Record<string, CategoryData>>({})

  useEffect(() => {
    // Ждем, пока прогрузится tenantId
    if (!tenantId) return

    // Передаем tenantId и niche в параметры запроса
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/categories?tenantId=${tenantId}&niche=${niche}`, {
      headers: { 
        Authorization: typeof window !== 'undefined' ? `Bearer ${localStorage.getItem('saas_token') || ''}` : '' 
      },
    })
      .then(res => res.json())
      .then((data: any) => {
        // Защита на случай, если бэк вернул объект с ошибкой, а не массив
        if (!Array.isArray(data)) {
          console.error('Failed to load categories, expected array but got:', data)
          return
        }

        const map: Record<string, CategoryData> = {}
        data.forEach((cat: CategoryApiItem) => {
          map[cat.key] = {
            name: cat.name || cat.key,
            translations: cat.translations || {},
            icon: cat.icon || '🍽️',
          }
        })
        setCategoryMap(map)
      })
      .catch(console.error)
  }, [tenantId, niche]) // Добавили переменные в зависимости

  const getCategoryName = (categoryKey: string, locale: string): string => {
    const cat = categoryMap[categoryKey]
    if (!cat) return categoryKey
    if (cat.translations?.[locale]) return cat.translations[locale]
    if (locale === primaryLanguage) return cat.name
    return cat.name || categoryKey
  }

  const getCategoryIcon = (categoryKey: string): string => {
    return categoryMap[categoryKey]?.icon || '🍽️'
  }

  const categories = useMemo(() => {
    const keys = Array.from(new Set(items.map(item => item.categoryKey || item.category).filter(Boolean)))
    return ['all', ...keys.sort()]
  }, [items])

  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return items
    return items.filter(item => (item.categoryKey || item.category) === activeCategory)
  }, [items, activeCategory])

  useEffect(() => {
    if (menuContainerRef.current) {
      const rect = menuContainerRef.current.getBoundingClientRect()
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const offset = 130
      const targetY = rect.top + scrollTop - offset
      if (window.scrollY > targetY) {
        window.scrollTo({ top: targetY, behavior: 'smooth' })
      }
    }
  }, [activeCategory])

  if (settingsLoading) {
    return <div className="flex justify-center py-10">Loading menu...</div>
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8" ref={menuContainerRef}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-56 flex-shrink-0">
        <nav className="space-y-1 sticky top-24">
          {categories.map(key => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2.5 ${
                activeCategory === key
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              <span className="text-base leading-none">
                {key === 'all' ? '🍽️' : getCategoryIcon(key)}
              </span>
              <span>{key === 'all' ? t('all') : getCategoryName(key, locale)}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile horizontal scroll */}
      <div className="lg:hidden overflow-x-auto -mx-4 px-4 py-3 sticky top-16 z-30 bg-surface-page/95 backdrop-blur-sm">
        <div className="flex items-center gap-2 w-max">
          {categories.map(key => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeCategory === key
                  ? 'bg-primary text-white'
                  : 'bg-surface-card text-text-secondary border border-border hover:bg-surface-hover'
              }`}
            >
              <span className="text-base leading-none">
                {key === 'all' ? '🍽️' : getCategoryIcon(key)}
              </span>
              <span>{key === 'all' ? t('all') : getCategoryName(key, locale)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Items grid/list */}
      <div className="flex-1">
        {filteredItems.length === 0 ? (
          <p className="text-center text-text-secondary py-10">{t('emptyCategory')}</p>
        ) : menuStyle === 'grid' ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredItems.map(item => (
              <MenuItemCard key={item._id} item={item} mode="public" layout="grid" locale={locale} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredItems.map(item => (
              <MenuItemCard key={item._id} item={item} mode="public" layout="list" locale={locale} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}