'use client'
import { useEffect, useState } from 'react'
import { useTenant } from '@/entities/tenant/TenantContext'
import { useTranslations } from 'next-intl'

type NewsType = 'info' | 'marketing' | 'alert'

interface NewsPost {
  _id: string
  type: NewsType
  title: string
  content: string
  createdAt: string
  expiresAt?: string | null
}

const TYPE_CONFIG: Record<NewsType, {
  stripe: string
  badge: string
  label: string
  expires: string
}> = {
  info: {
    stripe: 'bg-blue-500',
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    label: 'Info',
    expires: 'text-text-tertiary',
  },
  marketing: {
    stripe: 'bg-green-500',
    badge: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
    label: 'Update',
    expires: 'text-text-tertiary',
  },
  alert: {
    stripe: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
    label: 'Alert',
    expires: 'text-red-400',
  },
}

const PROMO_FEATURES = [
  'QR-Code-Menü für jeden Tisch',
  'NFC-Schilder — ein Tippen, und das Menü öffnet sich sofort',
  'Druck und Lieferung direkt an Ihre Adresse',
  'Sie müssen nichts weiter tun — einfach auf dem Tisch platzieren',
]

function BusinessHelpSection() {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight text-text-primary mb-4">
        Hilfe für Ihr Unternehmen
      </h2>
      <div className="rounded-xl border border-border-light bg-surface-card shadow-card overflow-hidden transition-shadow hover:shadow-dropdown">
        <div className="h-[2px] bg-primary" aria-hidden />
        <div className="grid grid-cols-1 md:grid-cols-[1fr_240px]">
          <div className="px-6 py-5">
            <span className="inline-flex items-center text-[11px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 mb-3">
              Neues Angebot
            </span>
            <h3 className="text-[15px] font-semibold text-text-primary leading-snug mb-2">
              QR-Codes und NFC-Schilder für Ihr Restaurant
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Wir produzieren und liefern personalisierte Schilder für jeden Tisch in Ihrem
              Lokal. Gäste können das Menü mit einem einzigen Fingertipp oder Scan öffnen – ohne
              Apps und ohne die manuelle Eingabe einer Adresse.
            </p>
            <ul className="flex flex-col gap-2 mb-5">
              {PROMO_FEATURES.map((text, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                  <span className="mt-0.5 shrink-0 text-[11px] font-bold text-primary">✓</span>
                  {text}
                </li>
              ))}
            </ul>
            <a
              href="mailto:hello@example.com?subject=Bestellung von QR-/NFC-Schildern für das Restaurant"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all"
            >
              Schilder bestellen
            </a>
          </div>
          <div className="flex items-center justify-center bg-surface-hover p-5 md:border-l border-t md:border-t-0 border-border-light">
            <img
              src="https://s.alicdn.com/@sc04/kf/H2df321f633dd4fa7859dd19cfc0f065eY.png?avif=close&webp=close"
              alt="QR- und NFC-Schilder für das Restaurant"
              className="w-full max-w-[200px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default function GopublicaPage() {
  const t = useTranslations('admin.gopublicaPage')
  const tenant = useTenant()
  const [news, setNews] = useState<NewsPost[]>([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const savedToken = localStorage.getItem('saas_token')
    if (!savedToken) {
      window.location.href = '/admin/login'
    } else {
      setToken(savedToken)
    }
  }, [])

  useEffect(() => {
    if (!token || !tenant?.tenantId) return
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/saas/news?tenantId=${tenant.tenantId}&tariff=basic`
    )
      .then((res) => res.json())
      .then((data) => setNews(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [token, tenant])

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-1.5 py-12">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 rounded-full bg-border animate-pulse"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10">
      <BusinessHelpSection />
      <section>
        <h2 className="text-lg font-semibold tracking-tight text-text-primary mb-4">
          {t('title')}
        </h2>
        {news.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 py-16 border-2 border-dashed border-border rounded-xl text-center">
            <p className="text-sm font-medium text-text-secondary">{t('empty')}</p>
            <p className="text-xs text-text-tertiary">{t('emptyDesc')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {news.map((item) => {
              const cfg = TYPE_CONFIG[item.type]
              return (
                <article
                  key={item._id}
                  className="grid grid-cols-[3px_1fr] rounded-xl border border-border-light bg-surface-card shadow-card overflow-hidden transition-shadow hover:shadow-dropdown"
                >
                  <div className={`${cfg.stripe} self-stretch`} aria-hidden />
                  <div className="px-5 py-4">
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <span className={`inline-flex items-center text-[11px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                      <h3 className="flex-1 min-w-0 text-sm font-semibold text-text-primary leading-snug truncate">
                        {item.title}
                      </h3>
                      <time className="shrink-0 text-xs text-text-tertiary ml-auto">
                        {new Date(item.createdAt).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </time>
                    </div>
                    <p className="text-sm leading-relaxed text-text-secondary whitespace-pre-line">
                      {item.content}
                    </p>
                    {item.expiresAt && (
                      <p className={`mt-3 pt-3 border-t border-border-light text-xs ${cfg.expires}`}>
                        {t('expires')}{' '}
                        {new Date(item.expiresAt).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}