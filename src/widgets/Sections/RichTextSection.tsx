'use client';

import { BranchSection, RichTextSettings } from '@/entities/branch-section/types';

interface RichTextSectionProps {
  section: BranchSection;
  locale: string;
  tenantDomain: string;
  branchSlug?: string;
}

/**
 * RichTextSection — renders TipTap-authored HTML content with proper
 * typography styling. Supports multi-language via translations and
 * per-locale content in settings.contentI18n.
 */
export default function RichTextSection({ section, locale }: RichTextSectionProps) {
  const settings = (section.settings || {}) as RichTextSettings;

  // Resolve content for the current locale: check contentI18n first, then base content
  const htmlContent = settings.contentI18n?.[locale] || settings.content || '';

  if (!htmlContent) return null;

  return (
    <section className="py-8 md:py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div
          className="prose prose-slate dark:prose-invert
            prose-headings:scroll-mt-20
            prose-h1:text-3xl prose-h1:font-bold prose-h1:tracking-tight
            prose-h2:text-2xl prose-h2:font-semibold
            prose-h3:text-xl prose-h3:font-semibold
            prose-p:text-base prose-p:leading-relaxed
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-strong:font-semibold
            prose-img:rounded-xl prose-img:shadow-md
            prose-pre:bg-muted prose-pre:border
            prose-blockquote:border-l-primary prose-blockquote:italic
            prose-li:marker:text-primary
            max-w-none"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </section>
  );
}
