'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useBranchSettings } from '@/entities/branch/useBranchSettings'
import { useTenant } from '@/entities/tenant/TenantContext'
import { useLocale, useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion' // 👈 Импортируем Framer Motion

const INTERVAL = 5000 // Чуть увеличил интервал, чтобы свайпы не сильно мельтешили

// 👈 Настройки анимации: картинка выезжает справа (100%) и уезжает влево (-100%)
const slideVariants = {
  enter: { x: '100%' },
  center: { x: 0 },
  exit: { x: '-100%' }
}

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
    // 👈 1. Поменяли высоту (h-[85vh] min-h-[500px]) 
    // 👈 2. Закруглили нижние углы (rounded-b-[2.5rem] lg:rounded-b-[4rem])
    <section className="relative h-[85vh] min-h-[500px] flex items-center justify-center overflow-hidden rounded-b-[2.5rem] lg:rounded-b-[2rem] shadow-2xl">
      
      {/* 👈 3. AnimatePresence гарантирует, что старая картинка дождется выезда перед удалением */}
      <AnimatePresence initial={false}>
        <motion.div
          key={current}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }} // Плавная, "дорогая" кривая скорости
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: `url(${images[current]})`,
          }}
        />
      </AnimatePresence>

      {/* Затемняющий слой поверх слайдера (чтобы текст читался) */}
      <div className="absolute inset-0 bg-black/50 z-0" />

      <div className="relative z-10 text-center text-white px-4 max-w-4xl">
        <h1 className="text-4xl lg:text-6xl font-bold mb-6 drop-shadow-lg">
          {title}
        </h1>
        <p className="text-lg lg:text-xl mb-10 opacity-90 drop-shadow-md">
          {description}
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          {tenant?.features?.hasBooking && (
            <Link
              href={`/${locale}/reservations`}
              className="px-8 py-4 rounded-lg text-white font-medium text-lg transition-transform hover:scale-105 active:scale-95 shadow-lg"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {t('booking')}
            </Link>
          )}
          {/* {tenant?.features?.hasMenu && (
            <Link
              href={`/${locale}/menu`}
              className="px-8 py-4 rounded-lg font-medium text-lg border-2 transition-all hover:bg-white/10 hover:scale-105 active:scale-95 shadow-lg backdrop-blur-sm"
              style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
            >
              {t('menu')}
            </Link>
          )} */}
        </div>
      </div>
    </section>
  )
}