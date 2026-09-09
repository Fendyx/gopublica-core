import { BranchSection } from '@/entities/branch-section/types';
import { sectionRegistry } from './registry';
import type { MenuItem } from '@/entities/menu-item/types';

interface SectionRendererProps {
  sections: BranchSection[];
  locale: string;
  tenantDomain: string;
  branchSlug?: string;
  /** Pre-fetched dynamic items for carousel sections, keyed by section._id */
  dynamicItemsMap?: Map<string, MenuItem[]>;
  /** Pre-fetched all menu/catalog items for system sections */
  allMenuItems?: MenuItem[];
  /** Pre-fetched categories for system sections */
  categories?: Array<{ key: string; name: string; icon?: string; niche?: string; [k: string]: unknown }>;
  /** Currency symbol for price display */
  currencySymbol?: string;
}

export default function SectionRenderer({ sections, locale, tenantDomain, branchSlug, dynamicItemsMap = new Map(), allMenuItems, categories, currencySymbol = 'zł' }: SectionRendererProps) {
  const activeSections = sections
    .filter((s) => s.isActive)
    .sort((a, b) => a.order - b.order);

  return (
    <>
      {activeSections.map((section) => {
        const Component = sectionRegistry[section.type];
        const dynamicItems = dynamicItemsMap.get(section._id) || [];
        return (
          <div
            key={section._id}
            id={`section-${section._id}`}
            data-section-type={section.type}
            data-section-id={section._id}
          >
            <Component
              section={section}
              locale={locale}
              tenantDomain={tenantDomain}
              branchSlug={branchSlug}
              dynamicItems={dynamicItems}
              allMenuItems={allMenuItems}
              categories={categories}
              currencySymbol={currencySymbol}
            />
          </div>
        );
      })}
    </>
  );
}
