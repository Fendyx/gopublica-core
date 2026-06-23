// src/app/[tenantDomain]/[locale]/catalog/page.tsx
import { headers } from 'next/headers';
import Menu from '@/widgets/Menu';
import EcommerceGridLayout from '@/widgets/Catalog/EcommerceGridLayout';
import { getTenantByDomain } from '@/entities/tenant/api';
import { fetchMenu } from '@/entities/menu-item/api';
import { resolveBranchId } from '@/entities/branch/api';

export const dynamic = 'force-dynamic';

export default async function CatalogPage({
  params,
}: {
  params: { tenantDomain: string; locale: string };
}) {
  const headersList = await headers();
  const host = headersList.get('host') ?? params.tenantDomain;
  const tenant = await getTenantByDomain(host);

  if (!tenant || !tenant.features.hasMenu) {
    return <div className="text-center py-20">Каталог недоступен</div>;
  }

  const branchId = await resolveBranchId(tenant.tenantId);
  const items = await fetchMenu(tenant.tenantId, branchId);

  const niche = tenant.niche ?? 'food';

  if (niche === 'food') {
    return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-0">
          <Menu items={items} menuStyle={tenant.theme.menuStyle as 'grid' | 'list'} />
        </div>
      </section>
    );
  }

  if (niche === 'ecommerce') {
    const variant = (tenant.theme?.productCardVariant as 'overlay' | 'action-bar' | 'minimal') || 'action-bar';
    const currencySymbol = tenant.primaryCurrency === 'PLN' ? 'zł' : tenant.primaryCurrency || '€';

    return (
      <section className="py-10 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-8 text-foreground">Каталог товаров</h1>
          <EcommerceGridLayout 
            items={items} 
            variant={variant} 
            currencySymbol={currencySymbol}
            locale={params.locale}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-0">
        <Menu items={items} menuStyle={tenant.theme.menuStyle as 'grid' | 'list'} />
      </div>
    </section>
  );
}