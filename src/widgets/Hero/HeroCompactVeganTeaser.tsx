'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useBranchSettings } from '@/entities/branch/useBranchSettings'
import { useTenant } from '@/entities/tenant/TenantContext'
import { useLocale, useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'

const INTERVAL = 5000
const SLIDE_INTERVAL = 2000 

const slideVariants = {
  enter: { opacity: 0, scale: 1.05 },
  center: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.0 },
}

export default function HeroCompactVeganTeaser() {
  const tenant = useTenant()
  const { seoTitleI18n, seoDescriptionI18n, seoTitle, seoDescription, features } = useBranchSettings()
  const locale = useLocale()
  const t = useTranslations('hero')

  // 👇 1. Флаг для ГЛАВНОГО филиала (показывает карусель с анонсом 2-м слайдом)
  const hasVeganTeaser = Boolean(features?.hasVeganTeaser)
  
  // 👇 2. Флаг для ВЕГАНСКОГО филиала (показывает ТОЛЬКО заглушку "Скоро открытие")
  // Не забудь добавить/включить этот флаг в настройках филлиала в админке!
  // Используем утверждение типа (type casting), чтобы TS не ругался
// Замени 'Cat&Alice Vegan' на реальное название филиала из настроек
const isVeganBranch = seoTitle === 'Cat&Alice Vegan' || seoTitleI18n?.['pl'] === 'Cat&Alice Vegan';

  const videoUrl = tenant?.theme?.heroVideoUrl || ''
  const images = tenant?.theme?.heroSliderImages?.length
    ? tenant.theme.heroSliderImages
    : ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1920&q=80']

  const veganImageUrl = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1920&q=80'

  const [current, setCurrent] = useState(0)
  const [slide, setSlide] = useState(0)

  const title = seoTitleI18n?.[locale] || seoTitle || tenant?.clientName
  const description = seoDescriptionI18n?.[locale] || seoDescription || ''

  // Таймеры останавливаем, если мы на веганском филиале (там слайдера нет)
  useEffect(() => {
    if (isVeganBranch || videoUrl || images.length <= 1) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length)
    }, INTERVAL)
    return () => clearInterval(timer)
  }, [images.length, videoUrl, isVeganBranch])

  useEffect(() => {
    if (isVeganBranch || !hasVeganTeaser) return
    const timer = setInterval(() => {
      setSlide((prev) => (prev + 1) % 2)
    }, SLIDE_INTERVAL)
    return () => clearInterval(timer)
  }, [hasVeganTeaser, isVeganBranch])

  useEffect(() => {
    if (!hasVeganTeaser && slide !== 0) setSlide(0)
  }, [hasVeganTeaser, slide])

  const goTo = (index: number) => setSlide(index)

  const handleDragEnd = (_: any, info: { offset: { x: number } }) => {
    if (!hasVeganTeaser || isVeganBranch) return
    if (info.offset.x < -40) setSlide(1)
    else if (info.offset.x > 40) setSlide(0)
  }

  const slideWidth = hasVeganTeaser ? '90%' : '100%'
  const xOffset = slide === 0 ? '0px' : `calc(-80% - 16px)`

  // ==========================================
  // 🧩 ФУНКЦИИ РЕНДЕРА БЛОКОВ (чтобы не дублировать код)
  // ==========================================
  
  const renderMainBlock = (width: string) => (
    <div className="relative h-full shrink-0 rounded-2xl md:rounded-3xl overflow-hidden shadow-xl" style={{ width }}>
      {videoUrl ? (
        <video
          key={videoUrl}
          className="absolute inset-0 w-full h-full object-cover"
          src={videoUrl}
          autoPlay muted loop playsInline
          poster={tenant?.theme?.heroPosterUrl || undefined}
        />
      ) : (
        <AnimatePresence initial={false}>
          <motion.div
            key={current}
            variants={slideVariants}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${images[current]})` }}
          />
        </AnimatePresence>
      )}
      <div className="absolute inset-0 bg-black/45 z-0" />
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center text-white px-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 drop-shadow-lg leading-tight max-w-2xl">
          {title}
        </h1>
        {description && (
          <p className="hidden sm:block text-sm lg:text-base mb-4 opacity-90 drop-shadow-md line-clamp-2 max-w-2xl">
            {description}
          </p>
        )}
        {tenant?.features?.hasBooking && (
          <Link
            href={`/${locale}/reservations`}
            className="inline-block px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg text-white font-medium text-sm sm:text-base transition-transform hover:scale-105 active:scale-95 shadow-lg"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {t('booking')}
          </Link>
        )}
      </div>
    </div>
  )

  const renderVeganBlock = (width: string) => (
    <div className="relative h-full shrink-0 rounded-2xl md:rounded-3xl overflow-hidden shadow-xl bg-neutral-900" style={{ width }}>
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${veganImageUrl})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60 z-0" />

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center text-white px-4 select-none">
        <span className="inline-block mb-3 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold tracking-wide uppercase bg-emerald-500/20 border border-emerald-400/50 backdrop-blur-md text-emerald-100">
          Wkrótce otwarcie
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 text-white leading-tight drop-shadow-md">
          Kawiarnia wegańska
        </h2>
        <p className="text-sm lg:text-base text-neutral-200 mb-5 max-w-md drop-shadow-sm">
          Nowe miejsce w podziemiach — już wkrótce zapraszamy na roślinne dania i świetną kawę.
        </p>
        <span
          aria-disabled="true"
          className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg font-medium text-sm sm:text-base bg-white/10 text-white/70 border border-white/20 cursor-not-allowed backdrop-blur-sm"
        >
          Już niedługo
        </span>
      </div>
    </div>
  )

  // ==========================================
  // 🚀 ГЛАВНЫЙ РЕНДЕР КОМПОНЕНТА
  // ==========================================
  return (
    <div className="w-full px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
      <section className="relative w-full h-[40vh] min-h-[220px] max-h-[420px] overflow-hidden rounded-2xl md:rounded-3xl">
        
        {/* ЛОГИКА ОТОБРАЖЕНИЯ: */}
        {isVeganBranch ? (
          // 🌿 1. Если мы на странице веган-филиала -> показываем ТОЛЬКО веганский блок на 100% ширины (без свайпера)
          renderVeganBlock('100%')
        ) : (
          // ☕ 2. Если мы на странице других филиалов -> показываем карусель
          <>
            <motion.div
              className="flex w-full h-full cursor-grab active:cursor-grabbing"
              style={{ gap: '16px' }}
              animate={{ x: xOffset }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }} 
              drag={hasVeganTeaser ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }} 
              dragElastic={0.15}
              onDragEnd={handleDragEnd}
            >
              {renderMainBlock(slideWidth)}
              {hasVeganTeaser && renderVeganBlock(slideWidth)}
            </motion.div>

            {/* Точки-индикаторы карусели */}
            {hasVeganTeaser && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {[0, 1].map((i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Slide ${i + 1}`}
                    onClick={() => goTo(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      slide === i ? 'w-6 bg-white shadow-sm' : 'w-1.5 bg-white/50 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}