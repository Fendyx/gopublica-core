'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useBranchSettings } from '@/entities/branch/useBranchSettings'
import { useTenant } from '@/entities/tenant/TenantContext'
import { useLocale, useTranslations } from 'next-intl'

const INTERVAL = 4000

export default function HeroSlider() {
  const tenant = useTenant()
  const { seoTitleI18n, seoDescriptionI18n, seoTitle, seoDescription } = useBranchSettings()
  const locale = useLocale()
  const t = useTranslations('hero')
  
  const images = tenant?.theme?.heroSliderImages?.length 
    ? tenant.theme.heroSliderImages 
    : ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1920&q=80']
    
  const [current, setCurrent] = useState(0)

  const title = seoTitleI18n?.[locale] || seoTitle || tenant?.clientName
  const description = seoDescriptionI18n?.[locale] || seoDescription || ''

  useEffect(() => {
    if (images.length <= 1) return
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
          {title}
        </h1>
        <p className="text-lg lg:text-xl mb-10 opacity-90">
          {description}
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