'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { BranchSection, BranchSectionItem, TestimonialsSettings } from '@/entities/branch-section/types';
import SectionBackground from './SectionBackground';

interface TestimonialsSectionProps {
  section: BranchSection;
  locale: string;
  tenantDomain: string;
  branchSlug?: string;
}

function getAttribute(items: { key: string; value: string }[] | undefined, key: string): string {
  return items?.find((a) => a.key === key)?.value || '';
}

function StarRating({ rating, show }: { rating: number; show: boolean }) {
  if (!show || rating < 1) return null;
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'
          }`}
        />
      ))}
    </div>
  );
}

/**
 * TestimonialsSection – Carousel of customer reviews with ratings and avatars.
 *
 * Each BranchSectionItem represents one testimonial:
 *  - media.url         → avatar image
 *  - translations[locale].title → review text
 *  - attributes: author_name, rating (1-5), link_url
 */
export default function TestimonialsSection({ section, locale }: TestimonialsSectionProps) {
  const settings = (section.settings || {}) as TestimonialsSettings;
  const items: BranchSectionItem[] = section.items || [];

  const autoplay = settings.autoplay !== false;
  const autoplayDelay = settings.autoplayDelay ?? 5000;
  const showRating = settings.showRating !== false;
  const cardStyle = settings.cardStyle || 'card';

  const sectionTitle = section.translations?.[locale]?.title;

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: items.length > 1, align: 'start' },
    autoplay
      ? [Autoplay({ delay: autoplayDelay, stopOnInteraction: false, stopOnMouseEnter: true })]
      : [],
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [snapCount, setSnapCount] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    // Dots follow carousel snap points (accounts for multiple slides per view)
    setSnapCount(emblaApi.scrollSnapList().length);
    const onReInit = () => {
      onSelect();
      setSnapCount(emblaApi.scrollSnapList().length);
    };
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onReInit);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onReInit);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (items.length === 0) return null;

  return (
    <SectionBackground background={settings.background} className="py-12 md:py-16">
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          {sectionTitle && (
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{sectionTitle}</h2>
          )}
          {items.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={scrollPrev}
                disabled={!canScrollPrev}
                className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-background border border-border text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={scrollNext}
                disabled={!canScrollNext}
                className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-background border border-border text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Carousel */}
        <div ref={emblaRef} className="overflow-hidden cursor-grab active:cursor-grabbing">
          <div className="flex items-stretch -ml-4 md:-ml-6">
            {items.map((item) => {
              const reviewHtml =
                item.bodyI18n?.[locale] ||
                item.bodyI18n?.en ||
                item.body ||
                '';
              const authorName = getAttribute(item.attributes, 'author_name') || item.translations?.[locale]?.title || item.translations?.en?.title || '';
              const rating = parseInt(getAttribute(item.attributes, 'rating'), 10) || 0;
              const linkUrl = getAttribute(item.attributes, 'link_url');
              const avatarUrl = item.media?.url;

              const cardContent = (
                <div
                  className={`h-full w-full ${
                    cardStyle === 'card'
                      ? 'flex h-full flex-col rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md'
                      : cardStyle === 'quote'
                        ? 'flex h-full flex-col rounded-xl border-l-4 border-primary bg-card/50 p-6 pl-8'
                        : 'flex h-full flex-col p-4'
                  }`}
                >
                  {/* Quote icon for 'quote' style */}
                  {cardStyle === 'quote' && (
                    <Quote className="h-6 w-6 text-primary/30 mb-3" />
                  )}

                  {/* Rating */}
                  <StarRating rating={rating} show={showRating} />

                  {/* Review text – grows to push author row to card bottom */}
                  {(reviewHtml && reviewHtml.includes('<')) ? (
                    <div
                      className={`flex-1 text-foreground leading-relaxed text-sm md:text-base ${
                        cardStyle === 'card' ? 'mt-3' : cardStyle === 'quote' ? 'mt-2 italic' : 'mt-2'
                      } [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_b]:font-semibold [&_i]:italic`}
                      dangerouslySetInnerHTML={{ __html: reviewHtml }}
                    />
                  ) : reviewHtml ? (
                    <p className={`flex-1 text-foreground leading-relaxed text-sm md:text-base ${
                      cardStyle === 'card' ? 'mt-3' : cardStyle === 'quote' ? 'mt-2 italic' : 'mt-2'
                    }`}>
                      {reviewHtml}
                    </p>
                  ) : (
                    <div className="flex-1" />
                  )}

                  {/* Author */}
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/60">
                    {avatarUrl && (
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                        <Image
                          src={avatarUrl}
                          alt={authorName || 'Avatar'}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                    )}
                    {authorName && (
                      <span className="text-sm font-medium text-foreground">{authorName}</span>
                    )}
                  </div>
                </div>
              );

              return linkUrl ? (
                <a
                  key={item._id}
                  href={linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-[0_0_100%] min-w-0 pl-4 md:pl-6 sm:flex-[0_0_50%] lg:flex-[0_0_33.333%]"
                >
                  {cardContent}
                </a>
              ) : (
                <div
                  key={item._id}
                  className="flex-[0_0_100%] min-w-0 pl-4 md:pl-6 sm:flex-[0_0_50%] lg:flex-[0_0_33.333%]"
                >
                  {cardContent}
                </div>
              );
            })}
          </div>
        </div>

        {/* Dots – one per carousel snap point */}
        {items.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: snapCount || items.length }).map((_, i) => (
              <button
                key={i}
                onClick={() => emblaApi?.scrollTo(i)}
                className={`h-2 rounded-full transition-all ${
                  i === selectedIndex ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </SectionBackground>
  );
}
