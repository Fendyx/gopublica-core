'use client';
import Image from 'next/image';
import type { SectionBackground as SectionBackgroundType } from '@/entities/branch-section/types';

interface SectionBackgroundProps {
  /** Background configuration. If undefined or type='none', renders only children. */
  background?: SectionBackgroundType;
  /** Section content. If omitted, renders only the background layer (for use inside a relative parent). */
  children?: React.ReactNode;
  /** Optional extra className on the wrapper */
  className?: string;
}

/** Gradient direction enum → CSS value */
const gradientDirMap: Record<string, string> = {
  'to-r': 'to right',
  'to-br': 'to bottom right',
  'to-b': 'to bottom',
  'to-bl': 'to bottom left',
  'to-l': 'to left',
};

/**
 * Renders a universal background layer for any section.
 *
 * Supports:
 * - none: no background (renders children only)
 * - color: solid hex color
 * - gradient: linear-gradient with two colors and direction
 * - image: Cloudinary image with object-fit
 * - video: HTML5 video with object-fit
 *
 * An optional overlay (solid color + opacity) can be placed on top of
 * color/gradient/image/video backgrounds for contrast.
 */
export default function SectionBackground({ background, children, className }: SectionBackgroundProps) {
  const type = background?.type || 'none';

  if (type === 'none' || !background) {
    return children ? <>{children}</> : null;
  }

  const overlayOpacity = background.overlayOpacity ?? 0;
  const overlayColor = background.overlayColor || '#000000';
  const hasOverlay = overlayOpacity > 0;
  const objectFit = background.mediaFit || 'cover';

  const backgroundLayer = (
    <>
      {/* Solid color */}
      {type === 'color' && background.color && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: background.color }}
        />
      )}

      {/* Gradient */}
      {type === 'gradient' && background.gradient && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(${gradientDirMap[background.gradient.direction] || 'to right'}, ${background.gradient.from}, ${background.gradient.to})`,
          }}
        />
      )}

      {/* Image */}
      {type === 'image' && background.imageUrl && (
        <Image
          src={background.imageUrl}
          alt=""
          fill
          sizes="100vw"
          className={`absolute inset-0 w-full h-full object-${objectFit}`}
          priority
        />
      )}

      {/* Video */}
      {type === 'video' && background.videoUrl && (
        <video
          autoPlay
          muted
          loop
          playsInline
          className={`absolute inset-0 w-full h-full object-${objectFit}`}
        >
          <source src={background.videoUrl} type="video/mp4" />
        </video>
      )}

      {/* Overlay */}
      {hasOverlay && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: overlayColor,
            opacity: overlayOpacity / 100,
          }}
        />
      )}
    </>
  );

  // Standalone mode: no children → render just the absolute background layer
  // Use inside a <section className="relative ..."> for full-bleed backgrounds
  if (!children) {
    return (
      <div className={`absolute inset-0 overflow-hidden ${className || ''}`} aria-hidden="true">
        {backgroundLayer}
      </div>
    );
  }

  // Wrapper mode: wraps children in a relative container
  return (
    <div className={`relative ${className || ''}`}>
      {/* ─── Background Layer (absolute, fills container) ─── */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {backgroundLayer}
      </div>

      {/* ─── Content Layer ─── */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
