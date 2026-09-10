'use client';

import Image from 'next/image';
import { useRef, useState, useEffect, useMemo } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { BranchSection, BranchSectionItem, LogoTickerSettings } from '@/entities/branch-section/types';
import SectionBackground from './SectionBackground';

interface LogoTickerSectionProps {
  section: BranchSection;
  locale: string;
  tenantDomain: string;
  branchSlug?: string;
}

function getAttribute(items: { key: string; value: string }[] | undefined, key: string): string {
  return items?.find((a) => a.key === key)?.value || '';
}

/**
 * LogoTickerSection – Infinite scrolling marquee of partner/client logos.
 *
 * Each BranchSectionItem represents one logo:
 *  - media.url         → logo image
 *  - attributes: link_url (optional external link)
 *
 * Animation powered by Framer Motion. Hover pauses the scroll.
 */
export default function LogoTickerSection({ section, locale }: LogoTickerSectionProps) {
  const settings = (section.settings || {}) as LogoTickerSettings;
  const items: BranchSectionItem[] = section.items || [];

  const speed = settings.speed ?? 30;
  const pauseOnHover = settings.pauseOnHover !== false;
  const grayscaleOnIdle = settings.grayscaleOnIdle ?? false;

  const sectionTitle = section.translations?.[locale]?.title;

  const controls = useAnimationControls();
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Measure the width of one set of logos (not the duplicated ones)
  useEffect(() => {
    if (!trackRef.current) return;
    // The first half of children is one set; measure its width
    const children = trackRef.current.children;
    if (children.length === 0) return;

    // We duplicate items 3x, so total children = items.length * 3
    // One set width = total width / 3
    const totalWidth = trackRef.current.scrollWidth;
    const oneSetWidth = totalWidth / 3;
    setTrackWidth(oneSetWidth);
  }, [items.length]);

  // Calculate animation duration from speed (px/s)
  const duration = useMemo(() => {
    if (trackWidth <= 0 || speed <= 0) return 20;
    return trackWidth / speed;
  }, [trackWidth, speed]);

  // Start/stop animation based on hover state
  useEffect(() => {
    if (trackWidth <= 0) return;

    if (isPaused && pauseOnHover) {
      controls.stop();
    } else {
      controls.start({
        x: [0, -trackWidth],
        transition: {
          x: {
            duration,
            ease: 'linear',
            repeat: Infinity,
          },
        },
      });
    }
  }, [isPaused, pauseOnHover, controls, trackWidth, duration]);

  // Restart animation when speed changes
  useEffect(() => {
    if (trackWidth <= 0) return;
    if (isPaused && pauseOnHover) return;

    controls.start({
      x: [0, -trackWidth],
      transition: {
        x: {
          duration,
          ease: 'linear',
          repeat: Infinity,
        },
      },
    });
  }, [duration, trackWidth, controls, isPaused, pauseOnHover]);

  if (items.length === 0) return null;

  // Triple the items for seamless infinite loop
  const tripledItems = [...items, ...items, ...items];

  return (
    <SectionBackground background={settings.background} className="py-10 md:py-14 overflow-hidden">
      <div className="relative z-10">
        {sectionTitle && (
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-8 px-4">
            {sectionTitle}
          </h2>
        )}

        <div
          className="relative"
          onMouseEnter={() => pauseOnHover && setIsPaused(true)}
          onMouseLeave={() => pauseOnHover && setIsPaused(false)}
        >
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          <motion.div
            ref={trackRef}
            animate={controls}
            className="flex items-center gap-8 md:gap-12 w-max"
          >
            {tripledItems.map((item, i) => {
              const logoUrl = item.media?.url;
              if (!logoUrl) return null;

              const linkUrl = getAttribute(item.attributes, 'link_url');
              const altText =
                item.translations?.[locale]?.title ||
                item.translations?.en?.title ||
                'Partner logo';

              const logoElement = (
                <div
                  className={`relative h-10 md:h-12 w-24 md:w-32 shrink-0 flex items-center justify-center ${
                    grayscaleOnIdle && !isPaused
                      ? 'grayscale hover:grayscale-0 transition-[filter] duration-300'
                      : ''
                  }`}
                >
                  <Image
                    src={logoUrl}
                    alt={altText}
                    fill
                    className="object-contain"
                    sizes="128px"
                    draggable={false}
                  />
                </div>
              );

              return linkUrl ? (
                <a
                  key={`${item._id}-${i}`}
                  href={linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block shrink-0"
                >
                  {logoElement}
                </a>
              ) : (
                <div key={`${item._id}-${i}`} className="shrink-0">
                  {logoElement}
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </SectionBackground>
  );
}
