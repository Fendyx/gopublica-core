'use client'
import Link from 'next/link'
import { useBranchSettings } from '@/entities/branch/useBranchSettings'
import { useLocale, useTranslations } from 'next-intl'
import { useTenant } from '@/entities/tenant/TenantContext'

export default function HeroVideo() {
  const { seoTitleI18n, seoDescriptionI18n, seoTitle, seoDescription, loading } = useBranchSettings()
  const locale = useLocale()
  const t = useTranslations('hero')
  const tenant = useTenant()

  const title = seoTitleI18n?.[locale] || seoTitle || tenant?.seo?.title || tenant?.clientName
  const description = seoDescriptionI18n?.[locale] || seoDescription || tenant?.seo?.description || ''

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {tenant?.heroVideoUrl ? (
  <video autoPlay muted loop playsInline poster={tenant?.heroPosterUrl} className="absolute inset-0 w-full h-full object-cover">
    <source src={tenant.heroVideoUrl} type="video/mp4" />
  </video>
) : (
  <div className="absolute inset-0 bg-gray-900" /> // или какой-то фолбэк
)}
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 text-center text-white px-4 max-w-4xl">
        <h1 className="text-4xl lg:text-6xl font-bold mb-6">{title}</h1>
        <p className="text-lg lg:text-xl mb-10 opacity-90">{description}</p>
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