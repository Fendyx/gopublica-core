'use client'
import { usePathname } from 'next/navigation'
import Navbar from '@/widgets/Navbar/Navbar'
import Footer from '@/widgets/Footer/Footer'

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')
  const isCheckoutPage = pathname.includes('/order/checkout')

  if (isAdmin) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen flex-col public-page">
      <Navbar />
      <main className="flex-1 pt-16 space-y-8">
        {children}
      </main>
      {!isCheckoutPage && <Footer />}
    </div>
  )
}