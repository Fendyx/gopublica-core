import type { MenuItem } from '@/entities/menu-item/types'
import MenuLayout from './MenuLayout'

export default function Menu({ items, menuStyle = 'grid' }: { items: MenuItem[]; menuStyle?: 'grid' | 'list' }) {
  if (!items.length) return null

  return (
    <section id="menu" className="py-16 bg-surface-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MenuLayout items={items} menuStyle={menuStyle} />
      </div>
    </section>
  )
}