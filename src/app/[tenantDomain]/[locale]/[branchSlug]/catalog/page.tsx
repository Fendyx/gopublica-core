// src/app/[tenantDomain]/[locale]/[branchSlug]/catalog/page.tsx
import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import EcommerceGridLayout from '@/widgets/Catalog/EcommerceGridLayout';
import { getTenantByDomain } from '@/entities/tenant/api';
import { fetchMenu } from '@/entities/menu-item/api';
import { fetchBranchBySlug } from '@/entities/branch/api';
import type { Branch } from '@/entities/branch/types';

// Dynamic: uses headers() for multi-tenant domain detection.
export const dynamic = 'force-dynamic';

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
  // The backend endpoint may not be ready yet, so we wrap in try/catch
  // and fall back to using the slug as the branchId.
  let branch: Branch | null = null;
  try {
    branch = await fetchBranchBySlug(tenant.tenantId, branchSlug);
  } catch (err) {
    console.error('[catalog] fetchBranchBySlug failed:', err);
  }

  const branchId = branch?._id ?? branchSlug;
  const allItems = await fetchMenu(tenant.tenantId, branchId);
  // Filter to only e-commerce products — exclude food/service items
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