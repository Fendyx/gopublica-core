'use client'
import Link from 'next/link'
import { useBranchSettings } from '@/entities/branch/useBranchSettings'
import { useTenant } from '@/entities/tenant/TenantContext'
import { useLocale, useTranslations } from 'next-intl'
import { Truck, ShoppingBag } from 'lucide-react'

export default function HeroCentered() {
  const tenant = useTenant()
  const { seoTitleI18n, seoDescriptionI18n, seoTitle, seoDescription } = useBranchSettings()
  const locale = useLocale()
  const t = useTranslations('hero')

  const title = seoTitleI18n?.[locale] || seoTitle || tenant?.clientName
  const description = seoDescriptionI18n?.[locale] || seoDescription || ''

  return (
    <section className="relative bg-zinc-900 text-white py-24 lg:py-36">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/80 to-zinc-900" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
          {title}
        </h1>
        <p className="text-lg lg:text-xl text-zinc-300 mb-10 max-w-2xl mx-auto">
          {description}
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          {tenant?.features?.hasBooking && (
            <Link
              href={`/${locale}/reservations`}
              className="inline-flex items-center px-8 py-4 rounded-lg text-white font-medium text-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {t('booking')}
            </Link>
          )}
          {tenant?.features?.hasMenu && (
            <Link
              href={`/${locale}/menu`}
              className="inline-flex items-center px-8 py-4 rounded-lg font-medium text-lg border-2 transition-colors hover:bg-white/10"
              style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
            >
              {t('menu')}
            </Link>
          )}
        </div>

        <div className="mt-12 flex justify-center gap-8 text-sm text-zinc-400">
          {tenant?.features?.hasDelivery && (
            <span className="flex items-center gap-1"><Truck size={14} /> Delivery</span>
          )}
          {tenant?.features?.hasClickCollect && (
            <span className="flex items-center gap-1"><ShoppingBag size={14} /> Pickup</span>
          )}
          <span>⭐ 4.9 Rating</span>
        </div>
      </div>
    </section>
  )
}