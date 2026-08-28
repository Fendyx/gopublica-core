import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getTenantByDomain } from '@/entities/tenant/api';
import { TenantProvider } from '@/entities/tenant/TenantContext';

export const dynamic = 'force-dynamic';

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
  const tenant = await getTenantByDomain(host);

  if (!tenant) {
    notFound();
  }

  return (
    <TenantProvider tenantId={tenant.tenantId}>
      {children}
    </TenantProvider>
  );
}