// src/app/[tenantDomain]/[locale]/[branchSlug]/entity/[slug]/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTenantByDomain } from '@/entities/tenant/api';
import { fetchBranchSectionItemBySlug } from '@/entities/branch-section/api';

export default async function EntityDetailPage({
  params,
}: {
  params: Promise<{ tenantDomain: string; locale: string; branchSlug: string; slug: string }>;
}) {
  const resolvedParams = await params;
  const { tenantDomain, locale, branchSlug, slug } = resolvedParams;

  const tenant = await getTenantByDomain(tenantDomain);
  if (!tenant) notFound();

  const item = await fetchBranchSectionItemBySlug(tenant.tenantId, slug);
  if (!item) notFound();

  const t = item.translations[locale] || {};

  return (
    <div className="min-h-screen bg-[var(--page-bg-color)]">
      {/* Центрированный контейнер с карточным стилем */}
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="bg-[var(--color-surface-card)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-card)] p-8 lg:p-12">
          {/* Двухколоночная сетка: 40% / 60% */}
          <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-8 lg:gap-12">
            {/* ===== ЛЕВАЯ КОЛОНКА: Визуальная и мета-информация ===== */}
            <div className="flex flex-col gap-6">
              {/* Кнопка «Назад» */}
              <Link
                href={`/${locale}/${branchSlug}`}
                className="self-start inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                ← Back
              </Link>

              {/* Главное медиа (фиксированное соотношение сторон 4:3) */}
              <div className="relative aspect-[4/3] rounded-[var(--radius-xl)] overflow-hidden shadow-[var(--shadow-card)] bg-[var(--color-surface-hover)]">
                {item.media.type === 'video' ? (
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  >
                    <source src={item.media.url} type="video/mp4" />
                  </video>
                ) : (
                  <Image
                    src={item.media.url}
                    alt={t.title ?? ''}
                    fill
                    sizes="(max-width: 768px) 40vw, 40vw"
                    className="object-cover"
                  />
                )}
              </div>

              {/* Блок атрибутов / характеристик (Specifications) */}
              {item.attributes && item.attributes.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                    Specifications
                  </h2>
                  <table className="w-full text-sm">
                    <tbody>
                      {item.attributes.map((attr, idx) => (
                        <tr key={idx}>
                          <td className="py-2 pr-4 text-[var(--color-text-tertiary)]">
                            {attr.key}
                          </td>
                          <td className="py-2 font-medium text-[var(--color-text-primary)]">
                            {attr.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ===== ПРАВАЯ КОЛОНКА: Текстовый контент ===== */}
            <div className="flex flex-col gap-6">
              {/* Заголовок */}
              {t.title && (
                <h1 className="text-4xl lg:text-5xl font-bold text-[var(--color-text-primary)] leading-tight">
                  {t.title}
                </h1>
              )}

              {/* Подзаголовок */}
              {t.subtitle && (
                <p className="text-lg text-[var(--color-text-secondary)] italic">
                  {t.subtitle}
                </p>
              )}

              {/* Основной текст (Body) */}
              {item.body && (
                <div className="prose prose-lg max-w-[650px] text-[var(--color-text-primary)] leading-relaxed">
                  <div dangerouslySetInnerHTML={{ __html: item.body }} />
                </div>
              )}

              {/* Story (существующее поле) */}
              {t.story && (
                <div className="text-lg text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
                  {t.story}
                </div>
              )}

              {/* Галерея (в нижней части правой колонки) */}
              {item.gallery && item.gallery.length > 0 && (
                <div className="mt-auto">
                  <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                    Gallery
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {item.gallery.map((media, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-[var(--radius-lg)] overflow-hidden shadow-[var(--shadow-card)] bg-[var(--color-surface-hover)]"
                      >
                        {media.type === 'video' ? (
                          <video
                            src={media.url}
                            className="absolute inset-0 w-full h-full object-cover"
                            controls
                          />
                        ) : (
                          <Image
                            src={media.url}
                            alt={`Gallery item ${idx + 1}`}
                            fill
                            sizes="(max-width: 768px) 50vw, 33vw"
                            className="object-cover"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
