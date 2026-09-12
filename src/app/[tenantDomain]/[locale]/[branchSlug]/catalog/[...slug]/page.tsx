// Unified catalog catch-all: handles product detail, category view, and entity pages.
// URL patterns:
//   /catalog/serhiy-zhadan          → product by slug or category
//   /catalog/64f8a...               → product by ObjectId
//   /catalog/author/serhiy-zhadan   → entity page
//   /catalog/genre/fantasy          → entity page
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getTenantByDomain } from '@/entities/tenant/api';
import { fetchMenu } from '@/entities/menu-item/api';
import { fetchBranchBySlug } from '@/entities/branch/api';
import type { Branch } from '@/entities/branch/types';
import ProductDetail from '@/widgets/Catalog/ProductDetail';
import EntityPage from '@/widgets/Catalog/EntityPage';
import type { MenuItem } from '@/entities/menu-item/types';
import type { ProductAttributeGroup } from '@/entities/product-attribute/types';

export const dynamic = 'force-dynamic';

const isObjectId = (str: string) => /^[a-f\d]{24}$/i.test(str);

export default async function CatalogSlugPage({
  params,
}: {
  params: Promise<{ tenantDomain: string; locale: string; branchSlug: string; slug: string[] }>;
}) {
  const { locale, tenantDomain, branchSlug, slug: slugParts } = await params;

  const headersList = await headers();
  const host = headersList.get('host') ?? tenantDomain;
  const tenant = await getTenantByDomain(host);
  if (!tenant) return notFound();

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:5000';

  let branch: Branch | null = null;
  try {
    branch = await fetchBranchBySlug(tenant.tenantId, branchSlug);
  } catch (err) {
    console.error('[catalog/[...slug]] fetchBranchBySlug failed:', err);
  }

  const branchId = branch?._id ?? branchSlug;

  // ── Entity page: /catalog/{groupSlug}/{attributeSlug} ──
  // Dynamically resolve — check if first segment matches any attribute group
  if (slugParts.length === 2) {
    const [groupSlug, attrSlug] = slugParts;

    try {
      // Fetch all attribute groups for this tenant
      const groupsRes = await fetch(
        `${API_BASE}/api/saas/attribute-groups?tenantId=${tenant.tenantId}&active=true`,
        { cache: 'no-store' },
      );

      if (groupsRes.ok) {
        const groups: ProductAttributeGroup[] = await groupsRes.json();
        const matchedGroup = groups.find((g) => g.slug === groupSlug);

        if (matchedGroup) {
          // Resolve attribute by slug within the matched group
          const resolveRes = await fetch(
            `${API_BASE}/api/saas/attribute-groups/resolve/${groupSlug}/${attrSlug}?tenantId=${tenant.tenantId}`,
            { cache: 'no-store' },
          );

          if (resolveRes.ok) {
            const { group, attribute } = await resolveRes.json();

            // Fetch all attributes in this group (for sidebar / related)
            const allAttrRes = await fetch(
              `${API_BASE}/api/saas/product-attributes?tenantId=${tenant.tenantId}&type=${group.slug}`,
              { cache: 'no-store' },
            );
            const attributes = allAttrRes.ok ? await allAttrRes.json() : [];

            // Fetch products linked to this attribute
            let products: any[] = [];
            const prodRes = await fetch(
              `${API_BASE}/api/saas/menu?tenantId=${tenant.tenantId}&attributeRefType=${group.slug}&attributeRefId=${attribute._id}`,
              { cache: 'no-store' },
            );
            if (prodRes.ok) {
              const allProducts = await prodRes.json();
              products = allProducts.filter((p: any) => p.status !== 'hidden');
            }

            return (
              <EntityPage
                attribute={attribute}
                attributeGroup={group}
                products={products}
                allAttributes={attributes}
                tenant={tenant}
              />
            );
          }
        }
      }
    } catch {
      // silently fall through to product/category lookup
    }
  }

  // ── Single-segment: product detail or category ──
  const decodedSlug = decodeURIComponent(slugParts[0]);

  const allItems: MenuItem[] = await fetchMenu(tenant.tenantId, branchId);

  // Try product by ObjectId
  if (isObjectId(decodedSlug)) {
    const product = allItems.find((p) => p._id === decodedSlug);
    if (!product) return notFound();
    return <ProductDetail product={product} locale={locale} tenant={tenant} />;
  }

  // Try category
  const catRes = await fetch(
    `${API_BASE}/api/saas/categories?tenantId=${tenant.tenantId}&niche=${tenant.niche || 'ecommerce'}`,
    { cache: 'no-store' },
  );
  const categories = await catRes.json();
  const categoryData = categories.find((c: any) => c.key === decodedSlug);

  if (categoryData) {
    const products = allItems.filter(
      (item) => item.categoryKey === decodedSlug || item.category === categoryData.name,
    );
    const { default: CategoryViewClient } = await import('@/widgets/Catalog/CategoryViewClient');
    return (
      <CategoryViewClient
        category={categoryData}
        categories={categories}
        products={products}
        locale={locale}
        tenant={tenant}
      />
    );
  }

  // Not found as product or category
  return notFound();
}
