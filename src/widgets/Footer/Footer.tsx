'use client'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { useTenant } from '@/entities/tenant/TenantContext'
import { useBranch } from '@/entities/branch/BranchContext'
import { useBranchSettings } from '@/entities/branch/useBranchSettings'
import { getAllVisibleNavLinks } from '@/shared/lib/navigation'

export default function Footer() {
  const t = useTranslations('footer')
  const navT = useTranslations('nav')
  const tenant = useTenant()
  const settings = useBranchSettings()
  const { selectedBranch } = useBranch()
  const locale = useLocale()
  const { branchSlug } = useParams()
  const currentYear = new Date().getFullYear()

  const navLinks = getAllVisibleNavLinks({
    navigation: tenant?.navigation,
    tenant,
    customPages: selectedBranch?.customPages,
    locale,
    branchSlug: branchSlug as string,
    t: (key: string) => navT(key as any),
  })

  const legalLinks = [
    { href: `/${locale}/regulamin`, label: t('privacyPolicy') },
    { href: `/${locale}/polityka-prywatnosci`, label: t('terms') },
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
            <div className="flex items-center gap-3 mb-3">
              {tenant?.logoUrl && (
                <img
                  src={tenant.logoUrl}
                  alt={tenant.businessName || tenant.clientName || ''}
                  className="h-10 w-auto max-w-[200px] object-contain"
                />
              )}
              <p className="font-heading text-2xl font-semibold text-text-inverse">
                {(tenant?.businessName || tenant?.clientName) || ''}
              </p>
            </div>
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