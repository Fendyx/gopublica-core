'use client'
import { useLocale } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { useTenant } from '@/entities/tenant/TenantContext'

/**
 * Shows language switcher filtered by the tenant's activeLocales.
 * Only locales that are BOTH in routing (have message files) AND
 * in the tenant's activeLocales are displayed to customers.
 */
export default function LanguageSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const tenant = useTenant()

  // Intersect routing locales with tenant's active locales
  const activeLocales = tenant?.activeLocales || ['pl', 'en']
  const availableLocales = routing.locales.filter((loc) =>
    activeLocales.includes(loc)
  )

  // Don't render the switcher if there's only one option
  if (availableLocales.length <= 1) return null

  const switchLocale = (newLocale: string) => {
    const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`)
    router.push(newPathname)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1">
      {availableLocales.map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
            loc === locale
              ? 'bg-primary text-white'
              : 'text-text-secondary hover:bg-surface-hover'
          }`}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  )
}