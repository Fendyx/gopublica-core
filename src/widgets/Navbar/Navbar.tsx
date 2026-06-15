'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useTenant } from '@/entities/tenant/TenantContext'
import LanguageSwitcher from '@/features/language-switcher/LanguageSwitcher'
import { Menu, X, CalendarDays, ChevronDown, MapPin, Store, Check } from 'lucide-react'
import { useBranch } from '@/entities/branch/BranchContext'

export default function Navbar() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const tenant = useTenant()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const burgerRef = useRef<HTMLButtonElement>(null)

  const {
    cities,
    selectedCity,
    selectedBranch,
    setCity,
    setBranch,
    branches,
    loading: branchLoading,
  } = useBranch()

  const [cityDropdownOpen, setCityDropdownOpen] = useState(false)
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (
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

  const links = [
    { href: `/${locale}`, label: t('home') },
    ...(tenant?.features?.hasMenu ? [{ href: `/${locale}/menu`, label: t('menu') }] : []),
    ...(tenant?.features?.hasGallery ? [{ href: '#gallery', label: t('gallery') }] : []),
    { href: '#contact', label: t('contact') },
  ]

  const branchesInSelectedCity = branches.filter((b) => b.city === selectedCity)

  const hasBooking = tenant?.features?.hasBooking ?? false

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-page border-b border-border-light transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="font-heading text-xl font-semibold text-text-primary hover:text-primary transition-colors">
            {tenant?.clientName ?? ''}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex items-center gap-6">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Branch & City Selectors (Desktop) */}
            {!branchLoading && cities.length > 0 && (
              <div className="flex items-center gap-3 ml-4 pl-6 border-l border-border-light">
                {cities.length > 1 && (
                  <div className="relative">
                    <button
                      onClick={() => {
                        setCityDropdownOpen(!cityDropdownOpen)
                        setBranchDropdownOpen(false)
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        cityDropdownOpen ? 'bg-surface-hover text-text-primary' : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                      }`}
                    >
                      <MapPin size={16} className="text-primary" />
                      {selectedCity || cities[0]}
                      <ChevronDown size={14} className={`transition-transform duration-200 ${cityDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {cityDropdownOpen && (
                      <div className="absolute top-full right-0 mt-2 min-w-[180px] bg-surface-card shadow-dropdown rounded-xl border border-border overflow-hidden z-50 py-1">
                        {cities.map((city) => (
                          <button
                            key={city}
                            onClick={() => { setCity(city); setCityDropdownOpen(false); }}
                            className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-left hover:bg-surface-hover transition-colors group"
                          >
                            <span className={selectedCity === city ? 'text-primary font-medium' : 'text-text-secondary group-hover:text-text-primary'}>
                              {city}
                            </span>
                            {selectedCity === city && <Check size={14} className="text-primary" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {branchesInSelectedCity.length > 1 && (
                  <div className="relative">
                    <button
                      onClick={() => {
                        setBranchDropdownOpen(!branchDropdownOpen)
                        setCityDropdownOpen(false)
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        branchDropdownOpen ? 'bg-surface-hover text-text-primary' : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                      }`}
                    >
                      <Store size={16} className="text-primary" />
                      <span className="max-w-[120px] truncate">{selectedBranch?.name || 'Филиал'}</span>
                      <ChevronDown size={14} className={`transition-transform duration-200 ${branchDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {branchDropdownOpen && (
                      <div className="absolute top-full right-0 mt-2 min-w-[220px] bg-surface-card shadow-dropdown rounded-xl border border-border overflow-hidden z-50 py-1">
                        {branchesInSelectedCity.map((branch) => (
                          <button
                            key={branch._id}
                            onClick={() => { setBranch(branch); setBranchDropdownOpen(false); }}
                            className="flex flex-col w-full text-left px-4 py-2.5 text-sm hover:bg-surface-hover transition-colors group"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className={`font-medium ${selectedBranch?._id === branch._id ? 'text-primary' : 'text-text-primary'}`}>
                                {branch.name}
                              </span>
                              {selectedBranch?._id === branch._id && <Check size={14} className="text-primary shrink-0" />}
                            </div>
                            {branch.address && (
                              <span className="text-xs text-text-tertiary mt-0.5 truncate w-full">
                                {branch.address}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            {hasBooking && (
              <Link href={`/${locale}/reservations`} className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 shadow-sm" style={{ backgroundColor: 'var(--color-primary)' }}>
                <CalendarDays size={16} />
                {t('booking')}
              </Link>
            )}
            <button ref={burgerRef} onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 rounded-lg text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors" aria-label="Открыть меню">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div ref={menuRef} className="md:hidden border-t border-border-light bg-surface-page px-4 py-6 flex flex-col gap-4 shadow-dropdown max-h-[calc(100vh-64px)] overflow-y-auto">
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)} className="text-base font-medium text-text-secondary hover:text-primary transition-colors px-2 py-2 rounded-lg hover:bg-surface-hover">
                {link.label}
              </Link>
            ))}
          </nav>

          {!branchLoading && cities.length > 0 && (
            <div className="mt-2 pt-4 border-t border-border-light flex flex-col gap-5">
              {cities.length > 1 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider px-2">Город</span>
                  <div className="flex flex-wrap gap-2">
                    {cities.map((city) => (
                      <button
                        key={city}
                        onClick={() => setCity(city)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                          selectedCity === city 
                            ? 'bg-primary text-white shadow-sm' 
                            : 'bg-surface-hover text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        <MapPin size={14} className={selectedCity === city ? 'text-white' : 'text-text-tertiary'} />
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {branchesInSelectedCity.length > 1 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider px-2">Филиал</span>
                  <div className="flex flex-col gap-2">
                    {branchesInSelectedCity.map((branch) => (
                      <button
                        key={branch._id}
                        onClick={() => { setBranch(branch); setIsOpen(false); }}
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
              )}
            </div>
          )}

          <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-border-light">
            <div className="flex justify-center mb-2">
              <LanguageSwitcher />
            </div>
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