'use client'
import Link from 'next/link'
import { useBranchSettings } from '@/entities/branch/useBranchSettings'
import { useTenant } from '@/entities/tenant/TenantContext'
import { useLocale, useTranslations } from 'next-intl'

export default function HeroSplit() {
  const tenant = useTenant()
  const { seoTitleI18n, seoDescriptionI18n, seoTitle, seoDescription } = useBranchSettings()
  const locale = useLocale()
  const t = useTranslations('hero')

  const title = seoTitleI18n?.[locale] || seoTitle || tenant?.clientName
  const description = seoDescriptionI18n?.[locale] || seoDescription || ''

  const imageUrl = tenant?.theme?.heroSplitImage || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80'

  return (
    <section className="relative bg-zinc-50 py-20 lg:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <h1 className="text-4xl lg:text-5xl font-bold text-zinc-900 mb-6 leading-tight">
              {title}
            </h1>
            <p className="text-lg text-zinc-600 mb-8 leading-relaxed">
              {description}
            </p>

            <div className="flex flex-wrap gap-4">
              {tenant?.features?.hasBooking && (
                <Link
                  href={`/${locale}/reservations`}
                  className="inline-flex items-center px-6 py-3 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {t('booking')}
                </Link>
              )}
              {tenant?.features?.hasMenu && (
                <Link
                  href={`/${locale}/menu`}
                  className="inline-flex items-center px-6 py-3 rounded-lg font-medium border-2 transition-colors hover:bg-zinc-100"
                  style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                >
                  {t('menu')}
                </Link>
              )}
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={imageUrl}
                alt={tenant?.clientName ?? 'Restaurant'}
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}