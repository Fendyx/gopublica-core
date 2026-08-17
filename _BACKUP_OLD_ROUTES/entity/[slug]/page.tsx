import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTenantByDomain } from '@/entities/tenant/api';
import { fetchBranchSectionItemBySlug } from '@/entities/branch-section/api';

export default async function EntityDetailPage({
  params,
}: {
  params: Promise<{ tenantDomain: string; locale: string; slug: string }>;
}) {
  const resolvedParams = await params;
  const { tenantDomain, locale, slug } = resolvedParams;

  console.log('--- ENTITY PAGE DEBUG ---');

  const tenant = await getTenantByDomain(tenantDomain);
  console.log('Tenant:', tenant);
  if (!tenant) notFound();

  console.log('Item fetching with slug:', slug);
  const item = await fetchBranchSectionItemBySlug(tenant.tenantId, slug);
  console.log('Item result:', item);
  if (!item) notFound();

  const t = item.translations[locale] || {};

  return (
    <div className="min-h-screen bg-[var(--page-bg-color)]">
      <div className="max-w-3xl mx-auto py-12 px-4">
        <Link
          href={`/${locale}`}
          className="inline-block mb-6 text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back
        </Link>

        {/* Hero Section */}
        <div className="mb-8">
          {item.media.type === 'video' ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full rounded-2xl"
            >
              <source src={item.media.url} type="video/mp4" />
            </video>
          ) : (
            <img
              src={item.media.url}
              alt={t.title ?? ''}
              className="w-full rounded-2xl"
            />
          )}
        </div>

        {t.title && <h1 className="text-4xl font-bold mb-4">{t.title}</h1>}
        {t.subtitle && (
          <p className="text-gray-600 text-lg mb-6">{t.subtitle}</p>
        )}

        {/* Attributes / Specifications Block */}
        {item.attributes && item.attributes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Specifications</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {item.attributes.map((attr, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 bg-muted/30 rounded-lg"
                >
                  <span className="text-sm text-gray-600">{attr.key}</span>
                  <span className="text-sm font-medium">{attr.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Article / Body Content */}
        {item.body && (
          <div className="mb-8">
            <div
              className="prose prose-lg max-w-none text-lg leading-relaxed whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: item.body }}
            />
          </div>
        )}

        {/* Gallery Section */}
        {item.gallery && item.gallery.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Gallery</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {item.gallery.map((media, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-xl overflow-hidden bg-muted/30"
                >
                  {media.type === 'video' ? (
                    <video
                      src={media.url}
                      className="w-full h-full object-cover"
                      controls
                    />
                  ) : (
                    <img
                      src={media.url}
                      alt={`Gallery item ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Story (existing field) */}
        {t.story && (
          <div className="mt-8 text-lg leading-relaxed whitespace-pre-wrap">
            {t.story}
          </div>
        )}
      </div>
    </div>
  );
}
