'use client'
import Link from 'next/link'
import { useBranchSettings } from '@/entities/branch/useBranchSettings'
import { useTenant } from '@/entities/tenant/TenantContext'
import { useLocale, useTranslations } from 'next-intl'

export default function HeroImageBackground() {
  const tenant = useTenant()
  const { seoTitleI18n, seoDescriptionI18n, seoTitle, seoDescription } = useBranchSettings()
  const locale = useLocale()
  const t = useTranslations('hero')

  const title = seoTitleI18n?.[locale] || seoTitle || tenant?.clientName
  const description = seoDescriptionI18n?.[locale] || seoDescription || ''
  
  const bgImage = tenant?.theme?.heroBgImage || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1920&q=80'

  return (
    <section
      className="relative h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 text-center text-white px-4 max-w-4xl">
        <h1 className="text-4xl lg:text-6xl font-bold mb-6">
          {title}
        </h1>
        <p className="text-lg lg:text-xl mb-10 opacity-90">
          {description}
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          {tenant?.features?.hasBooking && (
            <Link href={`/${locale}/reservations`} className="px-8 py-4 rounded-lg text-white font-medium text-lg transition-opacity hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)' }}>
              {t('booking')}
            </Link>
          )}
          {tenant?.features?.hasMenu && (
            <Link href={`/${locale}/menu`} className="px-8 py-4 rounded-lg font-medium text-lg border-2 transition-colors hover:bg-white/10" style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}>
              {t('menu')}
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}