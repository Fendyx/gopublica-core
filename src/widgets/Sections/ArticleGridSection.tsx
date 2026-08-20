'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { BranchSection, ArticleGridSettings } from '@/entities/branch-section/types';
import { fetchPublicArticles } from '@/entities/article/api';
import type { Article } from '@/entities/article/types';
import { useTenant } from '@/entities/tenant/TenantContext';
import { Calendar } from 'lucide-react';
import { usePathname, useParams } from 'next/navigation';

interface ArticleGridSectionProps {
  section: BranchSection;
  locale: string;
  tenantDomain: string;
}

export default function ArticleGridSection({ section, locale, tenantDomain }: ArticleGridSectionProps) {
  const settings = section.settings as ArticleGridSettings;
  const translations = section.translations?.[locale] || {};
  const tenant = useTenant();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const pathname = usePathname()
  const { branchSlug } = useParams()

  useEffect(() => {
    const loadArticles = async () => {
      if (!tenant?.tenantId) return;
      try {
        const data = await fetchPublicArticles(tenant.tenantId);
        console.log('[ArticleGridSection] fetched articles:', data);
        console.log('[ArticleGridSection] settings.mode:', settings.mode);
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

  console.log('[ArticleGridSection] filtered articles:', filteredArticles);

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
{filteredArticles.map((article) => (
            <Link
              key={article._id}
              href={`/${branchSlug}/articles/${article.slug}`}
              className="group block relative"
            >
              <article className="relative h-full flex flex-col bg-card border border-border rounded-xl overflow-hidden shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:-translate-y-1">
                {article.coverImage && (
                  <div 
                    className="relative w-full shrink-0 aspect-[16/9] overflow-hidden"
                    style={{ position: 'relative', display: 'block' }}
                  >
                    <Image
                      src={article.coverImage}
                      alt={article.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
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
          ))}
        </div>
      </div>
    </section>
  );
}
