'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useBranchSettings } from '@/entities/branch/useBranchSettings'
import { useTenant } from '@/entities/tenant/TenantContext'
import { useLocale, useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

const INTERVAL = 5000

const slideVariants = {
  enter: { opacity: 0, scale: 1.05 },
  center: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.0 },
}

// 👈 Компактный Hero: ~30% высоты экрана, закруглён со всех сторон,
// с равномерными отступами по краям (левый/правый/верхний),
// как будто "плавающая карточка"
export default function HeroCompact() {
  const tenant = useTenant()
  const { seoTitleI18n, seoDescriptionI18n, seoTitle, seoDescription } = useBranchSettings()
  const locale = useLocale()
  const { branchSlug } = useParams()
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
      setCurrent((prev) => (prev + 1) % images.length)
    }, INTERVAL)
    return () => clearInterval(timer)
  }, [images.length])

  return (
    // 👈 Внешний контейнер задаёт равномерные отступы по бокам и сверху
    <div className="w-full px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
      <section
        className="relative w-full h-[40vh] min-h-[220px] max-h-[420px] flex items-center justify-center overflow-hidden rounded-2xl md:rounded-3xl shadow-xl"
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={current}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${images[current]})` }}
          />
        </AnimatePresence>

        {/* Затемнение поверх изображения */}
        <div className="absolute inset-0 bg-black/45 z-0" />

        <div className="relative z-10 text-center text-white px-4 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 drop-shadow-lg leading-tight">
            {title}
          </h1>
          {description && (
            <p className="hidden sm:block text-sm lg:text-base mb-4 opacity-90 drop-shadow-md line-clamp-2">
              {description}
            </p>
          )}

          {tenant?.features?.hasBooking && (
            <Link
              href={`/${locale}/${branchSlug}/reservations`}
              className="inline-block px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg text-white font-medium text-sm sm:text-base transition-transform hover:scale-105 active:scale-95 shadow-lg"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {t('booking')}
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}