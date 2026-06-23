'use client'

import { useEffect, useRef } from 'react'
import type { MenuItem } from '@/entities/menu-item/types'
import ProductCard from './ProductCard' // <--- ИСПОЛЬЗУЕМ НОВЫЙ

const ROW_UNIT = 8
const GAP = 16

export default function EcommerceDynamicGrid({ items, locale, variant, currencySymbol }: { 
  items: MenuItem[], 
  locale?: string,
  variant: 'overlay' | 'action-bar' | 'minimal',
  currencySymbol?: string
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
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}