import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getTenantByDomain } from '@/entities/tenant/api';
import { fetchMenu } from '@/entities/menu-item/api';
import { resolveBranchId } from '@/entities/branch/api';
import ProductDetail from '@/widgets/Catalog/ProductDetail';
import type { MenuItem } from '@/entities/menu-item/types';

export const dynamic = 'force-dynamic';

const isObjectId = (str: string) => /^[a-f\d]{24}$/i.test(str);

export default async function CatalogSlugPage({
  params,
}: {
  params: Promise<{ tenantDomain: string; locale: string; slug: string }>;
}) {
  const { locale, tenantDomain, slug } = await params;

  const headersList = await headers();
  const host = headersList.get('host') ?? tenantDomain;
  const tenant = await getTenantByDomain(host);

  if (!tenant) return notFound();

  const branchId = await resolveBranchId(tenant.tenantId);
  const allItems: MenuItem[] = await fetchMenu(tenant.tenantId, branchId);

  // Если слаг — ID товара
  if (isObjectId(slug)) {
    const product = allItems.find((p) => p._id === slug);
    if (!product) return notFound();

    return <ProductDetail product={product} locale={locale} tenant={tenant} />;
  }

  // Категория
  const catRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/saas/categories?tenantId=${tenant.tenantId}&niche=${tenant.niche || 'ecommerce'}`
  );
  const categories = await catRes.json();
  const categoryData = categories.find((c: any) => c.key === slug);
  if (!categoryData) return notFound();

  const products = allItems.filter(
    (item) => item.categoryKey === slug || item.category === categoryData.name
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