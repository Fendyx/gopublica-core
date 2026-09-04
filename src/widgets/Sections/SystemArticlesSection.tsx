'use client';
import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { BranchSection } from '@/entities/branch-section/types';
import { useTenant } from '@/entities/tenant/TenantContext';
import type { Article } from '@/entities/article/types';
import { Calendar } from 'lucide-react';
import Image from 'next/image';

interface SystemArticlesSectionProps {
  section: BranchSection;
  locale: string;
  tenantDomain: string;
  branchSlug?: string;
}

export default function SystemArticlesSection({ section, locale, branchSlug }: SystemArticlesSectionProps) {
  const tenant = useTenant();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const tenantId = tenant?.tenantId;

  useEffect(() => {
    if (!tenantId) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/articles?tenantId=${tenantId}`)
      .then(r => r.json())
      .then(data => {
        setArticles(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tenantId]);

  if (loading) {
    return <div className="py-10 text-center text-muted-foreground">Loading articles…</div>;
  }

  if (!articles.length) return null;

  return (
    <section className="py-10 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold mb-8 text-foreground">Articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <Link
              key={article._id}
              href={`/${locale}/${branchSlug}/articles/${article.slug}`}
              className="group block rounded-xl overflow-hidden border bg-card hover:shadow-lg transition-shadow"
            >
              {article.coverImage && (
                <div className="aspect-video relative overflow-hidden">
                  <Image
                    src={article.coverImage}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                  {article.title}
                </h3>
                {article.publishedAt && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{new Date(article.publishedAt).toLocaleDateString(locale)}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
