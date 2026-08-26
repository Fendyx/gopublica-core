'use client';
import { BranchSection, BookingSettings } from '@/entities/branch-section/types';
import BookingForm from '@/features/reservation/BookingForm';
import MapEmbed from '@/components/ui/MapEmbed';

interface BookingSectionProps {
  section: BranchSection;
  locale: string;
  tenantDomain: string;
}

export default function BookingSection({ section, locale, tenantDomain }: BookingSectionProps) {
  const title = section.translations?.[locale]?.title;
  const subtitle = section.translations?.[locale]?.subtitle;
  const settings = (section.settings || {}) as BookingSettings;
  const { sideContentType = 'none', address, customText } = settings;

  // ── Single-column layout (default) ──
  if (sideContentType === 'none') {
    return (
      <section className="py-12 bg-surface-page">
        <BookingForm title={title} subtitle={subtitle} variant="centered" />
      </section>
    );
  }

  // ── Split-screen layout ──
  return (
    <section className="py-12 bg-surface-page">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6 lg:gap-8 items-stretch">
          {/* Left: Booking Form — fills its grid column */}
          <div className="w-full">
            <BookingForm title={title} subtitle={subtitle} variant="split" />
          </div>

          {/* Right: Map or Custom Text */}
          <div className="w-full lg:order-none">
            {sideContentType === 'map' ? (
              <MapEmbed address={address} className="w-full h-[400px] lg:h-full" />
            ) : sideContentType === 'text' ? (
              <div className="w-full bg-surface-card border border-border rounded-2xl p-6 sm:p-8 flex flex-col">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-1 h-5 rounded-full bg-primary" />
                  <h3 className="text-sm font-semibold tracking-wide uppercase text-text-secondary">
                    {title || 'About'}
                  </h3>
                </div>
                {subtitle && (
                  <p className="text-sm text-text-secondary mb-4">{subtitle}</p>
                )}
                <p className="text-base text-text-primary leading-relaxed whitespace-pre-wrap">
                  {customText || ''}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
