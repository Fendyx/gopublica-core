import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import Menu from '@/widgets/Menu';
import { getTenantByDomain } from '@/entities/tenant/api';
import { fetchMenu } from '@/entities/menu-item/api';
import { fetchBranchBySlug } from '@/entities/branch/api';
import type { Branch } from '@/entities/branch/types';

export const dynamic = 'force-dynamic';

export default async function MenuPage({
  params,
}: {
  params: Promise<{ tenantDomain: string; locale: string; branchSlug: string }>;
}) {
  const { locale, tenantDomain, branchSlug } = await params;
  const t = await getTranslations('menu');
  const headersList = await headers();
  const host = headersList.get('host') ?? tenantDomain;
  const tenant = await getTenantByDomain(host);

  if (!tenant || !tenant.features.hasMenu) {
    return <div className="text-center py-20">{t('unavailable')}</div>;
  }

  // Resolve branch by slug directly in this Server Component.
  // The backend endpoint may not be ready yet, so we wrap in try/catch
  // and fall back to using the slug as the branchId.
  let branch: Branch | null = null;
  try {
    branch = await fetchBranchBySlug(tenant.tenantId, branchSlug);
  } catch (err) {
    console.error('[menu] fetchBranchBySlug failed:', err);
  }

  const branchId = branch?._id ?? branchSlug;
  const allItems = await fetchMenu(tenant.tenantId, branchId);
  // Filter to only food and service items — exclude e-commerce products
  const items = allItems.filter((item: any) => item.productType !== 'physical_product');

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-0">
        <Menu items={items} menuStyle={tenant.theme.menuStyle as 'grid' | 'list'} />
      </div>
    </section>
  );
}
