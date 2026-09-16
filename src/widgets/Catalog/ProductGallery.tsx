'use client';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { useTranslations } from 'next-intl';

interface ProductGalleryProps {
  images: string[];
  /** Called after a tap (not a swipe/drag) on the main image area. */
  onTapImage?: (index: number) => void;
}

/**
 * ProductGallery - mobile product image carousel (Amazon/Allegro style).
 *
 * Built on Embla Carousel for native-feeling touch swipe with momentum,
 * rubber-band edges and correct tap-vs-drag detection. Vertical page
 * scrolling is preserved (touch-action: pan-y); only horizontal drags
 * move the carousel.
 */
export default function ProductGallery({ images, onTapImage }: ProductGalleryProps) {
  const t = useTranslations('gallery');
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: false,
    duration: 25,
  });
  const [activeIdx, setActiveIdx] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setActiveIdx(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const goTo = useCallback(
    (idx: number) => {
      emblaApi?.scrollTo(idx);
    },
    [emblaApi],
  );

  // Tap (without drag) opens the lightbox at the current slide.
  // Embla suppresses clicks that follow a drag, so this only fires on taps.
  const handleImageClick = useCallback(() => {
    onTapImage?.(activeIdx);
  }, [onTapImage, activeIdx]);

  if (images.length === 0) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <span className="text-muted-foreground text-[10px] tracking-widest uppercase">
          {t('photo')}
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full select-none">
      {/* Embla viewport */}
      <div ref={emblaRef} className="h-full overflow-hidden">
        <div className="flex h-full">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative min-w-0 flex-[0_0_100%] touch-pan-y"
              onClick={handleImageClick}
            >
              <Image
                src={img}
                alt={`${t('photo')} ${idx + 1}`}
                fill
                sizes="100vw"
                className="object-contain pointer-events-none"
                priority={idx === 0}
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1.5 z-10 pointer-events-none">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={`block h-px transition-all duration-300 bg-foreground/80 pointer-events-auto ${
                idx === activeIdx ? 'w-6 opacity-100' : 'w-2 opacity-30'
              }`}
              aria-label={`${t('photo')} ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}