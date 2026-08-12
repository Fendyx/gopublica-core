'use client'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import Navbar from '@/widgets/Navbar/Navbar'
import Footer from '@/widgets/Footer/Footer'
import { CartToastProvider } from '@/shared/ui/CartToast'

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const isAdmin = pathname.startsWith('/admin')
  const isCheckout = pathname.includes('/order/checkout')

  // До гидратации не рендерим контейнеры с data-theme, чтобы избежать mismatch
  if (!mounted) {
    return (
      <div className="flex min-h-screen flex-col public-page" suppressHydrationWarning>
        <CartToastProvider>
          <Navbar />
          <main className="flex-1 pt-16 space-y-8">
            {children}
          </main>
          <Footer />
        </CartToastProvider>
      </div>
    )
  }

  // Админка — свой контейнер с изоляцией тем (admin-light / admin-dark)
  if (isAdmin) {
    return (
      <div className="platform-ui">
        {children}
      </div>
    )
  }

  // Чекаут — принудительно светлая тема (checkout)
  if (isCheckout) {
    return (
      <div className="checkout-page">
        <CartToastProvider>
          <Navbar />
          <main className="flex-1 pt-16 space-y-8">
            {children}
          </main>
        </CartToastProvider>
      </div>
    )
  }

  // Публичная часть — реагирует на тему (light / dark)
  return (
    <div className="public-page">
      <CartToastProvider>
        <Navbar />
        <main className="flex-1 pt-16 space-y-8">
          {children}
        </main>
        <Footer />
      </CartToastProvider>
    </div>
  )
}