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

export const dynamic = 'force-dynamic';

const VALID_ENTITY_TYPES = ['author', 'publisher', 'genre', 'language', 'series', 'custom'];

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

  // ── Entity page: /catalog/author/serhiy-zhadan ──
  if (slugParts.length === 2 && VALID_ENTITY_TYPES.includes(slugParts[0])) {
    const [type, entitySlug] = slugParts;

    let attribute = null;
    let attributes: any[] = [];
    let products: any[] = [];

    try {
      const attrRes = await fetch(
        `${API_BASE}/api/saas/product-attributes/suggest?tenantId=${tenant.tenantId}&type=${type}&q=${entitySlug.replace(/-/g, ' ')}`,
        { cache: 'no-store' },
      );
      if (attrRes.ok) {
        const attrs = await attrRes.json();
        attribute = attrs.find((a: any) => a.slug === entitySlug) || attrs[0] || null;
      }

      const allAttrRes = await fetch(
        `${API_BASE}/api/saas/product-attributes?tenantId=${tenant.tenantId}&type=${type}`,
        { cache: 'no-store' },
      );
      if (allAttrRes.ok) attributes = await allAttrRes.json();

      if (attribute) {
        const prodRes = await fetch(
          `${API_BASE}/api/saas/menu?tenantId=${tenant.tenantId}&attributeRefType=${type}&attributeRefId=${attribute._id}`,
          { cache: 'no-store' },
        );
        if (prodRes.ok) {
          const allProducts = await prodRes.json();
          products = allProducts.filter((p: any) => p.status !== 'hidden');
        }
      }
    } catch {
      // silently fail
    }

    if (!attribute) return notFound();

    return <EntityPage attribute={attribute} products={products} allAttributes={attributes} tenant={tenant} />;
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
