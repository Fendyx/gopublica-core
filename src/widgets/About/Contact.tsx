'use client'
import { useTranslations } from 'next-intl'
import { useBranchSettings } from '@/entities/branch/useBranchSettings'

export default function Contact() {
  const t = useTranslations('contact')
  const settings = useBranchSettings()

  if (settings.loading) {
    return (
      <section id="contact" className="py-24 bg-surface-page">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center text-text-secondary">Loading contact...</div>
      </section>
    )
  }

  return (
    <section id="contact" className="py-24 bg-surface-page">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* ── Header ── */}
        <div className="flex flex-col items-center text-center mb-16">
          <span className="text-[11px] font-semibold tracking-[0.28em] uppercase text-primary mb-4">
            {t('eyebrow')}
          </span>
          <h2 className="font-heading text-4xl sm:text-5xl text-text-primary leading-tight">
            {t('title')}
          </h2>
          <div className="flex items-center gap-3 mt-5">
            <div className="h-px w-12 bg-border" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary opacity-70" />
            <div className="w-1 h-1 rounded-full bg-primary opacity-40" />
            <div className="h-px w-12 bg-border" />
          </div>
        </div>

        {/* ── Cards grid ── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <ContactCard
            icon={<IconPin />}
            label={t('address')}
            value={settings.address}
          />
          <ContactCard
            icon={<IconPhone />}
            label={t('phone')}
            value={settings.phone}
            href={`tel:${settings.phone}`}
          />
          <ContactCard
            icon={<IconMail />}
            label={t('email')}
            value={settings.email}
            href={`mailto:${settings.email}`}
          />
          <ContactCard
            icon={<IconClock />}
            label={t('hours')}
            value={settings.hours}
          />
        </div>

        {/* ── Maps CTA ── */}
        {settings.googleMapsUrl && (
          <div className="flex justify-center">
            <a
              href={settings.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-full border border-border bg-surface-card hover:border-primary hover:bg-surface-hover text-text-secondary hover:text-primary text-sm font-medium transition-all duration-200"
            >
              <IconMap />
              {t('maps')}
              <IconArrow />
            </a>
          </div>
        )}
      </div>
    </section>
  )
}

/* ─── Contact card ───────────────────────────────── */
function ContactCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode
  label: string
  value?: string
  href?: string
}) {
  if (!value) return null

  return (
    <div className="group flex flex-col gap-3 p-5 bg-surface-card border border-border rounded-2xl hover:border-primary/30 hover:shadow-card transition-all duration-200">
      <div className="w-9 h-9 rounded-xl bg-surface-hover flex items-center justify-center text-primary shrink-0 group-hover:bg-primary/10 transition-colors duration-200">
        {icon}
      </div>
      <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-text-tertiary">
        {label}
      </span>
      {href ? (
        <a href={href} className="text-sm text-text-primary hover:text-primary transition-colors duration-150 leading-snug font-medium break-all">
          {value}
        </a>
      ) : (
        <p className="text-sm text-text-primary leading-snug font-medium">{value}</p>
      )}
    </div>
  )
}

/* ─── Icons ────────────────────────────────────── */
function IconPin() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5A4.5 4.5 0 0 1 12.5 6c0 3-4.5 8.5-4.5 8.5S3.5 9 3.5 6A4.5 4.5 0 0 1 8 1.5z" />
      <circle cx="8" cy="6" r="1.5" />
    </svg>
  )
}
function IconPhone() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 2.5C2 2.5 3 1 4.5 1c.5 0 1 .5 1.5 1.5l.75 1.5c.25.5.1 1.1-.3 1.5L5.5 6.5C6.2 8 8 9.8 9.5 10.5l1-1c.4-.4 1-.55 1.5-.3L13.5 10c1 .5 1.5 1 1.5 1.5 0 1.5-1.5 2.5-1.5 2.5C5 14 2 4 2 2.5z" />
    </svg>
  )
}
function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
      <path d="M1.5 5l6.5 4.5L14.5 5" />
    </svg>
  )
}
function IconClock() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 4.5V8l2.5 2" />
    </svg>
  )
}
function IconMap() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1,2 5,1 9,3 13,1 13,12 9,13 5,11 1,12" />
      <line x1="5" y1="1" x2="5" y2="11" />
      <line x1="9" y1="3" x2="9" y2="13" />
    </svg>
  )
}
function IconArrow() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6h8M7 3l3 3-3 3" />
    </svg>
  )
}