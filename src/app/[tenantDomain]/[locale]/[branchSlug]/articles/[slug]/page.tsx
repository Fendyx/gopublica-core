// src/app/[tenantDomain]/[locale]/[branchSlug]/articles/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Image from 'next/image';
import { fetchPublicArticleBySlug } from '@/entities/article/api';
import { getTenantByDomain } from '@/entities/tenant/api';
import { Link } from '@/i18n/routing';
import { Button } from '@/shared/ui/Button';
import { TicketCard } from '@/widgets/Article/TicketCard';

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ tenantDomain: string; locale: string; branchSlug: string; slug: string }>;
}) {
  const resolvedParams = await params;
  const headersList = await headers();
  const host = headersList.get('host') ?? resolvedParams.tenantDomain;
  const tenant = await getTenantByDomain(host);

  if (!tenant) {
    notFound();
  }

  const article = await fetchPublicArticleBySlug(
    tenant.tenantId,
    resolvedParams.slug
  ).catch((err) => {
    console.error('FETCH ERROR:', err);
    return null;
  });

  console.log('FRONTEND PAGE DEBUG:', {
    passedSlug: resolvedParams.slug,
    resolvedTenantId: tenant?.tenantId,
    articleFound: !!article,
  });

  if (!article) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href={`/${resolvedParams.branchSlug}`}>
          <Button variant="outline">← Back to Home</Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left column - Article content */}
        <div className="lg:col-span-2">
          {article.coverImage && (
            <div className="relative w-full h-96 rounded-xl mb-8 overflow-hidden">
              <Image
                src={article.coverImage}
                alt={article.title}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
              />
            </div>
          )}
          <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
          <div className="flex items-center text-gray-500 mb-8 space-x-4">
            {article.author && <span>By {article.author}</span>}
            {article.publishedAt && (
              <span>
                {new Date(article.publishedAt).toLocaleDateString(resolvedParams.locale)}
              </span>
            )}
          </div>
          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: article.body }}
          />
        </div>

        {/* Right column - Ticket Card */}
        <div className="lg:col-span-1">
          <TicketCard article={article} />
        </div>
      </div>
    </div>
  );
}
