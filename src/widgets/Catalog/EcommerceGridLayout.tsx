'use client'
import type { MenuItem, ProductCardVariant } from '@/entities/menu-item/types'
import ProductCard from './ProductCard'

export default function EcommerceGridLayout({ items, locale, columns = 3, variant, currencySymbol, productImageAspectRatio, productCardWidth = 'default' }: {
  items: MenuItem[],
  locale?: string,
  columns?: number,
  variant: ProductCardVariant,
  currencySymbol?: string,
  productImageAspectRatio?: string,
  productCardWidth?: string
}) {
  // Для full — одна колонка, иначе стандартная сетка
  const gridCols = productCardWidth === 'full' ? 'grid-cols-1' : `grid-cols-2 ${columns === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`;

  return (
    <div className={`grid ${gridCols} gap-4 lg:gap-6`}>
      {items.map(item => (
        <ProductCard
          key={item._id}
          product={item}
          variant={variant}
          locale={locale}
          currencySymbol={currencySymbol}
          imageAspectRatio={productImageAspectRatio}
        />
      ))}
    </div>
  )
}