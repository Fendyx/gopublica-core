// src/app/[tenantDomain]/[locale]/[branchSlug]/page.tsx
import { headers } from 'next/headers';
import { getTenantByDomain } from '@/entities/tenant/api';
import { fetchBranchBySlug } from '@/entities/branch/api';
import { fetchPublicBranchSections } from '@/entities/branch-section/api';
import SectionRenderer from '@/widgets/Sections/SectionRenderer';
import type { Branch } from '@/entities/branch/types';

export const dynamic = 'force-dynamic';

export default async function BranchRootPage({
  params,
}: {
  params: Promise<{ tenantDomain: string; locale: string; branchSlug: string }>;
}) {
  const { locale, tenantDomain, branchSlug } = await params;
  const headersList = await headers();
  const host = headersList.get('host') ?? tenantDomain;
  const tenant = await getTenantByDomain(host);

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl">Site not found</h1>
      </div>
    );
  }

  // Resolve branch by slug. The backend endpoint may not be ready yet,
  // so we wrap in try/catch and fall back to using the slug as the branchId.
  let branch: Branch | null = null;
  try {
    branch = await fetchBranchBySlug(tenant.tenantId, branchSlug);
  } catch (err) {
    console.error('[branchSlug] page: fetchBranchBySlug failed:', err);
  }

  const branchId = branch?._id ?? branchSlug;

  // Fetch home page sections for this branch
  let sections: any[] = [];
  try {
    sections = await fetchPublicBranchSections(host, branchId, 'home');
  } catch (err) {
    console.error('[branchSlug] page: fetchPublicBranchSections failed:', err);
  }

  if (!sections || sections.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl">No content available for this branch</h1>
      </div>
    );
  }

  return <SectionRenderer sections={sections} locale={locale} tenantDomain={tenantDomain} />;
}
