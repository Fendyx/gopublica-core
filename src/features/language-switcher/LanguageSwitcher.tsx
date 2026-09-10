'use client'
import { useState, useRef, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { routing } from '@/i18n/routing'
import { useTenant } from '@/entities/tenant/TenantContext'
import { getLabelForLocale } from '@/shared/lib/locales'

/**
 * Dropdown language switcher filtered by the tenant's activeLocales.
 * Only locales that are BOTH in routing (have message files) AND
 * in the tenant's activeLocales are displayed to customers.
 * Shows real language names (e.g. Polski, English) without flags.
 */
export default function LanguageSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const tenant = useTenant()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Intersect routing locales with tenant's active locales
  const activeLocales = tenant?.activeLocales || ['pl', 'en']
  const availableLocales = routing.locales.filter((loc) =>
    activeLocales.includes(loc)
  )

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Don't render the switcher if there's only one option
  if (availableLocales.length <= 1) return null

  const switchLocale = (newLocale: string) => {
    setOpen(false)
    if (newLocale === locale) return
    const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`)
    router.push(newPathname)
    router.refresh()
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          open
            ? 'bg-surface-hover text-text-primary'
            : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
        }`}
      >
        {getLabelForLocale(locale)}
        <ChevronDown
          size={14}
          className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 min-w-[160px] bg-popover shadow-dropdown rounded-xl border border-border overflow-hidden z-50 py-1">
          {availableLocales.map((loc) => (
            <button
              key={loc}
              onClick={() => switchLocale(loc)}
              className={`flex items-center justify-between w-full text-left px-4 py-2 text-sm transition-colors ${
                loc === locale
                  ? 'text-primary font-medium bg-surface-hover/50'
                  : 'text-text-primary hover:bg-surface-hover'
              }`}
            >
              {getLabelForLocale(loc)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}