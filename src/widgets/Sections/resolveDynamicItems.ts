import type { BranchSection, EntityCarouselSettings, FeatureCarouselSettings } from '@/entities/branch-section/types';
import type { MenuItem } from '@/entities/menu-item/types';
import { fetchMenu } from '@/entities/menu-item/api';

/**
 * Resolves dynamic items for carousel sections that use 'ecommerce' or 'menu' mode.
 * Fetches the full menu once per branch and filters according to section settings.
 *
 * Shared across all page routes (home, partners, catalog, menu, articles, gallery, contacts).
 */
export async function resolveDynamicItems(
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
    console.error('[resolveDynamicItems] fetchMenu failed:', err);
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
