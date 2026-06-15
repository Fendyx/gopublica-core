'use client'
import { useLocale } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { routing } from '@/i18n/routing'

export default function LanguageSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  const switchLocale = (newLocale: string) => {
    const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`)
    router.push(newPathname)
    router.refresh() // ← заставляет Next.js перерендерить ВСЁ дерево, включая RootLayout, под новый URL
  }

  return (
    <div className="flex items-center gap-1">
      {routing.locales.map((loc) => (
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