'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useTenant } from '@/entities/tenant/TenantContext'
import LanguageSwitcher from '@/features/language-switcher/LanguageSwitcher'
import { Menu, X, CalendarDays, ChevronDown, MapPin, Store, Check, ShoppingCart, User, LogIn } from 'lucide-react'
import { useBranch } from '@/entities/branch/BranchContext'
import { useCartStore } from '@/shared/store/cartStore'

export default function Navbar() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const tenant = useTenant()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const burgerRef = useRef<HTMLButtonElement>(null)
  const locationDropdownRef = useRef<HTMLDivElement>(null)

  // Состояние авторизации
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const {
    cities,
    selectedCity,
    selectedBranch,
    setCity,
    setBranch,
    branches,
    loading: branchLoading,
  } = useBranch()

  // Единое состояние для нового объединенного дропдауна локаций (Десктоп)
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false)

  // Корзина: Считаем сумму quantity, а не длину массива
  const cartItemsCount = useCartStore((s) => s.items.reduce((acc, item) => acc + item.quantity, 0))
  const hasOnlineOrdering = tenant?.features?.hasOnlineOrdering ?? false

  // Проверяем токен при загрузке
  useEffect(() => {
    const token = localStorage.getItem('customer_token')
    setIsLoggedIn(!!token)
  }, [])

  // Обработка клика вне меню и дропдауна локаций
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Закрываем мобильное меню
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        burgerRef.current &&
        !burgerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }

      // Закрываем дропдаун локаций
      if (
        locationDropdownOpen &&
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(event.target as Node)
      ) {
        setLocationDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, locationDropdownOpen])

  useEffect(() => {
    if (!isOpen) return
    window.history.pushState({ menuOpen: true }, '')
    const handlePopState = () => setIsOpen(false)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isOpen])

  const links = [
    { href: `/${locale}`, label: t('home') },
    ...(tenant?.features?.hasMenu ? [{ href: `/${locale}/catalog`, label: t('menu') }] : []),
    ...(tenant?.features?.hasGallery ? [{ href: `/${locale}#gallery`, label: t('gallery') }] : []),
    { href: `/${locale}#contact`, label: t('contact') },
  ]

  const hasBooking = tenant?.features?.hasBooking ?? false

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-page border-b border-border-light transition-colors">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="font-heading text-xl font-semibold text-text-primary hover:text-primary transition-colors shrink-0">
            {(tenant?.businessName || tenant?.clientName) || ''}
          </Link>

          {/* Desktop Navigation (скрываем до lg, чтобы не теснилось) */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-8 flex-1 justify-center">
            <nav className="flex items-center gap-4 xl:gap-6">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className="text-sm font-medium text-text-secondary hover:text-primary transition-colors whitespace-nowrap">
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* ЕДИНЫЙ Селектор Города и Филиала (Desktop) */}
            {!branchLoading && cities.length > 0 && (
              <div className="relative border-l border-border-light pl-4 xl:pl-6" ref={locationDropdownRef}>
                <button
                  onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    locationDropdownOpen ? 'bg-surface-hover text-text-primary' : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                  }`}
                >
                  <MapPin size={16} className="text-primary shrink-0" />
                  <span className="max-w-[180px] xl:max-w-[220px] truncate">
                    {selectedCity} {selectedBranch ? `— ${selectedBranch.name}` : ''}
                  </span>
                  <ChevronDown size={14} className={`shrink-0 transition-transform duration-200 ${locationDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {locationDropdownOpen && (
                  <div className="absolute top-full left-0 xl:right-0 xl:left-auto mt-2 min-w-[260px] bg-surface-card shadow-dropdown rounded-xl border border-border overflow-hidden z-50 py-2">
                    {cities.map((city) => {
                      const cityBranches = branches.filter((b) => b.city === city)
                      return (
                        <div key={city} className="mb-2 last:mb-0">
                          <div className="px-4 py-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider flex items-center justify-between bg-surface-page/50">
                            {city}
                          </div>
                          {cityBranches.map((branch) => (
                            <button
                              key={branch._id}
                              onClick={() => {
                                setCity(city)
                                setBranch(branch)
                                setLocationDropdownOpen(false)
                              }}
                              className="flex flex-col w-full text-left px-4 py-2 text-sm hover:bg-surface-hover transition-colors group"
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className={`font-medium ${selectedBranch?._id === branch._id ? 'text-primary' : 'text-text-primary'}`}>
                                  {branch.name}
                                </span>
                                {selectedBranch?._id === branch._id && <Check size={14} className="text-primary shrink-0" />}
                              </div>
                              {branch.address && (
                                <span className="text-xs text-text-tertiary mt-0.5 truncate w-full group-hover:text-text-secondary">
                                  {branch.address}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            {/* Профиль / Логин (Desktop) */}
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

            {/* Иконка корзины */}
            {hasOnlineOrdering && (
              <Link
                href={`/${locale}/order/checkout`}
                className="relative p-2 rounded-lg text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                aria-label="Корзина"
              >
                <ShoppingCart size={20} />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
            )}

            {/* Кнопка бронирования */}
            {hasBooking && (
              <Link href={`/${locale}/reservations`} className="hidden lg:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 shadow-sm whitespace-nowrap" style={{ backgroundColor: 'var(--color-primary)' }}>
                <CalendarDays size={16} />
                <span className="hidden xl:inline-block">{t('booking')}</span>
              </Link>
            )}

            {/* Бургер (показываем до lg) */}
            <button ref={burgerRef} onClick={() => setIsOpen(!isOpen)} className="lg:hidden p-2 rounded-lg text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors" aria-label="Открыть меню">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div ref={menuRef} className="lg:hidden border-t border-border-light bg-surface-page px-4 py-6 flex flex-col gap-4 shadow-dropdown max-h-[calc(100vh-64px)] overflow-y-auto">
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)} className="text-base font-medium text-text-secondary hover:text-primary transition-colors px-2 py-2 rounded-lg hover:bg-surface-hover">
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Локации в мобильном меню */}
          {!branchLoading && cities.length > 0 && (
            <div className="mt-2 pt-4 border-t border-border-light flex flex-col gap-4">
              <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider px-2">Локация</span>
              
              <div className="flex flex-col gap-4">
                {cities.map((city) => (
                  <div key={city} className="flex flex-col gap-2">
                    <div className="px-2 text-sm font-medium text-text-secondary flex items-center gap-1.5">
                      <MapPin size={14} className="text-primary" />
                      {city}
                    </div>
                    <div className="flex flex-col gap-2 pl-2">
                      {branches.filter(b => b.city === city).map((branch) => (
                        <button
                          key={branch._id}
                          onClick={() => {
                            setCity(city)
                            setBranch(branch)
                            setIsOpen(false)
                          }}
                          className={`flex flex-col text-left px-4 py-3 rounded-xl text-sm transition-all border ${
                            selectedBranch?._id === branch._id 
                              ? 'bg-primary/5 border-primary text-primary' 
                              : 'bg-surface-hover border-transparent text-text-secondary hover:bg-surface-card hover:border-border'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Store size={14} className={selectedBranch?._id === branch._id ? 'text-primary' : 'text-text-tertiary'} />
                            <span className="font-medium">{branch.name}</span>
                          </div>
                          {branch.address && (
                            <span className={`mt-1 pl-6 text-xs ${selectedBranch?._id === branch._id ? 'text-primary/80' : 'text-text-tertiary'}`}>
                              {branch.address}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-border-light">
            <div className="flex justify-center mb-2 sm:hidden">
              <LanguageSwitcher />
            </div>

            {/* Профиль / Логин (Mobile) */}
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
              <Link href={`/${locale}/reservations`} onClick={() => setIsOpen(false)} className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-base font-medium text-white shadow-sm transition-opacity hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)' }}>
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