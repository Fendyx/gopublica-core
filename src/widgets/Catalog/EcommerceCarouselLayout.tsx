'use client'
import useEmblaCarousel from 'embla-carousel-react'
import AutoPlay from 'embla-carousel-autoplay'
import type { MenuItem, ProductCardVariant } from '@/entities/menu-item/types'
import ProductCard from './ProductCard'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function EcommerceCarouselLayout({
  items, locale, variant, currencySymbol, productImageAspectRatio, autoplay = false, productCardWidth = 'default'
}: {
  items: MenuItem[]
  locale?: string
  variant: ProductCardVariant
  currencySymbol?: string
  productImageAspectRatio?: string
  autoplay?: boolean
  productCardWidth?: string
}) {
  const plugins = autoplay ? [AutoPlay({ delay: 3500, stopOnInteraction: false, stopOnMouseEnter: true })] : []
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' }, plugins)

  const getSlideWidth = () => {
    const widths: Record<string, string> = {
      default: 'w-[280px] sm:w-[320px]',
      medium: 'w-[340px] sm:w-[380px]',
      large: 'w-[400px] sm:w-[440px]',
      xlarge: 'w-[480px] sm:w-[520px]',
      full: 'w-full'
    };
    return widths[productCardWidth] || widths.default;
  };

  const scrollPrev = () => emblaApi?.scrollPrev()
  const scrollNext = () => emblaApi?.scrollNext()

  return (
    <div className="relative">
      <div className="flex justify-end gap-2 mb-4">
        <button onClick={scrollPrev} className="p-2 rounded-full border border-border hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={scrollNext} className="p-2 rounded-full border border-border hover:bg-muted transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="overflow-hidden -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8" ref={emblaRef}>
        <div className="flex gap-6 pb-4">
          {items.map((item, index) => (
            <div key={`${item._id}-${index}`} className={`shrink-0 ${getSlideWidth()}`}>
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
    </div>
  )
}