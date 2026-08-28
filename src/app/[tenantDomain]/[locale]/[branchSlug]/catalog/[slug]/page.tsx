// src/app/[tenantDomain]/[locale]/[branchSlug]/catalog/[slug]/page.tsx
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getTenantByDomain } from '@/entities/tenant/api';
import { fetchMenu } from '@/entities/menu-item/api';
import { fetchBranchBySlug } from '@/entities/branch/api';
import type { Branch } from '@/entities/branch/types';
import ProductDetail from '@/widgets/Catalog/ProductDetail';
import type { MenuItem } from '@/entities/menu-item/types';

// Dynamic: uses headers() for multi-tenant domain detection.
// Data Cache (cache: 'force-cache' on fetch) still caches API responses.
export const dynamic = 'force-dynamic';

const isObjectId = (str: string) => /^[a-f\d]{24}$/i.test(str);

export default async function CatalogSlugPage({
  params,
}: {
  params: Promise<{ tenantDomain: string; locale: string; branchSlug: string; slug: string }>;
}) {
  const { locale, tenantDomain, branchSlug, slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const headersList = await headers();
  const host = headersList.get('host') ?? tenantDomain;
  const tenant = await getTenantByDomain(host);

  if (!tenant) return notFound();

  // Resolve branch by slug directly in this Server Component.
  // The backend endpoint may not be ready yet, so we wrap in try/catch
  // and fall back to using the slug as the branchId.
  let branch: Branch | null = null;
  try {
    branch = await fetchBranchBySlug(tenant.tenantId, branchSlug);
  } catch (err) {
    console.error('[catalog/slug] fetchBranchBySlug failed:', err);
  }

  const branchId = branch?._id ?? branchSlug;
  const allItems: MenuItem[] = await fetchMenu(tenant.tenantId, branchId);

  // Если слаг — ID товара
  if (isObjectId(decodedSlug)) {
    const product = allItems.find((p) => p._id === decodedSlug);
    if (!product) return notFound();

    return <ProductDetail product={product} locale={locale} tenant={tenant} />;
  }

  // Категория
  const catRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/saas/categories?tenantId=${tenant.tenantId}&niche=${tenant.niche || 'ecommerce'}`
  );
  const categories = await catRes.json();
  const categoryData = categories.find((c: any) => c.key === decodedSlug);
  if (!categoryData) return notFound();

  const products = allItems.filter(
    (item) => item.categoryKey === decodedSlug || item.category === categoryData.name
  );

  const { default: CategoryViewClient } = await import(
    '@/widgets/Catalog/CategoryViewClient'
  );
  return (
    <CategoryViewClient
      category={categoryData}
      products={products}
      locale={locale}
      tenant={tenant}
    />
  );
}
