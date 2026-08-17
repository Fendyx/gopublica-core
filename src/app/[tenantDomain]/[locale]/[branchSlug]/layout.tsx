// src/app/[tenantDomain]/[locale]/[branchSlug]/layout.tsx
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getTenantByDomain } from '@/entities/tenant/api';
import { fetchBranchBySlug } from '@/entities/branch/api';
import BranchProviderWithInitial from '@/entities/branch/BranchProviderWithInitial';
import type { Branch } from '@/entities/branch/types';

export const dynamic = 'force-dynamic';

export default async function BranchSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantDomain: string; locale: string; branchSlug: string }>;
}) {
  const { tenantDomain, branchSlug } = await params;

  const headersList = await headers();
  const host = headersList.get('host') ?? tenantDomain;
  const tenant = await getTenantByDomain(host);

  if (!tenant) {
    notFound();
  }

  // Resolve branch by slug. The backend endpoint may not be ready yet,
  // so we wrap in try/catch and fall back to a minimal branch object
  // constructed from the URL slug to prevent frontend crashes.
  let branch: Branch | null = null;
  try {
    branch = await fetchBranchBySlug(tenant.tenantId, branchSlug);
  } catch (err) {
    console.error('[branchSlug] layout: fetchBranchBySlug failed:', err);
  }

  if (!branch) {
    // Fallback: construct a minimal branch from the slug so the frontend
    // doesn't crash while the backend endpoint is being implemented.
    branch = {
      _id: branchSlug,
      tenantId: tenant.tenantId,
      name: branchSlug,
      slug: branchSlug,
      city: '',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Branch;
  }

  return (
    <BranchProviderWithInitial tenantId={tenant.tenantId} initialBranch={branch}>
      {children}
    </BranchProviderWithInitial>
  );
}