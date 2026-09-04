'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { BranchSection, HeroSettings, HeroCta, HeroTextAlign, HeroSlide } from '@/entities/branch-section/types';

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

  // ─── Определяем, есть ли контент для отображения ───
  const hasTitle = Boolean(translations.title);
  const hasSubtitle = Boolean(translations.subtitle);
  const hasPrimaryCta = Boolean(settings.primaryCta?.label);
  const hasSecondaryCta = Boolean(settings.secondaryCta?.label);
  const hasContent = hasTitle || hasSubtitle || hasPrimaryCta || hasSecondaryCta;

  // ─── Embla Carousel ───
  const autoplayDelay = settings.sliderAutoplayMs ?? 5000;
  const pauseOnInteraction = settings.sliderPauseOnInteraction !== false; // по умолчанию true
  const showArrows = settings.sliderShowArrows ?? false;

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: slides.length > 1 },
    [
      Autoplay({
        delay: autoplayDelay,
        // Всегда false — управляем паузой вручную через arrow/swipe handlers
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    ]
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

  /** Поставить autoplay на паузу при ручном взаимодействии */
  const pauseAutoplay = useCallback(() => {
    if (!emblaApi || !pauseOnInteraction) return;
    try {
      const autoplayPlugin = (emblaApi as any).plugins?.().autoplay;
      if (autoplayPlugin && typeof autoplayPlugin.stop === 'function') {
        autoplayPlugin.stop();
      }
    } catch {
      // Autoplay plugin may not be available
    }
  }, [emblaApi, pauseOnInteraction]);

  /** Ручное перелистывание влево */
  const scrollPrev = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollPrev();
    pauseAutoplay();
  }, [emblaApi, pauseAutoplay]);

  /** Ручное перелистывание вправо */
  const scrollNext = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollNext();
    pauseAutoplay();
  }, [emblaApi, pauseAutoplay]);

  /** Обработчик swipe — ставим autoplay на паузу */
  const handlePointerUp = useCallback(() => {
    pauseAutoplay();
  }, [pauseAutoplay]);

  useEffect(() => {
    if (!emblaApi) return;
    // Слушаем событие pointerUp для обработки свайпов
    emblaApi.on('pointerUp', handlePointerUp);
    return () => {
      emblaApi.off('pointerUp', handlePointerUp);
    };
  }, [emblaApi, handlePointerUp]);

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

  /** Рендер одного слайда: видео или изображение, опционально обёрнутое в Link */
  const renderSlide = (slide: HeroSlide, idx: number) => {
    const isVideo = Boolean(slide.videoUrl) && !slide.imageUrl;
    const mediaContent = isVideo ? (
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
    );

    return (
      <div key={idx} className="relative flex-[0_0_100%] min-w-0">
        {slide.clickableUrl ? (
          <Link href={slide.clickableUrl} className="block absolute inset-0">
            {mediaContent}
          </Link>
        ) : (
          mediaContent
        )}
      </div>
    );
  };

  /** Содержимое медиа-фона (видео / изображение / слайдер) */
  const mediaBackground = (
    <>
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
                  onClick={() => {
                    emblaApi?.scrollTo(idx);
                    pauseAutoplay();
                  }}
                  className={`h-2 rounded-full transition-all ${
                    idx === selectedIndex ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Стрелки навигации (влево / вправо) */}
          {showArrows && slides.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous slide"
                onClick={scrollPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Next slide"
                onClick={scrollNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </>
          )}
        </>
      )}
    </>
  );

  /** Контент: заголовок + подзаголовок + CTA-кнопки */
  const contentBlock = hasContent ? (
    <>
      {/* Затемняющий слой поверх медиа (для читаемости текста) */}
      <div className="absolute inset-0 bg-black/40" />

      {/* ─── Контент ─── */}
      {/* ВАЖНО: w-full обязателен — без него блок сжимается по контенту (shrink-wrap),
          и items-start/items-end/text-left/text-right из alignMap не имеют пространства,
          чтобы визуально сдвинуть текст. Заголовок и подзаголовок наследуют выравнивание
          отсюда (никаких хардкодных text-center/mx-auto на них нет). */}
      <div className={`relative z-10 flex w-full max-w-4xl flex-col px-4 sm:px-6 lg:px-8 text-white ${align.box}`}>
        {hasTitle && (
          <h1 className={styles.title}>{translations.title}</h1>
        )}
        {hasSubtitle && (
          <p className={styles.subtitle}>{translations.subtitle}</p>
        )}

        {(hasPrimaryCta || hasSecondaryCta) && (
          <div className={`flex flex-wrap gap-4 ${align.cta}`}>
            {hasPrimaryCta && (() => {
              const href = resolveCtaHref(settings.primaryCta!) || '#';
              return (
                <Link
                  href={href}
                  onClick={(e) => handleCtaClick(e, href)}
                  className={`inline-block text-white font-medium transition-opacity hover:opacity-90 ${styles.cta}`}
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {settings.primaryCta!.label}
                </Link>
              );
            })()}
            {hasSecondaryCta && (() => {
              const href = resolveCtaHref(settings.secondaryCta!) || '#';
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
                  {settings.secondaryCta!.label}
                </Link>
              );
            })()}
          </div>
        )}
      </div>
    </>
  ) : null;

  // ─── Кликабельный фон (image/video) ───
  if (settings.clickableUrl && mediaType !== 'slider') {
    return (
      <section className={styles.container}>
        <Link href={settings.clickableUrl} className="absolute inset-0 z-0">
          {mediaBackground}
        </Link>
        {contentBlock}
      </section>
    );
  }

  return (
    <section className={styles.container}>
      {mediaBackground}
      {contentBlock}
    </section>
  );
}
