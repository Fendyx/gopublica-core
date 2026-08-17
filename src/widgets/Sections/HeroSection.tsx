'use client';
import Link from 'next/link';
import { BranchSection, HeroSettings, HeroCta } from '@/entities/branch-section/types';

interface HeroSectionProps {
  section: BranchSection;
  locale: string;
  tenantDomain: string;
}

export default function HeroSection({ section, locale, tenantDomain }: HeroSectionProps) {
  const settings = (section.settings || {}) as HeroSettings;
  const translations = section.translations?.[locale] || {};

  const mediaType = settings.mediaType || 'video';
  const layout = settings.layout || 'fullscreen';

  /**
   * Разрешает целевую ссылку CTA в href:
   * - targetMode === 'section' → скролл к секции по data-section-id
   * - targetMode === 'custom'  → произвольный URL
   * - fallback: targetSectionType (устаревшее поле) → скролл по data-section-type
   */
  const resolveCtaHref = (cta: HeroCta): string | undefined => {
    if (cta.targetMode === 'custom' && cta.customUrl) {
      return cta.customUrl;
    }
    if (cta.targetMode === 'section' && cta.targetSectionId) {
      return `#section-${cta.targetSectionId}`;
    }
    // Обратная совместимость со старым полем targetSectionType
    if (cta.targetSectionType) {
      return `#section-type-${cta.targetSectionType}`;
    }
    return undefined;
  };

  const containerClasses =
    layout === 'compact'
      ? 'relative h-[40vh] md:h-[60vh] w-[calc(100%-2rem)] md:w-[calc(100%-3rem)] mx-auto my-4 md:my-6 rounded-3xl overflow-hidden flex items-center justify-center'
      : 'relative h-screen w-full flex items-center justify-center overflow-hidden';
  return (
    <section className={containerClasses}>
      {mediaType === 'video' && settings.videoUrl && (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={settings.videoUrl} type="video/mp4" />
        </video>
      )}

      {mediaType === 'image' && settings.imageUrl && (
        <img
          src={settings.imageUrl}
          alt={translations.title || 'Hero image'}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {mediaType === 'slider' && settings.slides && settings.slides.length > 0 && (
        <div className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
          {settings.slides.map((slide, idx) => (
            <img
              key={idx}
              src={slide.imageUrl}
              alt={translations.title || `Slide ${idx + 1}`}
              className="w-full h-full object-cover flex-shrink-0 snap-center"
            />
          ))}
        </div>
      )}

      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 text-center text-white px-4 max-w-4xl">
        {translations.title && (
          <h1 className="text-4xl lg:text-6xl font-bold mb-6">{translations.title}</h1>
        )}
        {translations.subtitle && (
          <p className="text-lg lg:text-xl mb-10 opacity-90">{translations.subtitle}</p>
        )}

        <div className="flex flex-wrap justify-center gap-4">
          {settings.primaryCta && (
            <Link
              href={resolveCtaHref(settings.primaryCta) || '#'}
              className="inline-block px-8 py-4 rounded-lg text-white font-medium text-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {settings.primaryCta.label}
            </Link>
          )}
          {settings.secondaryCta && (
            <Link
              href={resolveCtaHref(settings.secondaryCta) || '#'}
              className="inline-block px-8 py-4 rounded-lg font-medium text-lg border-2 transition-colors hover:bg-white/10"
              style={{
                borderColor: 'var(--color-accent)',
                color: 'var(--color-accent)',
              }}
            >
              {settings.secondaryCta.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
