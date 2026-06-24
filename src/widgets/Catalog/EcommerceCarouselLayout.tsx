'use client'
import { useEffect, useRef } from 'react'
import type { MenuItem, ProductCardVariant } from '@/entities/menu-item/types'
import ProductCard from './ProductCard'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const AUTO_ADVANCE_INTERVAL = 3500
const RESUME_DELAY = 3000
const SCROLL_ANIMATION_DURATION = 600

export default function EcommerceCarouselLayout({ items, locale, variant, currencySymbol, productImageAspectRatio }: { 
  items: MenuItem[], 
  locale?: string,
  variant: ProductCardVariant,
  currencySymbol?: string,
  productImageAspectRatio?: string,
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isPausedRef = useRef(false)
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isAutoScrollingRef = useRef(false)
  const autoScrollEndRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // дублированный список для бесконечного эффекта
  const loopItems = [...items, ...items]

  const pauseForAWhile = () => {
    isPausedRef.current = true
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current)
    resumeTimeoutRef.current = setTimeout(() => {
      isPausedRef.current = false
    }, RESUME_DELAY)
  }

  const advanceOneItem = () => {
    const el = scrollRef.current
    if (!el) return
    const children = Array.from(el.children) as HTMLElement[]
    if (children.length === 0) return

    const containerLeft = el.getBoundingClientRect().left

    // ближайшая к левому краю карточка = "текущая"
    let currentIndex = 0
    let minDist = Infinity
    children.forEach((child, i) => {
      const dist = Math.abs(child.getBoundingClientRect().left - containerLeft)
      if (dist < minDist) { minDist = dist; currentIndex = i }
    })

    const nextIndex = currentIndex + 1

    isAutoScrollingRef.current = true
    if (autoScrollEndRef.current) clearTimeout(autoScrollEndRef.current)

    if (nextIndex >= children.length) {
      // конец второй копии — просто прыгаем к первой без анимации
      el.scrollTo({ left: 0, behavior: 'auto' })
      isAutoScrollingRef.current = false
    } else {
      const target = el.scrollLeft + (children[nextIndex].getBoundingClientRect().left - containerLeft)
      el.scrollTo({ left: target, behavior: 'smooth' })

      autoScrollEndRef.current = setTimeout(() => {
        // если въехали во вторую копию — тихо телепортируемся к тому же индексу в первой
        // items.length карточек в первой копии, поэтому индекс в первой = nextIndex - items.length
        if (nextIndex >= items.length) {
          const mirrorIndex = nextIndex - items.length
          const mirrorChild = children[mirrorIndex]
          if (mirrorChild) {
            const mirrorTarget = el.scrollLeft + (mirrorChild.getBoundingClientRect().left - containerLeft)
            el.scrollTo({ left: mirrorTarget, behavior: 'auto' })
          }
        }
        isAutoScrollingRef.current = false
      }, SCROLL_ANIMATION_DURATION)
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPausedRef.current) advanceOneItem()
    }, AUTO_ADVANCE_INTERVAL)
    return () => clearInterval(interval)
  }, [items])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handleScroll = () => {
      if (isAutoScrollingRef.current) return
      pauseForAWhile()
    }
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [])

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    pauseForAWhile()
    const amount = scrollRef.current.clientWidth * 0.8
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      <div className="flex justify-end gap-2 mb-4">
        <button onClick={() => scroll('left')} className="p-2 rounded-full border border-border hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={() => scroll('right')} className="p-2 rounded-full border border-border hover:bg-muted transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div 
        ref={scrollRef} 
        onMouseEnter={() => { isPausedRef.current = true }}
        onMouseLeave={pauseForAWhile}
        onPointerDown={pauseForAWhile}
        className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {loopItems.map((item, index) => (
          <div key={`${item._id}-${index}`} className="snap-start shrink-0 w-[280px] sm:w-[320px]">
            <ProductCard 
              product={item} 
              variant={variant} 
              locale={locale} 
              currencySymbol={currencySymbol}
              imageAspectRatio={productImageAspectRatio}
            />
          </div>
        ))}
      </div>
    </div>
  )
}