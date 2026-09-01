import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { getTenantByDomain } from '@/entities/tenant/api';
import { TenantProvider } from '@/entities/tenant/TenantContext';
import { normalizeTenantData } from '@/entities/tenant/utils';

// Dynamic: uses headers() for multi-tenant domain detection.
// Data Cache (cache: 'force-cache' on fetch) still caches API responses.
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenantDomain: string; locale: string }>;
}): Promise<Metadata> {
  const { tenantDomain } = await params;
  const headersList = await headers();
  const host = headersList.get('host') ?? tenantDomain;
  const rawTenant = await getTenantByDomain(host);
  if (!rawTenant) return {};

  const faviconUrl = rawTenant.faviconUrl || '';

  return {
    icons: {
      icon: faviconUrl || '/favicon.ico',
    },
  };
}

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