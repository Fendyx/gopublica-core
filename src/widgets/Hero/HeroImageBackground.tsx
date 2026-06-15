'use client'
import { useTenantSettings } from '@/entities/tenant/useTenantSettings'
import { useTenant } from '@/entities/tenant/TenantContext'
import { useLocale, useTranslations } from 'next-intl'

export default function HeroImageBackground() {
  const tenant = useTenant()
  const { settings } = useTenantSettings(tenant?.tenantId ?? '')
  const locale = useLocale()
  const t = useTranslations('hero')

  return (
    <section
      className="relative h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${tenant?.heroBgImage})` }}
    >
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 text-center text-white px-4 max-w-4xl">
        <h1 className="text-4xl lg:text-6xl font-bold mb-6">
          {settings?.seoTitle}
        </h1>
        <p className="text-lg lg:text-xl mb-10 opacity-90">
          {settings?.seoDescription}
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          {tenant?.features?.hasBooking && (
            <a href="#booking" className="px-8 py-4 rounded-lg text-white font-medium text-lg transition-opacity hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)' }}>
              {t('booking')}
            </a>
          )}
          {tenant?.features?.hasMenu && (
            <a href="#menu" className="px-8 py-4 rounded-lg font-medium text-lg border-2 transition-colors hover:bg-white/10" style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}>
              {t('menu')}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}