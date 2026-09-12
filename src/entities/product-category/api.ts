import type { CategoryNavItem } from './types';

export async function fetchCategoriesForNav(
  tenantId: string,
  niche: string = 'ecommerce'
): Promise<CategoryNavItem[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/saas/categories?tenantId=${tenantId}&niche=${niche}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((cat: any) => ({
      key: cat.key,
      name: cat.name,
      icon: cat.icon,
      coverImage: cat.coverImage,
      productCount: cat.productCount,
      parentCategoryKey: cat.parentCategoryKey || null,
      order: cat.order ?? 0,
      translations: cat.translations || {},
    }));
  } catch {
    return [];
  }
}
