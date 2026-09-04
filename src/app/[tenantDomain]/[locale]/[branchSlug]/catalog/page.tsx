// src/app/[tenantDomain]/[locale]/[branchSlug]/catalog/page.tsx
import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import EcommerceGridLayout from '@/widgets/Catalog/EcommerceGridLayout';
import { getTenantByDomain } from '@/entities/tenant/api';
import { fetchMenu } from '@/entities/menu-item/api';
import { fetchBranchBySlug } from '@/entities/branch/api';
import { fetchPublicBranchSections } from '@/entities/branch-section/api';
import SectionRenderer from '@/widgets/Sections/SectionRenderer';
import type { Branch } from '@/entities/branch/types';
import type { BranchSection, EntityCarouselSettings, FeatureCarouselSettings } from '@/entities/branch-section/types';
import type { MenuItem } from '@/entities/menu-item/types';

// Dynamic: uses headers() for multi-tenant domain detection.
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
    console.error('[catalog] fetchMenu failed:', err);
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

export default async function CatalogPage({
  params,
}: {
  params: Promise<{ tenantDomain: string; locale: string; branchSlug: string }>;
}) {
  const { locale, tenantDomain, branchSlug } = await params;
  const t = await getTranslations('catalog');
  const headersList = await headers();
  const host = headersList.get('host') ?? tenantDomain;
  const tenant = await getTenantByDomain(host);

  if (!tenant || !tenant.features.hasOnlineOrdering) {
    return <div className="text-center py-20">{t('unavailable')}</div>;
  }

  // Resolve branch by slug directly in this Server Component.
  let branch: Branch | null = null;
  try {
    branch = await fetchBranchBySlug(tenant.tenantId, branchSlug);
  } catch (err) {
    console.error('[catalog] fetchBranchBySlug failed:', err);
  }

  const branchId = branch?._id ?? branchSlug;

  // Try to fetch page-builder sections for the catalog page
  let sections: BranchSection[] = [];
  try {
    sections = await fetchPublicBranchSections(tenant.tenantId, branchId, 'catalog');
  } catch (err) {
    console.error('[catalog] fetchPublicBranchSections failed:', err);
  }

  // If page-builder sections exist, render via SectionRenderer (system_catalog handles the grid)
  if (sections && sections.length > 0) {
    const dynamicItemsMap = await resolveDynamicItems(tenant.tenantId, branchId, sections);
    const currencySymbol = tenant.primaryCurrency === 'PLN' ? 'zł' : tenant.primaryCurrency || '€';

    return (
      <SectionRenderer
        sections={sections}
        locale={locale}
        tenantDomain={tenantDomain}
        branchSlug={branchSlug}
        dynamicItemsMap={dynamicItemsMap}
        currencySymbol={currencySymbol}
      />
    );
  }

  // Fallback: backward-compatible hardcoded catalog (no page-builder sections configured)
  const allItems = await fetchMenu(tenant.tenantId, branchId);
  const items = allItems.filter((item: any) => item.productType === 'physical_product');
  const variant = (tenant.theme?.productCardVariant as 'overlay' | 'action-bar' | 'minimal') || 'action-bar';
  const currencySymbol = tenant.primaryCurrency === 'PLN' ? 'zł' : tenant.primaryCurrency || '€';

  return (
    <section className="py-10 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8 text-foreground">{t('ourProducts')}</h1>
        <EcommerceGridLayout
          items={items}
          variant={variant}
          currencySymbol={currencySymbol}
          locale={locale}
        />
      </div>
    </section>
  );
}