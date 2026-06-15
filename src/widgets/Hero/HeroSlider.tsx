'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTenantSettings } from '@/entities/tenant/useTenantSettings'
import { useTenant } from '@/entities/tenant/TenantContext'
import { useLocale, useTranslations } from 'next-intl'

const INTERVAL = 4000

export default function HeroSlider() {
  const tenant = useTenant()
  const { settings } = useTenantSettings(tenant?.tenantId ?? '')
  const locale = useLocale()
  const t = useTranslations('hero')
  const images = tenant?.heroSliderImages || []
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (images.length === 0) return
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % images.length)
    }, INTERVAL)
    return () => clearInterval(timer)
  }, [images.length])

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {images.map((img, index) => (
        <div
          key={index}
          className="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${img})`,
            opacity: index === current ? 1 : 0,
          }}
        />
      ))}

      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 text-center text-white px-4 max-w-4xl">
        <h1 className="text-4xl lg:text-6xl font-bold mb-6">
          {settings?.seoTitle}
        </h1>
        <p className="text-lg lg:text-xl mb-10 opacity-90">
          {settings?.seoDescription}
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          {tenant?.features?.hasBooking && (
            <Link
              href={`/${locale}/reservations`}
              className="px-8 py-4 rounded-lg text-white font-medium text-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {t('booking')}
            </Link>
          )}
          {tenant?.features?.hasMenu && (
            <Link
              href={`/${locale}/menu`}
              className="px-8 py-4 rounded-lg font-medium text-lg border-2 transition-colors hover:bg-white/10"
              style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
            >
              {t('menu')}
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}