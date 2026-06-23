'use client'
import { useTranslations } from 'next-intl'
import { useBranchSettings } from '@/entities/branch/useBranchSettings'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function Contact() {
  const t = useTranslations('contact')
  const settings = useBranchSettings()
  const tDays = useTranslations('admin.days')

  if (settings.loading) {
    return (
      <section id="contact" className="py-24 bg-surface-page">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6 lg:gap-8">
            <div className="flex flex-col gap-4">
              <div className="bg-surface-card border border-border rounded-2xl h-48 animate-pulse" />
              <div className="bg-surface-card border border-border rounded-2xl h-64 animate-pulse" />
            </div>
            <div className="bg-surface-card border border-border rounded-2xl min-h-[480px] animate-pulse" />
          </div>
        </div>
      </section>
    )
  }

  const mapAddress = encodeURIComponent(settings.address || 'Poland');
  const iframeSrc = `https://maps.google.com/maps?q=${mapAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const mapsUrl = `https://maps.google.com/?q=${mapAddress}`;

  const workingHoursEntries = DAYS
    .map(day => ({ day, hours: settings.workingHours?.[day] }))
    .filter((e): e is { day: string; hours: string } => Boolean(e.hours));

  return (
    <section id="contact" className="py-24 bg-surface-page">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* ── Header ── */}
        <div className="flex flex-col items-center text-center mb-14">
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-3">
            {t('eyebrow')}
          </span>
          <h2 className="font-heading text-4xl sm:text-5xl text-text-primary leading-tight">
            {t('title')}
          </h2>
        </div>

        {/* ── Main Grid ── */}
        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-5 lg:gap-6 items-stretch">

          {/* ── Left: Info Blocks ── */}
          <div className="flex flex-col gap-4">

            {/* Contact Details */}
            <div className="bg-surface-card border border-border rounded-2xl p-6 flex flex-col gap-0">
              <ContactRow icon={<IconPin />} label={t('address')} value={settings.address} />
              <Divider />
              <ContactRow
                icon={<IconPhone />}
                label={t('phone')}
                value={settings.phone}
                href={`tel:${settings.phone?.replace(/\s/g, '')}`}
              />
              <Divider />
              <ContactRow
                icon={<IconMail />}
                label={t('email')}
                value={settings.email}
                href={`mailto:${settings.email}`}
              />
            </div>

            {/* Working Hours */}
            {(workingHoursEntries.length > 0 || settings.hours) && (
              <div className="bg-surface-card border border-border rounded-2xl p-6 flex-1">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="text-primary">
                    <IconClock />
                  </div>
                  <h3 className="text-sm font-semibold tracking-wide uppercase text-text-secondary">
                    {t('hours')}
                  </h3>
                </div>

                {workingHoursEntries.length > 0 ? (
                  <div className="flex flex-col">
                    {workingHoursEntries.map(({ day, hours }, i) => (
                      <div
                        key={day}
                        className={`flex justify-between items-center py-2.5 ${
                          i < workingHoursEntries.length - 1 ? 'border-b border-border/30' : ''
                        }`}
                      >
                        <span className="text-sm text-text-secondary capitalize">{tDays(day)}</span>
                        <span className="text-sm text-text-primary font-semibold tabular-nums">
                          {hours}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-primary font-medium">{settings.hours}</p>
                )}
              </div>
            )}
          </div>

          {/* ── Right: Elegant Map ── */}
          <div className="relative rounded-2xl overflow-hidden min-h-[480px] lg:min-h-auto border border-border shadow-sm bg-surface-hover">

            {/* 
              Iframe is shifted up by 40px and made taller so the 
              Google Maps bottom bar (branding, controls) stays hidden below the fold.
            */}
            <iframe
              title="Google Maps"
              src={iframeSrc}
              width="100%"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              style={{
                border: 0,
                position: 'absolute',
                top: '-40px',
                left: 0,
                width: '100%',
                height: 'calc(100% + 40px)',
                display: 'block',
              }}
            />

            {/* Top vignette — softens the cut */}
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-28 pointer-events-none z-10"
              style={{
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, transparent 100%)',
              }}
            />

            {/* Bottom vignette — floats the address card */}
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-40 pointer-events-none z-10"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)',
              }}
            />

            {/* Get Directions pill — top right */}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-sm text-gray-800 text-xs font-semibold px-3.5 py-2 rounded-full shadow-md hover:shadow-lg hover:bg-white hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
            >
              <IconCompass />
              Get directions
            </a>

            {/* Floating address badge — bottom left */}
            {settings.address && (
              <div className="absolute bottom-5 left-4 right-4 z-20 flex items-center gap-3 pointer-events-none">
                {/* Pin dot */}
                <div className="w-9 h-9 rounded-full bg-primary shadow-lg flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 1.5A4.5 4.5 0 0 1 12.5 6c0 3-4.5 8.5-4.5 8.5S3.5 9 3.5 6A4.5 4.5 0 0 1 8 1.5z" />
                    <circle cx="8" cy="6" r="1.5" />
                  </svg>
                </div>
                <p className="text-sm text-white font-medium leading-snug drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                  {settings.address}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Helper ────────────────────────────────── */
function Divider() {
  return <div className="h-px bg-border/40 my-1" />
}

function ContactRow({
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
    <div className="flex items-center gap-4 py-3.5">
      <div className="w-9 h-9 rounded-xl bg-surface-hover flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-text-tertiary mb-0.5">
          {label}
        </span>
        {href ? (
          <a
            href={href}
            className="text-sm text-text-primary font-medium hover:text-primary transition-colors truncate"
          >
            {value}
          </a>
        ) : (
          <span className="text-sm text-text-primary font-medium leading-snug">{value}</span>
        )}
      </div>
    </div>
  )
}

/* ─── Icons ─────────────────────────────────── */
function IconPin() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5A4.5 4.5 0 0 1 12.5 6c0 3-4.5 8.5-4.5 8.5S3.5 9 3.5 6A4.5 4.5 0 0 1 8 1.5z" />
      <circle cx="8" cy="6" r="1.5" />
    </svg>
  )
}
function IconPhone() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 2.5C2 2.5 3 1 4.5 1c.5 0 1 .5 1.5 1.5l.75 1.5c.25.5.1 1.1-.3 1.5L5.5 6.5C6.2 8 8 9.8 9.5 10.5l1-1c.4-.4 1-.55 1.5-.3L13.5 10c1 .5 1.5 1 1.5 1.5 0 1.5-1.5 2.5-1.5 2.5C5 14 2 4 2 2.5z" />
    </svg>
  )
}
function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
      <path d="M1.5 5l6.5 4.5L14.5 5" />
    </svg>
  )
}
function IconClock() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 4.5V8l2.5 2" />
    </svg>
  )
}
function IconCompass() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M10.5 5.5 9 9l-3.5 1.5L7 7l3.5-1.5z" />
    </svg>
  )
}