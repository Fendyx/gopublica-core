'use client'
import { useTenantSettings } from '@/entities/tenant/useTenantSettings'
import { useTenant } from '@/entities/tenant/TenantContext'
import { useLocale, useTranslations } from 'next-intl'

export default function HeroSplit() {
  const tenant = useTenant()
  const { settings } = useTenantSettings(tenant?.tenantId ?? '')
  const locale = useLocale()
  const t = useTranslations('hero')

  return (
    <section className="relative bg-zinc-50 py-20 lg:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <h1 className="text-4xl lg:text-5xl font-bold text-zinc-900 mb-6 leading-tight">
              {settings?.seoTitle}
            </h1>
            <p className="text-lg text-zinc-600 mb-8 leading-relaxed">
              {settings?.seoDescription}
            </p>

            <div className="flex flex-wrap gap-4">
              {tenant?.features?.hasBooking && (
                <a
                  href="/reservations"
                  className="inline-flex items-center px-6 py-3 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {t('booking')}
                </a>
              )}
              {tenant?.features?.hasMenu && (
                <a
                  href="/menu"
                  className="inline-flex items-center px-6 py-3 rounded-lg font-medium border-2 transition-colors hover:bg-zinc-50"
                  style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                >
                  {t('menu')}
                </a>
              )}
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80"
                alt={tenant?.clientName ?? ''}
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}