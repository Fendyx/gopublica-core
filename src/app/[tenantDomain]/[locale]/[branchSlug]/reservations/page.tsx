// src/app/[tenantDomain]/[locale]/[branchSlug]/reservations/page.tsx
import { headers } from 'next/headers';
import { getTenantByDomain } from '@/entities/tenant/api';
import { fetchBranchBySlug } from '@/entities/branch/api';
import { fetchPublicBranchSections } from '@/entities/branch-section/api';
import SectionRenderer from '@/widgets/Sections/SectionRenderer';
import type { BranchSection } from '@/entities/branch-section/types';
import type { Branch } from '@/entities/branch/types';

export const dynamic = 'force-dynamic';

export default async function TenantReservationsPage({
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
      <main className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl">Site not found</h1>
      </main>
    );
  }

  let branch: Branch | null = null;
  try {
    branch = await fetchBranchBySlug(tenant.tenantId, branchSlug);
  } catch (err) {
    console.error('[reservations] fetchBranchBySlug failed:', err);
  }

  const branchId = branch?._id ?? branchSlug;

  // Fetch reservations page sections for this branch
  let sections: BranchSection[] = [];
  try {
    sections = await fetchPublicBranchSections(tenant.tenantId, branchId, 'reservations');
  } catch (err) {
    console.error('[reservations] fetchPublicBranchSections failed:', err);
  }

  // If no sections configured, fall back to legacy BookingForm
  if (!sections || sections.length === 0) {
    const BookingForm = (await import('@/features/reservation/BookingForm')).default;
    return (
      <main className="pb-16">
        <BookingForm />
      </main>
    );
  }

  return (
    <SectionRenderer
      sections={sections}
      locale={locale}
      tenantDomain={tenantDomain}
      branchSlug={branchSlug}
    />
  );
}
