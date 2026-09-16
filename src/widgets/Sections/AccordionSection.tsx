'use client';

import { BranchSection, BranchSectionItem, AccordionSettings } from '@/entities/branch-section/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import SectionBackground from './SectionBackground';
import { Plus, Minus } from 'lucide-react';

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
 * AccordionSection – renders a clean, modern FAQ-style accordion.
 *
 * Design: Google-inspired minimal FAQ with smooth expand/collapse,
 * subtle hover states, and a plus/minus icon animation.
 */
export default function AccordionSection({ section, locale }: AccordionSectionProps) {
  const settings = (section.settings || {}) as AccordionSettings;
  const items: BranchSectionItem[] = section.items || [];

  const sectionTitle = section.translations?.[locale]?.title;

  const defaultOpenValues = items
    .filter((item) => hasAttrTrue(item, 'isOpenByDefault'))
    .map((item) => item._id);

  if (items.length === 0) return null;

  return (
    <SectionBackground background={settings.background} className="py-14 md:py-20">
      {/* State-dependent icon styles via scoped CSS */}
      <style>{`
        .faq-accordion [data-state=open] .accordion-icon {
          background-color: var(--primary, oklch(0.205 0 0));
          background-color: color-mix(in srgb, var(--primary, #3b82f6) 10%, transparent);
          color: var(--primary, #3b82f6);
        }
        .faq-accordion [data-state=open] .icon-plus {
          display: none;
        }
        .faq-accordion [data-state=open] .icon-minus {
          display: block;
        }
      `}</style>

      <div className="relative z-10 w-[92%] max-w-3xl mx-auto px-4 sm:px-6">
        {/* Section title */}
        {sectionTitle && (
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
              {sectionTitle}
            </h2>
            <div className="w-12 h-0.5 bg-primary mx-auto rounded-full" />
          </div>
        )}

        <Accordion
          type="multiple"
          defaultValue={defaultOpenValues}
          className="w-full faq-accordion"
        >
          {items.map((item, index) => {
            const title =
              item.translations?.[locale]?.title ||
              item.translations?.en?.title ||
              item.slug;

            const content =
              item.bodyI18n?.[locale] ||
              item.bodyI18n?.en ||
              item.body ||
              '';

            const isFirst = index === 0;
            const isLast = index === items.length - 1;

            return (
              <AccordionItem
                key={item._id}
                value={item._id}
                className={`
                  group/item border-t border-border/60
                  ${isFirst ? 'border-t-0' : ''}
                  ${isLast ? 'border-b' : ''}
                `}
              >
                <AccordionTrigger
                  className="
                    text-left text-[15px] md:text-base font-medium
                    py-5 md:py-5 px-1
                    hover:no-underline
                    transition-all duration-150
                    hover:bg-foreground/[0.02] dark:hover:bg-foreground/[0.04]
                    hover:px-3 rounded-lg
                    gap-4
                    [&[data-state=open]]:text-primary
                    [&[data-state=open]]:px-3
                  "
                  icon={
                    <span className="
                      accordion-icon
                      flex items-center justify-center
                      w-7 h-7 shrink-0
                      rounded-full
                      bg-muted/70
                      transition-all duration-200
                    ">
                      <Plus
                        size={14}
                        strokeWidth={2.5}
                        className="icon-plus transition-transform duration-200"
                      />
                      <Minus
                        size={14}
                        strokeWidth={2.5}
                        className="icon-minus transition-transform duration-200 hidden"
                      />
                    </span>
                  }
                >
                  {title}
                </AccordionTrigger>
                <AccordionContent className="px-1 pb-5 pt-0">
                  {content ? (
                    <div
                      className="
                        text-sm md:text-[15px] text-muted-foreground leading-relaxed
                        prose prose-sm dark:prose-invert max-w-none
                        prose-p:text-muted-foreground prose-p:leading-relaxed
                        prose-a:text-primary prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-primary/80
                        prose-strong:text-foreground prose-strong:font-semibold
                        prose-ul:list-disc prose-ol:list-decimal
                        prose-li:marker:text-muted-foreground/50
                        prose-li:py-0.5
                      "
                      dangerouslySetInnerHTML={{ __html: content }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground/60 italic">—</p>
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
