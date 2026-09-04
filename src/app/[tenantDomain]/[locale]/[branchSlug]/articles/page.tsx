import { headers } from 'next/headers';
import { getTenantByDomain } from '@/entities/tenant/api';
import { fetchBranchBySlug } from '@/entities/branch/api';
import { fetchPublicBranchSections } from '@/entities/branch-section/api';
import { fetchMenu } from '@/entities/menu-item/api';
import SectionRenderer from '@/widgets/Sections/SectionRenderer';
import type { Branch } from '@/entities/branch/types';
import type { BranchSection, EntityCarouselSettings, FeatureCarouselSettings } from '@/entities/branch-section/types';
import type { MenuItem } from '@/entities/menu-item/types';

export const dynamic = 'force-dynamic';

async function resolveDynamicItems(
  tenantId: string,
  branchId: string,
  sections: BranchSection[]
): Promise<Map<string, MenuItem[]>> {
  const dynamicSections = sections.filter((section) => {
    if (section.type !== 'entity_carousel' && section.type !== 'feature_carousel') return false;
    const settings = (section.settings || {}) as EntityCarouselSettings | FeatureCarouselSettings;
    return settings.mode === 'ecommerce' || settings.mode === 'menu';
  });

  if (dynamicSections.length === 0) return new Map();

  let allItems: MenuItem[] = [];
  try {
    allItems = await fetchMenu(tenantId, branchId);
  } catch (err) {
    console.error('[articles] fetchMenu failed:', err);
    return new Map();
  }

  const itemsMap = new Map<string, MenuItem[]>();
  for (const section of dynamicSections) {
    const settings = (section.settings || {}) as EntityCarouselSettings | FeatureCarouselSettings;
    const selectionMode = settings.selectionMode || 'items';
    const selectedProductIds = settings.selectedProductIds || [];
    const selectedMenuItemIds = settings.selectedMenuItemIds || [];
    const selectedCategoryKeys = settings.selectedCategoryKeys || [];

    let filtered: MenuItem[];
    if (selectionMode === 'categories' && selectedCategoryKeys.length > 0) {
      filtered = allItems.filter((item) => {
        const itemCategory = item.categoryKey || item.category || '';
        return selectedCategoryKeys.includes(itemCategory);
      });
    } else {
      const ids = settings.mode === 'ecommerce' ? selectedProductIds : selectedMenuItemIds;
      filtered = allItems.filter((item) => ids.includes(item._id || item.id || ''));
    }
    itemsMap.set(section._id, filtered);
  }
  return itemsMap;
}

export default async function ArticlesPage({
  params,
}: {
  params: Promise<{ tenantDomain: string; locale: string; branchSlug: string }>;
}) {
  const { locale, tenantDomain, branchSlug } = await params;
  const headersList = await headers();
  const host = headersList.get('host') ?? tenantDomain;
  const tenant = await getTenantByDomain(host);

  if (!tenant) {
    return <div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Site not found</h1></div>;
  }

  let branch: Branch | null = null;
  try {
    branch = await fetchBranchBySlug(tenant.tenantId, branchSlug);
  } catch (err) {
    console.error('[articles] fetchBranchBySlug failed:', err);
  }

  const branchId = branch?._id ?? branchSlug;

  let sections: BranchSection[] = [];
  try {
    sections = await fetchPublicBranchSections(tenant.tenantId, branchId, 'articles');
  } catch (err) {
    console.error('[articles] fetchPublicBranchSections failed:', err);
  }

  // If no sections configured, show fallback with system_articles-style listing
  if (!sections || sections.length === 0) {
    // Fallback: render with empty sections — SystemArticlesSection handles its own data
    return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Articles</h1>
          <p className="text-muted-foreground">No articles available yet.</p>
        </div>
      </section>
    );
  }

  const dynamicItemsMap = await resolveDynamicItems(tenant.tenantId, branchId, sections);

  return (
    <SectionRenderer
      sections={sections}
      locale={locale}
      tenantDomain={tenantDomain}
      branchSlug={branchSlug}
      dynamicItemsMap={dynamicItemsMap}
    />
  );
}
