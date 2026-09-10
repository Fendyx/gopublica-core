'use client';

import Image from 'next/image';
import { useRef, useState, useCallback, useEffect } from 'react';
import { GripVertical } from 'lucide-react';
import { BranchSection, BranchSectionItem, BeforeAfterSettings } from '@/entities/branch-section/types';
import SectionBackground from './SectionBackground';

interface BeforeAfterSectionProps {
  section: BranchSection;
  locale: string;
  tenantDomain: string;
  branchSlug?: string;
}

function getAttribute(items: { key: string; value: string }[] | undefined, key: string): string {
  return items?.find((a) => a.key === key)?.value || '';
}

/**
 * Single before/after comparison slider.
 *
 * Uses pointer events (mouse + touch) for the drag-to-compare handle.
 * Before image = item.media.url, After image = item.gallery[0].url.
 */
function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  beforeLabel,
  afterLabel,
}: {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50); // percent
  const isDragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(pct);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  }, [updatePosition]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    updatePosition(e.clientX);
  }, [updatePosition]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Prevent image drag
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const prevent = (e: Event) => e.preventDefault();
    container.addEventListener('dragstart', prevent);
    return () => container.removeEventListener('dragstart', prevent);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl select-none touch-none cursor-ew-resize aspect-[4/3] md:aspect-[16/10]"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      role="slider"
      aria-label="Before and after comparison"
      aria-valuenow={Math.round(position)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') setPosition((p) => Math.max(0, p - 2));
        if (e.key === 'ArrowRight') setPosition((p) => Math.min(100, p + 2));
      }}
    >
      {/* After image (full width, behind) */}
      <div className="absolute inset-0">
        <Image
          src={afterUrl}
          alt={afterLabel || 'After'}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          draggable={false}
        />
      </div>

      {/* Before image (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <Image
          src={beforeUrl}
          alt={beforeLabel || 'Before'}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          draggable={false}
        />
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md z-10"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      />

      {/* Drag handle */}
      <div
        className="absolute top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-white/90 shadow-lg border-2 border-white backdrop-blur-sm"
        style={{ left: `${position}%` }}
      >
        <GripVertical className="h-5 w-5 text-gray-700" />
      </div>

      {/* Labels */}
      {beforeLabel && (
        <span className="absolute top-3 left-3 z-10 text-xs font-semibold text-white bg-black/50 rounded px-2 py-1 backdrop-blur-sm">
          {beforeLabel}
        </span>
      )}
      {afterLabel && (
        <span className="absolute top-3 right-3 z-10 text-xs font-semibold text-white bg-black/50 rounded px-2 py-1 backdrop-blur-sm">
          {afterLabel}
        </span>
      )}
    </div>
  );
}

/**
 * BeforeAfterSection – Drag-to-compare slider showing before and after images.
 *
 * Each BranchSectionItem represents one comparison:
 *  - media.url         → "Before" image
 *  - gallery[0].url    → "After" image
 *  - attributes: caption_before, caption_after (optional labels)
 */
export default function BeforeAfterSection({ section, locale }: BeforeAfterSectionProps) {
  const settings = (section.settings || {}) as BeforeAfterSettings;
  const items: BranchSectionItem[] = section.items || [];
  const sectionTitle = section.translations?.[locale]?.title;

  if (items.length === 0) return null;

  return (
    <SectionBackground background={settings.background} className="py-12 md:py-16">
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {sectionTitle && (
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-8 md:mb-10">
            {sectionTitle}
          </h2>
        )}

        <div className="space-y-8 md:space-y-12">
          {items.map((item) => {
            const beforeUrl = item.media?.url;
            const afterUrl = item.gallery?.[0]?.url;
            if (!beforeUrl || !afterUrl) return null;

            const captionBefore = getAttribute(item.attributes, 'caption_before');
            const captionAfter = getAttribute(item.attributes, 'caption_after');
            const caption =
              item.translations?.[locale]?.title ||
              item.translations?.en?.title ||
              '';

            return (
              <div key={item._id} className="space-y-4">
                {caption && (
                  <h3 className="text-lg font-semibold text-center">{caption}</h3>
                )}
                <BeforeAfterSlider
                  beforeUrl={beforeUrl}
                  afterUrl={afterUrl}
                  beforeLabel={captionBefore || undefined}
                  afterLabel={captionAfter || undefined}
                />
              </div>
            );
          })}
        </div>
      </div>
    </SectionBackground>
  );
}
