// src/app/[tenantDomain]/[locale]/[branchSlug]/page.tsx
import { headers } from 'next/headers';
import { getTenantByDomain } from '@/entities/tenant/api';
import { fetchBranchBySlug } from '@/entities/branch/api';
import { fetchPublicBranchSections } from '@/entities/branch-section/api';
import { fetchMenu } from '@/entities/menu-item/api';
import SectionRenderer from '@/widgets/Sections/SectionRenderer';
import type { Branch } from '@/entities/branch/types';
import type { BranchSection, EntityCarouselSettings, FeatureCarouselSettings } from '@/entities/branch-section/types';
import type { MenuItem } from '@/entities/menu-item/types';

/**
 * Resolves dynamic items for carousel sections that use 'ecommerce' or 'menu' mode.
 * Fetches the full menu once per branch and filters according to section settings.
 */
async function resolveDynamicItems(
  tenantId: string,
  branchId: string,
  sections: BranchSection[]
): Promise<Map<string, MenuItem[]>> {
  // Collect all dynamic carousel sections that need menu data
  const dynamicSections = sections.filter((section) => {
    if (section.type !== 'entity_carousel' && section.type !== 'feature_carousel') return false;
    const settings = (section.settings || {}) as EntityCarouselSettings | FeatureCarouselSettings;
    return settings.mode === 'ecommerce' || settings.mode === 'menu';
  });

  if (dynamicSections.length === 0) return new Map();

  // Fetch menu once for this branch
  let allItems: MenuItem[] = [];
  try {
    allItems = await fetchMenu(tenantId, branchId);
  } catch (err) {
    console.error('[page] fetchMenu failed:', err);
    return new Map();
  }

  // Filter items for each dynamic section
  const itemsMap = new Map<string, MenuItem[]>();

  for (const section of dynamicSections) {
    const settings = (section.settings || {}) as EntityCarouselSettings | FeatureCarouselSettings;
    const mode = settings.mode || 'manual';
    const selectionMode = settings.selectionMode || 'items';
    const selectedProductIds = settings.selectedProductIds || [];
    const selectedMenuItemIds = settings.selectedMenuItemIds || [];
    const selectedCategoryKeys = settings.selectedCategoryKeys || [];

    let filtered: MenuItem[];

    if (selectionMode === 'categories' && selectedCategoryKeys.length > 0) {
      // Category mode: filter items by categoryKey or category name
      filtered = allItems.filter((item) => {
        const itemCategory = item.categoryKey || item.category || '';
        return selectedCategoryKeys.includes(itemCategory);
      });
    } else {
      // Item mode: filter by selected IDs
      const ids = mode === 'ecommerce' ? selectedProductIds : selectedMenuItemIds;
      filtered = allItems.filter((item) => {
        const itemId = item._id || item.id || '';
        return ids.includes(itemId);
      });
    }

    itemsMap.set(section._id, filtered);
  }

  return itemsMap;
}

/**
 * Gets the currency symbol for a branch/tenant.
 * Falls back to tenant-level primaryCurrency, then defaults to PLN.
 */
function getCurrencySymbol(tenant: any, branch: Branch | null): string {
  // Try branch-specific settings first (would need a separate fetch, so use tenant for now)
  const currency = tenant?.primaryCurrency || 'PLN';
  const symbols: Record<string, string> = {
    PLN: 'zł', EUR: '€', USD: '$', UAH: '₴', GBP: '£', CZK: 'Kč', CHF: 'CHF',
  };
  return symbols[currency] || currency;
}

export default async function BranchRootPage({
  params,
}: {
  params: Promise<{ tenantDomain: string; locale: string; branchSlug: string }>;
}) {
  const { locale, tenantDomain, branchSlug } = await params;
  const headersList = await headers();
  const host = headersList.get('host') ?? tenantDomain;
  const tenant = await getTenantByDomain(host);

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl">Site not found</h1>
      </div>
    );
  }

  // Resolve branch by slug. The backend endpoint may not be ready yet,
  // so we wrap in try/catch and fall back to using the slug as the branchId.
  let branch: Branch | null = null;
  try {
    branch = await fetchBranchBySlug(tenant.tenantId, branchSlug);
  } catch (err) {
    console.error('[branchSlug] page: fetchBranchBySlug failed:', err);
  }

  const branchId = branch?._id ?? branchSlug;

  // Fetch home page sections for this branch
  let sections: BranchSection[] = [];
  try {
    sections = await fetchPublicBranchSections(host, branchId, 'home');
  } catch (err) {
    console.error('[branchSlug] page: fetchPublicBranchSections failed:', err);
  }

  if (!sections || sections.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl">No content available for this branch</h1>
      </div>
    );
  }

  // Resolve dynamic items for carousel sections (server-side)
  const dynamicItemsMap = await resolveDynamicItems(tenant.tenantId, branchId, sections);
  const currencySymbol = getCurrencySymbol(tenant, branch);

  // Pass dynamic items and currency to SectionRenderer
  return (
    <SectionRenderer
      sections={sections}
      locale={locale}
      tenantDomain={tenantDomain}
      dynamicItemsMap={dynamicItemsMap}
      currencySymbol={currencySymbol}
    />
  );
}
