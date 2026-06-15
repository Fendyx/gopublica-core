import { headers } from 'next/headers';
import Menu from '@/widgets/Menu';
import { getTenantByDomain } from '@/entities/tenant/api';
import { fetchMenu } from '@/entities/menu-item/api';
import { resolveBranchId } from '@/entities/branch/api';

export default async function TenantMenuPage({
  params,
}: {
  params: { tenantDomain: string; locale: string };
}) {
  const headersList = await headers();
  const host = headersList.get('host') ?? params.tenantDomain;
  const tenant = await getTenantByDomain(host);

  if (!tenant || !tenant.features.hasMenu) {
    return <div className="text-center py-20">Меню недоступно</div>;
  }

  const branchId = await resolveBranchId(tenant.tenantId);
  const items = await fetchMenu(tenant.tenantId, branchId);

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <Menu items={items} menuStyle={tenant.theme.menuStyle as 'grid' | 'list'} />
      </div>
    </section>
  );
}