'use client';
import Image from 'next/image';
import { useRef, useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';

/**
 * ProductGallery - mobile touch-swipeable carousel.
 *
 * Renders all images in a horizontal track. User swipes left/right
 * to navigate between images. Dot indicators show current position.
 * Also supports clicking/tapping the main area to open lightbox.
 */
export default function ProductGallery({ images }: { images: string[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const t = useTranslations('gallery');

  const goTo = useCallback((idx: number) => {
    if (!trackRef.current) return;
    const clamped = Math.max(0, Math.min(idx, images.length - 1));
    trackRef.current.style.transform = `translateX(-${clamped * 100}%)`;
    setActiveIdx(clamped);
  }, [images.length]);

  // Handle touch start
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    isDragging.current = false;
    if (trackRef.current) {
      trackRef.current.style.transition = 'none';
    }
  }, []);

  // Handle touch move - translate track in real-time
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current || !trackRef.current) return;
    const dx = e.touches[0].clientX - touchStart.current.x;
    const dy = e.touches[0].clientY - touchStart.current.y;

    // Only handle horizontal swipes (ignore vertical scrolling)
    if (!isDragging.current) {
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
        isDragging.current = true;
      } else if (Math.abs(dy) > Math.abs(dx)) {
        touchStart.current = null;
        return;
      }
    }

    if (isDragging.current) {
      e.preventDefault();
      const offset = -(activeIdx * 100) + (dx / trackRef.current.parentElement!.clientWidth) * 100;
      trackRef.current.style.transform = `translateX(${offset}%)`;
    }
  }, [activeIdx]);

  // Handle touch end - snap to nearest image
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current || !trackRef.current) return;
    touchStart.current = null;

    trackRef.current.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

    if (!isDragging.current) return;

    const dx = e.changedTouches[0].clientX - (e as any)._startX || 0;
    // Use the last known delta from touchmove
    const endX = e.changedTouches[0].clientX;

    // Determine direction based on minimum swipe distance
    const containerWidth = trackRef.current.parentElement!.clientWidth;
    // We need the original start position - approximate from current position
    // Simple approach: if the user swiped significantly, go to prev/next
    if (isDragging.current) {
      // The drag has been tracking - just check if we moved enough
      // Use a threshold of 20% of container width
      const currentTransform = trackRef.current.style.transform;
      const match = currentTransform.match(/translateX\(([-\d.]+)%\)/);
      if (match) {
        const currentPercent = parseFloat(match[1]);
        const targetIdx = Math.round(-currentPercent / 100);
        goTo(targetIdx);
      } else {
        goTo(activeIdx);
      }
    }
  }, [activeIdx, goTo]);

  // Fallback: arrow keys for keyboard nav
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goTo(activeIdx - 1);
      if (e.key === 'ArrowRight') goTo(activeIdx + 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeIdx, goTo]);

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
    <div className="relative w-full h-full select-none overflow-hidden">
      {/* Swipeable track */}
      <div
        ref={trackRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="flex h-full transition-transform"
        style={{ width: `${images.length * 100}%`, transform: 'translateX(0%)' }}
      >
        {images.map((img, idx) => (
          <div
            key={idx}
            className="relative h-full flex-shrink-0"
            style={{ width: `${100 / images.length}%` }}
          >
            <Image
              src={img}
              alt=""
              fill
              sizes="100vw"
              className="object-contain"
              priority={idx === 0}
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-5 inset-x-0 flex items-center justify-center gap-1.5 z-10 pointer-events-none">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={`block h-px transition-all duration-300 bg-foreground/80 pointer-events-auto ${
                idx === activeIdx ? 'w-6 opacity-100' : 'w-2 opacity-30'
              }`}
              aria-label={`Go to image ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}