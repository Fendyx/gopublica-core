'use client';
import Image from 'next/image';
import { useEffect, useState, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import useEmblaCarousel from 'embla-carousel-react';
import AutoPlay from 'embla-carousel-autoplay';
import { BranchSection, ArticleGridSettings } from '@/entities/branch-section/types';
import { fetchPublicArticles } from '@/entities/article/api';
import type { Article } from '@/entities/article/types';
import { useTenant } from '@/entities/tenant/TenantContext';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePathname, useParams } from 'next/navigation';

interface ArticleGridSectionProps {
  section: BranchSection;
  locale: string;
  tenantDomain: string;
}

// Tailwind-safe aspect ratio mapping
const aspectMap: Record<string, string> = {
  '16:9': 'aspect-video',
  '4:3': 'aspect-[4/3]',
  '1:1': 'aspect-square',
  '9:16': 'aspect-[9/16]',
};

// Tailwind-safe grid columns mapping
const gridColsMap: Record<number, string> = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
};

// Tailwind-safe carousel flex basis mapping
const carouselBasisMap: Record<number, string> = {
  2: 'lg:flex-[0_0_50%]',
  3: 'lg:flex-[0_0_33.333%]',
  4: 'lg:flex-[0_0_25%]',
  5: 'lg:flex-[0_0_20%]',
};

/**
 * Reusable Article Card component supporting both 'default' and 'overlay' variants.
 */
function ArticleCard({
  article,
  aspectRatio,
  cardVariant,
  locale,
  href,
}: {
  article: Article;
  aspectRatio: string;
  cardVariant: 'default' | 'overlay';
  locale: string;
  href: string;
}) {
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (cardVariant === 'overlay') {
    return (
      <Link
        href={href}
        className="group block relative"
      >
        <div className={`relative w-full shrink-0 ${aspectMap[aspectRatio]} overflow-hidden rounded-xl`}>
          {article.videoUrl ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
              poster={article.coverImage || undefined}
            >
              <source src={article.videoUrl} type="video/mp4" />
            </video>
          ) : article.coverImage ? (
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : null}
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          {/* Text positioned over image */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h3 className="text-xl font-bold mb-2 drop-shadow-lg group-hover:text-white/90 transition-colors">
              {article.title}
            </h3>
            {article.author && (
              <p className="text-sm text-white/80 mb-1 drop-shadow">
                By {article.author}
              </p>
            )}
            {article.publishedAt && (
              <div className="flex items-center gap-1 text-xs text-white/60 mb-2 drop-shadow">
                <Calendar className="w-3 h-3" />
                {formatDate(article.publishedAt)}
              </div>
            )}
            {article.seoDescription && (
              <p className="text-sm text-white/90 mt-2 line-clamp-3 drop-shadow">
                {article.seoDescription}
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Default variant: white card with image on top, text below
  return (
    <Link
      href={href}
      className="group block relative"
    >
      <article className="relative flex flex-col bg-card border border-border rounded-xl overflow-hidden shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:-translate-y-1">
        {/* Image / Video wrapper — no height class so aspect ratio dictates height */}
        <div className={`relative w-full shrink-0 ${aspectMap[aspectRatio]} overflow-hidden`}>
          {article.videoUrl ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
              poster={article.coverImage || undefined}
            >
              <source src={article.videoUrl} type="video/mp4" />
            </video>
          ) : article.coverImage ? (
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : null}
        </div>
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>
          {article.author && (
            <p className="text-sm text-muted-foreground mb-2">
              By {article.author}
            </p>
          )}
          {article.publishedAt && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
              <Calendar className="w-3 h-3" />
              {formatDate(article.publishedAt)}
            </div>
          )}
          {article.seoDescription && (
            <p className="text-sm text-muted-foreground mt-auto line-clamp-3">
              {article.seoDescription}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}

/**
 * Carousel layout wrapper using Embla Carousel.
 */
function ArticleCarouselLayout({
  articles,
  aspectRatio,
  cardVariant,
  locale,
  branchSlug,
  itemsPerRow,
}: {
  articles: Article[];
  aspectRatio: string;
  cardVariant: 'default' | 'overlay';
  locale: string;
  branchSlug: string;
  itemsPerRow: number;
}) {
  const plugins = [AutoPlay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true })];
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' }, plugins);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <div className="relative">
      {/* Navigation buttons */}
      <div className="flex justify-end gap-2 mb-4">
        <button
          onClick={scrollPrev}
          className="p-2 rounded-full border border-border hover:bg-muted transition-colors"
          aria-label="Previous articles"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={scrollNext}
          className="p-2 rounded-full border border-border hover:bg-muted transition-colors"
          aria-label="Next articles"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="overflow-hidden -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8" ref={emblaRef}>
        <div className="flex gap-6 pb-4">
          {articles.map((article, index) => (
            <div
              key={`${article._id}-${index}`}
              className={`min-w-0 shrink-0 grow-0 w-full sm:w-1/2 ${carouselBasisMap[itemsPerRow]}`}
            >
              <ArticleCard
                article={article}
                aspectRatio={aspectRatio}
                cardVariant={cardVariant}
                locale={locale}
                href={`/${branchSlug}/articles/${article.slug}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ArticleGridSection({ section, locale, tenantDomain }: ArticleGridSectionProps) {
  const settings = section.settings as ArticleGridSettings;
  const translations = section.translations?.[locale] || {};
  const tenant = useTenant();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const pathname = usePathname();
  const { branchSlug } = useParams();

  // Extract new settings with defaults
  const layoutMode = settings.layoutMode || 'grid';
  const aspectRatio = settings.aspectRatio || '16:9';
  const cardVariant = settings.cardVariant || 'default';
  const itemsPerRow = settings.itemsPerRow || 3;

  useEffect(() => {
    const loadArticles = async () => {
      if (!tenant?.tenantId) return;
      try {
        const data = await fetchPublicArticles(tenant.tenantId);
        setArticles(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadArticles();
  }, [tenant?.tenantId, pathname]);

  const mode = settings.mode || 'latest';
  const limit = settings.limit ?? 3;
  const selectedSlugs = Array.isArray(settings.selectedSlugs) ? settings.selectedSlugs : [];

  const filteredArticles = mode === 'latest'
    ? articles.slice(0, limit)
    : articles.filter((a) => selectedSlugs.includes(a.slug));

  if (loading) {
    return (
      <div className="py-10 text-center">Loading articles...</div>
    );
  }

  if (filteredArticles.length === 0) {
    return (
      <div className="py-10 text-center">No articles found to display.</div>
    );
  }

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {(translations.title || translations.subtitle) && (
          <div className="text-center mb-8">
            {translations.title && (
              <h2 className="text-3xl font-bold mb-2">{translations.title}</h2>
            )}
            {translations.subtitle && (
              <p className="text-gray-600">{translations.subtitle}</p>
            )}
          </div>
        )}

        {layoutMode === 'grid' ? (
          /* ─── CSS Grid Layout ─── */
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridColsMap[itemsPerRow]} gap-6 md:gap-8`}>
            {filteredArticles.map((article) => (
              <ArticleCard
                key={article._id}
                article={article}
                aspectRatio={aspectRatio}
                cardVariant={cardVariant}
                locale={locale}
                href={`/${branchSlug}/articles/${article.slug}`}
              />
            ))}
          </div>
        ) : (
          /* ─── Embla Carousel Layout ─── */
          <ArticleCarouselLayout
            articles={filteredArticles}
            aspectRatio={aspectRatio}
            cardVariant={cardVariant}
            locale={locale}
            branchSlug={branchSlug as string}
            itemsPerRow={itemsPerRow}
          />
        )}
      </div>
    </section>
  );
}
