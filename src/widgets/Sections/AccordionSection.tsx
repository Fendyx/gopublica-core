'use client';

import { BranchSection, BranchSectionItem, AccordionSettings } from '@/entities/branch-section/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import SectionBackground from './SectionBackground';

interface AccordionSectionProps {
  section: BranchSection;
  locale: string;
  tenantDomain: string;
  branchSlug?: string;
}

/** Check if an attribute key exists with value 'true' */
function hasAttrTrue(item: BranchSectionItem, key: string): boolean {
  return item.attributes?.some((a) => a.key === key && a.value === 'true') ?? false;
}

/**
 * AccordionSection – renders a list of expandable FAQ-style items.
 *
 * Each item is a BranchSectionItem with:
 *  - title  → item.translations?.[locale]?.title  (fallback: en, then slug)
 *  - body   → item.bodyI18n?.[locale] || item.body (HTML from TipTap)
 */
export default function AccordionSection({ section, locale }: AccordionSectionProps) {
  const settings = (section.settings || {}) as AccordionSettings;
  const items: BranchSectionItem[] = section.items || [];

  const sectionTitle = section.translations?.[locale]?.title;

  // Items that should be open on initial load
  const defaultOpenValues = items
    .filter((item) => hasAttrTrue(item, 'isOpenByDefault'))
    .map((item) => item._id);

  if (items.length === 0) return null;

  return (
    <SectionBackground background={settings.background} className="py-12 md:py-16">
      <div className="relative z-10 w-[90%] max-w-4xl mx-auto px-4 sm:px-6">
        {sectionTitle && (
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-8 md:mb-10">
            {sectionTitle}
          </h2>
        )}

        <Accordion
          type="multiple"
          defaultValue={defaultOpenValues}
          className="w-full space-y-3"
        >
          {items.map((item) => {
            const title =
              item.translations?.[locale]?.title ||
              item.translations?.en?.title ||
              item.slug;

            const content =
              item.bodyI18n?.[locale] ||
              item.bodyI18n?.en ||
              item.body ||
              '';

            return (
              <AccordionItem
                key={item._id}
                value={item._id}
                className="rounded-lg border-none px-4 md:px-6 [&[data-slot=accordion-item]]:border-0"
              >
                <AccordionTrigger className="text-left text-base md:text-lg font-medium py-4 hover:no-underline">
                  {title}
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  {content ? (
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none
                        prose-p:text-muted-foreground prose-p:leading-relaxed
                        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                        prose-strong:font-semibold
                        prose-ul:list-disc prose-ol:list-decimal
                        prose-li:marker:text-primary"
                      dangerouslySetInnerHTML={{ __html: content }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </SectionBackground>
  );
}
