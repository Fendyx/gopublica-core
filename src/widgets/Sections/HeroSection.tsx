'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { BranchSection, HeroSettings, HeroCta, HeroTextAlign } from '@/entities/branch-section/types';

interface HeroSectionProps {
  section: BranchSection;
  locale: string;
  tenantDomain: string;
}

/** Классы выравнивания контента по settings.textAlign */
const alignMap: Record<HeroTextAlign, { box: string; cta: string }> = {
  left: { box: 'items-start text-left', cta: 'justify-start' },
  center: { box: 'items-center text-center', cta: 'justify-center' },
  right: { box: 'items-end text-right', cta: 'justify-end' },
};

/** Стили контейнера и типографики для каждого layout-варианта */
const layoutStyles = {
  fullscreen: {
    container:
      'relative h-screen w-full flex items-center justify-center overflow-hidden',
    title: 'text-4xl lg:text-6xl font-bold mb-6',
    subtitle: 'text-lg lg:text-xl mb-10 opacity-90',
    cta: 'px-8 py-4 rounded-lg text-lg',
  },
  // Компактный вариант: низкая «плавающая карточка» с уменьшенной типографикой
  compact: {
    container:
      'relative h-[32vh] min-h-[220px] max-h-[360px] w-[calc(100%-2rem)] mx-auto my-3 rounded-2xl md:rounded-3xl overflow-hidden flex items-center justify-center shadow-xl',
    title: 'text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 leading-tight',
    subtitle: 'hidden sm:block text-sm lg:text-base mb-4 opacity-90 line-clamp-2',
    cta: 'px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg text-sm sm:text-base',
  },
} as const;

export default function HeroSection({ section, locale, tenantDomain }: HeroSectionProps) {
  const settings = (section.settings || {}) as HeroSettings;
  const translations = section.translations?.[locale] || {};

  const mediaType = settings.mediaType || 'video';
  const layout = settings.layout || 'fullscreen';
  const align = alignMap[settings.textAlign || 'center'];
  const styles = layoutStyles[layout];

  const slides = (mediaType === 'slider' ? settings.slides : [])?.filter(
    (s) => s.imageUrl || s.videoUrl
  ) ?? [];

  // ─── Embla Carousel ───
  const autoplayDelay = settings.sliderAutoplayMs ?? 5000;
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: slides.length > 1 },
    [Autoplay({ delay: autoplayDelay, stopOnInteraction: false, stopOnMouseEnter: true })]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

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

  /**
   * Handles smooth scrolling for anchor links (#section-...).
   * Prevents default link behavior and uses scrollIntoView for smooth animation.
   */
  const handleCtaClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string | undefined) => {
    if (!href || !href.startsWith('#')) return; // Let normal links work as usual

    const targetId = href.slice(1); // Remove the '#'
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      e.preventDefault();
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // If element not found, let the browser handle it (will do nothing or jump to top)
  };

  /** Рендер одного слайда: видео или изображение */
  const renderSlide = (slide: { imageUrl?: string; videoUrl?: string }, idx: number) => {
    const isVideo = Boolean(slide.videoUrl) && !slide.imageUrl;
    return (
      <div key={idx} className="relative flex-[0_0_100%] min-w-0">
        {isVideo ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={slide.videoUrl} type="video/mp4" />
          </video>
        ) : (
          <Image
            src={slide.imageUrl!}
            alt={translations.title || `Slide ${idx + 1}`}
            fill
            sizes="100vw"
            className="absolute inset-0 w-full h-full object-cover"
            priority={idx === 0}
          />
        )}
      </div>
    );
  };

  return (
    <section className={styles.container}>
      {/* ─── Медиа-фон ─── */}
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
        <Image
          src={settings.imageUrl}
          alt={translations.title || 'Hero image'}
          fill
          sizes="100vw"
          className="absolute inset-0 w-full h-full object-cover"
          priority
        />
      )}

      {mediaType === 'slider' && slides.length > 0 && (
        <>
          <div ref={emblaRef} className="absolute inset-0 overflow-hidden">
            <div className="flex h-full">{slides.map(renderSlide)}</div>
          </div>

          {/* Точки-индикаторы (только если слайдов больше одного) */}
          {slides.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Go to slide ${idx + 1}`}
                  onClick={() => emblaApi?.scrollTo(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === selectedIndex ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Затемняющий слой поверх медиа (для читаемости текста) */}
      <div className="absolute inset-0 bg-black/40" />

      {/* ─── Контент ─── */}
      {/* ВАЖНО: w-full обязателен — без него блок сжимается по контенту (shrink-wrap),
          и items-start/items-end/text-left/text-right из alignMap не имеют пространства,
          чтобы визуально сдвинуть текст. Заголовок и подзаголовок наследуют выравнивание
          отсюда (никаких хардкодных text-center/mx-auto на них нет). */}
      <div className={`relative z-10 flex w-full max-w-4xl flex-col px-4 sm:px-6 lg:px-8 ${align.box}`}>
        {translations.title && (
          <h1 className={styles.title}>{translations.title}</h1>
        )}
        {translations.subtitle && (
          <p className={styles.subtitle}>{translations.subtitle}</p>
        )}

        <div className={`flex flex-wrap gap-4 ${align.cta}`}>
          {settings.primaryCta && (() => {
            const href = resolveCtaHref(settings.primaryCta) || '#';
            return (
              <Link
                href={href}
                onClick={(e) => handleCtaClick(e, href)}
                className={`inline-block text-white font-medium transition-opacity hover:opacity-90 ${styles.cta}`}
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {settings.primaryCta.label}
              </Link>
            );
          })()}
          {settings.secondaryCta && (() => {
            const href = resolveCtaHref(settings.secondaryCta) || '#';
            return (
              <Link
                href={href}
                onClick={(e) => handleCtaClick(e, href)}
                className={`inline-block font-medium border-2 transition-colors hover:bg-white/10 ${styles.cta}`}
                style={{
                  borderColor: 'var(--color-accent)',
                  color: 'var(--color-accent)',
                }}
              >
                {settings.secondaryCta.label}
              </Link>
            );
          })()}
        </div>
      </div>
    </section>
  );
}
