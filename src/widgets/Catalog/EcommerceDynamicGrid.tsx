'use client'
import { useEffect, useRef } from 'react'
import type { MenuItem, ProductCardVariant } from '@/entities/menu-item/types'
import ProductCard from './ProductCard'

const ROW_UNIT = 8
const GAP = 16

export default function EcommerceDynamicGrid({ items, locale, variant, currencySymbol, productImageAspectRatio, productCardWidth = 'default' }: {
  items: MenuItem[],
  locale?: string,
  variant: ProductCardVariant,
  currencySymbol?: string,
  productImageAspectRatio?: string,
  productCardWidth?: string
}) {
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return

    const layoutItems = () => {
      const cells = Array.from(grid.children) as HTMLElement[]
      cells.forEach((cell) => {
        const content = cell.firstElementChild as HTMLElement | null
        if (!content) return
        const height = content.getBoundingClientRect().height
        const span = Math.ceil((height + GAP) / (ROW_UNIT + GAP))
        cell.style.gridRowEnd = `span ${span}`
      })
    }

    layoutItems()
    const observer = new ResizeObserver(layoutItems)
    Array.from(grid.children).forEach((cell) => {
      const content = cell.firstElementChild
      if (content) observer.observe(content)
    })

    return () => observer.disconnect()
  }, [items, locale])

  // Если full — каждая карточка на всю строку
  if (productCardWidth === 'full') {
    return (
      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div key={item._id}>
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
    );
  }

  return (
    <div
      ref={gridRef}
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 grid-flow-row-dense gap-4"
      style={{ gridAutoRows: `${ROW_UNIT}px` }}
    >
      {items.map((item, index) => {
        const isLarge = index % 5 === 0
        return (
          <div key={item._id} className={isLarge ? 'col-span-2' : 'col-span-1'}>
            <div>
              <ProductCard
                product={item}
                variant={variant}
                locale={locale}
                currencySymbol={currencySymbol}
                imageAspectRatio={productImageAspectRatio}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}