'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Link as IntlLink } from '@/i18n/routing'
import { useLocale, useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { useTenant } from '@/entities/tenant/TenantContext'
import LanguageSwitcher from '@/features/language-switcher/LanguageSwitcher'
import ThemeToggle from '@/shared/ui/ThemeToggle'
import { Menu, X, CalendarDays, ChevronDown, MapPin, ShoppingCart, User, LogIn, BookOpen } from 'lucide-react'
import { useCategoryNav } from '@/shared/ui/CategoryNavContext'
import { useBranch } from '@/entities/branch/BranchContext'
import { useBranchSelectionUI } from '@/widgets/BranchSelection/BranchSelectionProvider'
import { useCartStore } from '@/shared/store/cartStore'
import { getNavLinks } from '@/shared/lib/navigation'
import NavMoreDropdown from '@/widgets/Navbar/NavMoreDropdown'

export default function Navbar() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const { branchSlug } = useParams()
  const router = useRouter()
  const tenant = useTenant()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const burgerRef = useRef<HTMLButtonElement>(null)

  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const {
    selectedCity,
    selectedBranch,
    branches,
    loading: branchLoading,
  } = useBranch()

  const { setMobileDrawerOpen } = useCategoryNav()
  const { openBranchSelection } = useBranchSelectionUI()

  const cartItemsCount = useCartStore((s) => s.items.reduce((acc, item) => acc + item.quantity, 0))
  const openCart = useCartStore((s) => s.openCart)
  const hasOnlineOrdering = tenant?.features?.hasOnlineOrdering ?? false

  useEffect(() => {
    const token = localStorage.getItem('customer_token')
    setIsLoggedIn(!!token)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        burgerRef.current &&
        !burgerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    window.history.pushState({ menuOpen: true }, '')
    const handlePopState = () => setIsOpen(false)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isOpen])

  const { primary: primaryLinks, dropdown: dropdownLinks } = getNavLinks({
    navigation: tenant?.navigation,
    tenant,
    customPages: selectedBranch?.customPages,
    locale,
    branchSlug: branchSlug as string,
    t: (key: string) => t(key as any),
  })

  // All links combined for mobile burger menu (primary + dropdown)
  const allLinks = [...primaryLinks, ...dropdownLinks]

  const hasBooking = tenant?.features?.hasBooking ?? false
  const dropdownLabel = tenant?.navigation?.dropdownLabel || t('more')

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background backdrop-blur-md border-b border-border-light transition-colors">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <IntlLink href={branchSlug ? `/${branchSlug}` : '/'} className="flex items-center gap-2 font-heading text-xl font-semibold text-text-primary hover:text-primary transition-colors shrink-0">
            {tenant?.logoUrl && (
              <img
                src={tenant.logoUrl}
                alt={tenant.businessName || tenant.clientName || ''}
                className="h-8 w-auto max-w-[160px] object-contain"
              />
            )}
            <span>{(tenant?.businessName || tenant?.clientName) || ''}</span>
          </IntlLink>

          <div className="hidden lg:flex items-center gap-4 xl:gap-8 flex-1 justify-center">
            <nav className="flex items-center gap-4 xl:gap-6 items-center">
              {primaryLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-sm font-medium text-text-secondary hover:text-primary transition-colors whitespace-nowrap">
                  {link.label}
                </Link>
              ))}
              {dropdownLinks.length > 0 && (
                <NavMoreDropdown links={dropdownLinks} label={dropdownLabel} />
              )}
            </nav>

            {!branchLoading && branches.length > 1 && (
              <div className="relative border-l border-border-light pl-4 xl:pl-6">
                <button
                  onClick={openBranchSelection}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                >
                  <MapPin size={16} className="text-primary shrink-0" />
                  <span className="max-w-[180px] xl:max-w-[220px] truncate">
                    {selectedCity} {selectedBranch ? `- ${selectedBranch.name}` : ''}
                  </span>
                  <ChevronDown size={14} className="shrink-0" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            <div className="hidden lg:flex items-center">
              <ThemeToggle />
            </div>

            <div className="hidden lg:flex items-center">
              {isLoggedIn ? (
                <Link
                  href={`/${locale}/profile`}
                  className="flex items-center gap-1.5 p-2 xl:px-3 xl:py-1.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                  aria-label="Профиль"
                >
                  <User size={20} className="xl:w-[18px] xl:h-[18px]" />
                  <span className="hidden xl:inline-block">{t('profile')}</span>
                </Link>
              ) : (
                <Link
                  href={`/${locale}/login`}
                  className="flex items-center gap-1.5 p-2 xl:px-3 xl:py-1.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                  aria-label="Логин"
                >
                  <LogIn size={20} className="xl:w-[18px] xl:h-[18px]" />
                  <span className="hidden xl:inline-block">{t('login')}</span>
                </Link>
              )}
            </div>

            {hasOnlineOrdering && (
              <button
                onClick={openCart}
                className="relative p-2 rounded-lg text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                aria-label={t('cart')}
              >
                <ShoppingCart size={20} />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {cartItemsCount}
                  </span>
                )}
              </button>
            )}

            {/* {hasBooking && (
              <Link href={`/${locale}/${branchSlug}/reservations`} className="hidden lg:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 shadow-sm whitespace-nowrap" style={{ backgroundColor: 'var(--color-primary)' }}>
                <CalendarDays size={16} />
                <span className="hidden xl:inline-block">{t('booking')}</span>
              </Link>
            )} */}

            {tenant?.features?.showCategoryNav && tenant?.niche === 'ecommerce' && (
              <button
                onClick={() => setMobileDrawerOpen(true)}
                className="lg:hidden p-2 rounded-lg text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                aria-label={t('catalog')}
              >
                <BookOpen size={20} />
              </button>
            )}

            <button ref={burgerRef} onClick={() => setIsOpen(!isOpen)} className="lg:hidden p-2 rounded-lg text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors" aria-label="Открыть меню">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div ref={menuRef} className="lg:hidden border-t border-border-light bg-surface-page px-4 py-6 flex flex-col gap-4 shadow-dropdown max-h-[calc(100vh-64px)] overflow-y-auto">
          <nav className="flex flex-col gap-1">
            {allLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)} className="text-base font-medium text-text-secondary hover:text-primary transition-colors px-2 py-2 rounded-lg hover:bg-surface-hover">
                {link.label}
              </Link>
            ))}
          </nav>

          {!branchLoading && branches.length > 1 && (
            <div className="mt-2 pt-4 border-t border-border-light flex flex-col gap-4">
              <button
                onClick={() => { openBranchSelection(); setIsOpen(false) }}
                className="flex items-center gap-2 px-2 py-2 text-sm font-medium text-text-secondary hover:text-primary transition-colors rounded-lg hover:bg-surface-hover"
              >
                <MapPin size={16} className="text-primary" />
                {selectedCity} {selectedBranch ? `- ${selectedBranch.name}` : ''}
              </button>
            </div>
          )}

          <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-border-light">
            <div className="flex justify-center mb-2 sm:hidden">
              <LanguageSwitcher />
            </div>

            <div className="flex justify-center mb-2">
              <ThemeToggle />
            </div>

            {isLoggedIn ? (
              <Link 
                href={`/${locale}/profile`} 
                onClick={() => setIsOpen(false)} 
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-base font-medium border border-border text-text-primary hover:bg-surface-hover transition-colors"
              >
                <User size={18} />
                {t('profile')}
              </Link>
            ) : (
              <Link 
                href={`/${locale}/login`} 
                onClick={() => setIsOpen(false)} 
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-base font-medium border border-border text-text-primary hover:bg-surface-hover transition-colors"
              >
                <LogIn size={18} />
                {t('login')}
              </Link>
            )}

            {hasBooking && (
              <Link href={`/${locale}/${branchSlug}/reservations`} onClick={() => setIsOpen(false)} className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-base font-medium text-white shadow-sm transition-opacity hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)' }}>
                <CalendarDays size={18} />
                {t('booking')}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}