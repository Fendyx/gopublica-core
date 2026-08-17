'use client';
import { BranchSection, MapSettings } from '@/entities/branch-section/types';

interface MapSectionProps {
  section: BranchSection;
  locale: string;
  tenantDomain: string;
}

export default function MapSection({ section, locale, tenantDomain }: MapSectionProps) {
  const settings = section.settings as MapSettings;
  const translations = section.translations[locale] ?? {};

  const mapAddress = encodeURIComponent(settings.address || 'Poland');
  const iframeSrc = `https://maps.google.com/maps?q=${mapAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const mapsUrl = `https://maps.google.com/?q=${mapAddress}`;

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {(translations.title || translations.subtitle) && (
          <div className="text-center mb-8">
            {translations.title && (
              <h2 className="text-3xl font-bold mb-2">{translations.title}</h2>
            )}
            {translations.subtitle && (
              <p className="text-gray-600">{translations.subtitle}</p>
            )}
          </div>
        )}

        <div className="relative rounded-2xl overflow-hidden min-h-[480px] lg:min-h-auto border border-border shadow-sm bg-surface-hover">
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

          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-28 pointer-events-none z-10"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, transparent 100%)',
            }}
          />

          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-40 pointer-events-none z-10"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)',
            }}
          />

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-sm text-gray-800 text-xs font-semibold px-3.5 py-2 rounded-full shadow-md hover:shadow-lg hover:bg-white hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="8" r="6.5" />
              <path d="M10.5 5.5 9 9l-3.5 1.5L7 7l3.5-1.5z" />
            </svg>
            Get directions
          </a>

          {settings.address && (
            <div className="absolute bottom-5 left-4 right-4 z-20 flex items-center gap-3 pointer-events-none">
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
    </section>
  );
}
