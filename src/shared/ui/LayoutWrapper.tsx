'use client'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import Navbar from '@/widgets/Navbar/Navbar'
import MobileBottomNav from '@/widgets/Navbar/MobileBottomNav'
import Footer from '@/widgets/Footer/Footer'
import { CartToastProvider } from '@/shared/ui/CartToast'
import { ToastProvider } from '@/shared/ui/Toast'
import { useTenant } from '@/entities/tenant/TenantContext'
import { fetchCategoriesForNav } from '@/entities/product-category/api'
import type { CategoryNavItem } from '@/entities/product-category/types'
import CategoryNavSidebar from '@/widgets/Catalog/CategoryNavSidebar'
import CategoryNavDrawer from '@/widgets/Catalog/CategoryNavDrawer'
import CartSheet from '@/widgets/CartSheet/CartSheet'
import { CategoryNavProvider } from '@/shared/ui/CategoryNavContext'

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const tenant = useTenant()
  const [categories, setCategories] = useState<CategoryNavItem[]>([])
  
  // Sidebar only on home page (/{locale}/{branchSlug}) and catalog pages (/{locale}/{branchSlug}/catalog/*)
  const segments = pathname.split('/').filter(Boolean)
  const isHomePage = segments.length === 2 // /{locale}/{branchSlug}
  const isCatalogPage = pathname.includes('/catalog')
  
  const showCatNav = mounted
    && tenant?.features?.showCategoryNav
    && tenant?.niche === 'ecommerce'
    && !pathname.startsWith('/admin')
    && !pathname.includes('/order/checkout')
    && (isHomePage || isCatalogPage)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  useEffect(() => {
    if (showCatNav && tenant?.tenantId) {
      fetchCategoriesForNav(tenant.tenantId, tenant.niche).then(setCategories)
    }
  }, [showCatNav, tenant?.tenantId, tenant?.niche])
  
  const isAdmin = pathname.startsWith('/admin')
  const isCheckout = pathname.includes('/order/checkout')
  const showBottomNav = mounted
    && tenant?.features?.bottomNav?.enabled
    && tenant?.niche === 'ecommerce'
    && !isAdmin
    && !isCheckout

  // Админка - свой контейнер с изоляцией тем (admin-light / admin-dark)
  if (isAdmin) {
    return (
      <div className="platform-ui">
        {children}
      </div>
    )
  }

  const mainClassName = showCatNav
    ? `flex-1 pt-16 space-y-8 min-w-0${showBottomNav ? ' pb-20 md:pb-0' : ''}`
    : `flex-1 pt-16 space-y-8${showBottomNav ? ' pb-20 md:pb-0' : ''}`

  // Чекаут - принудительно светлая тема (checkout)
  if (isCheckout) {
    return (
      <div className="checkout-page">
        <ToastProvider>
        <CartToastProvider>
          <CartSheet />
          <Navbar />
          <main className="flex-1 pt-16 space-y-8">
            {children}
          </main>
        </CartToastProvider>
        </ToastProvider>
      </div>
    )
  }

  // Публичная часть - единая DOM-структура, без swap при mount.
  // showCatNav requires mounted=true, so category nav only renders after hydration.
  return (
    <div className="public-page flex flex-col min-h-screen">
      <ToastProvider>
      <CartToastProvider>
        <CartSheet />
        <CategoryNavProvider>
          {showCatNav && <CategoryNavDrawer categories={categories} />}
          <Navbar />
          {showCatNav ? (
            <div className="flex flex-1 min-h-[calc(100vh-4rem)]">
              <CategoryNavSidebar categories={categories} />
              <main className={mainClassName}>
                {children}
              </main>
            </div>
          ) : (
            <main className={`flex-1 min-h-0 pt-16 space-y-8${showBottomNav ? ' pb-20 md:pb-0' : ''}`}>
              {children}
            </main>
          )}
          <div className="flex-shrink-0">
            <Footer />
          </div>
          {showBottomNav && <MobileBottomNav />}
        </CategoryNavProvider>
      </CartToastProvider>
      </ToastProvider>
    </div>
  )
}