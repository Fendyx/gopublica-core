import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getTenantByDomain } from '@/entities/tenant/api';
import { TenantProvider, normalizeTenantData } from '@/entities/tenant/TenantContext';

export const revalidate = 3600;

export default async function TenantLocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantDomain: string; locale: string }>;
}) {
  const { tenantDomain } = await params;

  const headersList = await headers();
  const host = headersList.get('host') ?? tenantDomain;
  const rawTenant = await getTenantByDomain(host);

  if (!rawTenant) {
    notFound();
  }

  const tenant = normalizeTenantData(rawTenant, tenantDomain);

  return (
    <TenantProvider tenantId={tenant.tenantId} initialTenant={tenant}>
      {children}
    </TenantProvider>
  );
}