'use client'
import { usePathname } from 'next/navigation'
import Navbar from '@/widgets/Navbar/Navbar'
import Footer from '@/widgets/Footer/Footer'
import { CartToastProvider } from '@/shared/ui/CartToast';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')
  const isCheckoutPage = pathname.includes('/order/checkout')

  if (isAdmin) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen flex-col public-page">
      <CartToastProvider>
        <Navbar />
        <main className="flex-1 pt-16 space-y-8">
          {children}
        </main>
        {!isCheckoutPage && <Footer />}
      </CartToastProvider>
    </div>
  )
}