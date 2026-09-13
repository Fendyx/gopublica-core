'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { memo, useState, useEffect } from 'react'
import { Home, LayoutGrid, Search, User, LogIn, ExternalLink } from 'lucide-react'
import { Icon } from '@iconify/react'
import { isEmojiIcon } from '@/shared/ui/IconPickerButton'
import { useSearchStore } from '@/shared/store/searchStore'
import { useTenant } from '@/entities/tenant/TenantContext'
import type { BottomNavItem, BottomNavItemType } from '@/entities/tenant/types'

/** Resolve icon value (Iconify ID, lucide name, or emoji) and render. */
function NavIcon({ iconValue, type }: { iconValue?: string; type: BottomNavItemType }) {
  // Built-in types have their own icons — only use iconValue for custom/external
  if (type === 'home') return <Home size={22} />
  if (type === 'catalog') return <LayoutGrid size={22} />
  if (type === 'search') return <Search size={22} />
  if (type === 'profile') return <User size={22} />

  // Custom / external — resolve icon
  if (!iconValue) return <ExternalLink size={22} />
  if (iconValue.includes(':')) {
    return <Icon icon={iconValue} className="w-[22px] h-[22px]" />
  }
  if (!isEmojiIcon(iconValue)) {
    return <Icon icon={`lucide:${iconValue.toLowerCase()}`} className="w-[22px] h-[22px]" />
  }
  return <span className="text-lg leading-none">{iconValue}</span>
}

const BottomNavItemButton = memo(function BottomNavItemButton({
  active,
  href,
  iconValue,
  type,
  label,
  isExternal,
  onClick,
}: {
  active: boolean
  href: string
  iconValue?: string
  type: BottomNavItemType
  label: string
  isExternal?: boolean
  onClick?: () => void
}) {
  const content = (
    <div
      className={`flex flex-col items-center justify-center gap-0.5 w-full py-1 active:scale-90 transition-transform duration-100 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors duration-200 ${
          active
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground'
        }`}
      >
        <NavIcon iconValue={iconValue} type={type} />
      </div>
      <span
        className={`text-[10px] font-medium leading-none transition-colors duration-200 ${
          active ? 'text-primary' : 'text-muted-foreground'
        }`}
      >
        {label}
      </span>
    </div>
  )

  if (onClick) {
    return <div onClick={onClick}>{content}</div>
  }

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="w-full">
        {content}
      </a>
    )
  }

  return (
    <Link href={href} className="w-full">
      {content}
    </Link>
  )
})

export default function MobileBottomNav() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const { branchSlug } = useParams()
  const tenant = useTenant()
  const { openSearch } = useSearchStore()

  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('customer_token')
    setIsLoggedIn(!!token)
  }, [])

  const bottomNav = tenant?.features?.bottomNav
  if (!bottomNav?.enabled || !bottomNav.items?.length) return null

  // Sort by order and filter visible
  const visibleItems = [...bottomNav.items]
    .filter((item) => item.isVisible)
    .sort((a, b) => a.order - b.order)

  // Limit to 5 items max (mobile UX best practice)
  const items = visibleItems.slice(0, 5)

  const isActive = (href: string) => {
    // Exact match for home
    if (href === `/${locale}/${branchSlug}` || href === '/') {
      return pathname === '/' || pathname === `/${locale}` || pathname === `/${locale}/${branchSlug}` || pathname === `/${locale}/${branchSlug}/`
    }
    return pathname.startsWith(href)
  }

  const resolveHref = (item: BottomNavItem): string => {
    switch (item.type) {
      case 'home':
        return `/${locale}/${branchSlug}`
      case 'catalog':
        return `/${locale}/${branchSlug}/catalog`
      case 'profile':
        return isLoggedIn ? `/${locale}/profile` : `/${locale}/login`
      case 'custom':
        return `/${locale}/${branchSlug}/${item.slug || ''}`
      case 'external':
        return item.href || '#'
      case 'search':
        return '#'
      default:
        return '/'
    }
  }

  const resolveLabel = (item: BottomNavItem): string => {
    if (item.label) return item.label
    switch (item.type) {
      case 'home': return t('home')
      case 'catalog': return t('catalog')
      case 'search': return t('search')
      case 'profile': return isLoggedIn ? t('profile') : t('login')
      default: return ''
    }
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-background/95 backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const href = resolveHref(item)
          const label = resolveLabel(item)

          // Search item triggers the shared search store
          if (item.type === 'search') {
            return (
              <BottomNavItemButton
                key={item.id}
                active={false}
                href="#"
                iconValue={item.icon}
                type={item.type}
                label={label}
                onClick={openSearch}
              />
            )
          }

          return (
            <BottomNavItemButton
              key={item.id}
              active={isActive(href)}
              href={href}
              iconValue={item.icon}
              type={item.type}
              label={label}
              isExternal={item.type === 'external'}
            />
          )
        })}
      </div>
    </nav>
  )
}
