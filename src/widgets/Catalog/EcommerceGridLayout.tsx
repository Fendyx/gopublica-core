'use client'
import type { MenuItem } from '@/entities/menu-item/types'
import ProductCard from './ProductCard'

export default function EcommerceGridLayout({ items, locale, columns = 3, variant, currencySymbol }: { 
  items: MenuItem[], 
  locale?: string, 
  columns?: number,
  variant: 'overlay' | 'action-bar' | 'minimal',
  currencySymbol?: string
}) {
  return (
    <div className={`grid grid-cols-2 ${columns === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 lg:gap-6`}>
      {items.map(item => (
        <ProductCard 
          key={item._id} 
          product={item} 
          variant={variant} 
          locale={locale} 
          currencySymbol={currencySymbol}
        />
      ))}
    </div>
  )
}