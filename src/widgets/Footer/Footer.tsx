'use client'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useTenant } from '@/entities/tenant/TenantContext'
import { useBranchSettings } from '@/entities/branch/useBranchSettings'

export default function Footer() {
  const t = useTranslations('footer')
  const tenant = useTenant()
  const settings = useBranchSettings()
  const locale = useLocale()
  const currentYear = new Date().getFullYear()

  const navLinks = [
    { href: `/${locale}`, label: t('home') },
    { href: `/${locale}/menu`, label: t('menu') },
    { href: `/${locale}/reservations`, label: t('reservations') },
    { href: '#contact', label: t('contact') },
  ]

  const legalLinks = [
    { href: '#', label: t('privacyPolicy') },
    { href: '#', label: t('terms') },
  ]

  if (settings.loading) {
    return (
      <footer className="bg-surface-inverse text-text-inverse/80 pt-12 pb-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">Loading footer...</div>
      </footer>
    )
  }

  return (
    <footer className="bg-surface-inverse text-text-inverse/80 pt-12 pb-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-text-inverse/20">
          <div className="lg:col-span-2">
            <p className="font-heading text-2xl font-semibold text-text-inverse mb-3">
              {(tenant?.businessName || tenant?.clientName) || ''}
            </p>
            {settings.address && <p className="text-sm">{settings.address}</p>}
            {settings.phone && (
              <p className="text-sm">
                <a href={`tel:${settings.phone}`} className="hover:text-text-inverse transition-colors">
                  {settings.phone}
                </a>
              </p>
            )}
            {settings.email && (
              <p className="text-sm">
                <a href={`mailto:${settings.email}`} className="hover:text-text-inverse transition-colors">
                  {settings.email}
                </a>
              </p>
            )}
          </div>

          <div>
            <h4 className="font-semibold text-text-inverse mb-3 text-sm uppercase tracking-wider">
              {t('navigation')}
            </h4>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm hover:text-text-inverse transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-text-inverse mb-3 text-sm uppercase tracking-wider">
              {t('legal')}
            </h4>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm hover:text-text-inverse transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 text-sm">
          <p>© {(tenant?.businessName || tenant?.clientName) || ''}</p>
          <p className="flex items-center gap-1">
            <span>{t('poweredBy')}</span>
            <a href="https://gopublica.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-text-inverse hover:underline">
              GoPublica
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}