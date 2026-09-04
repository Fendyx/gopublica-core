// src/app/[tenantDomain]/[locale]/[branchSlug]/p/[pageSlug]/page.tsx
//
// Dynamic storefront route for tenant-created custom pages.
// Renders BranchSection documents where `page === params.pageSlug`.
// Uses the same SectionRenderer pipeline as all other storefront pages.

import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getTenantByDomain } from '@/entities/tenant/api';
import { fetchBranchBySlug } from '@/entities/branch/api';
import { fetchPublicBranchSections } from '@/entities/branch-section/api';
import SectionRenderer from '@/widgets/Sections/SectionRenderer';
import { resolveDynamicItems } from '@/widgets/Sections/resolveDynamicItems';
import type { Branch } from '@/entities/branch/types';

// Dynamic: uses headers() for multi-tenant domain detection.
export const dynamic = 'force-dynamic';

/**
 * Gets the currency symbol for a branch/tenant.
 * Falls back to tenant-level primaryCurrency, then defaults to PLN.
 */
function getCurrencySymbol(tenant: any, branch: Branch | null): string {
  const currency = tenant?.primaryCurrency || 'PLN';
  const symbols: Record<string, string> = {
    PLN: 'zł', EUR: '€', USD: '$', UAH: '₴', GBP: '£', CZK: 'Kč', CHF: 'CHF',
  };
  return symbols[currency] || currency;
}

export default async function CustomPage({
  params,
}: {
  params: Promise<{ tenantDomain: string; locale: string; branchSlug: string; pageSlug: string }>;
}) {
  const { locale, tenantDomain, branchSlug, pageSlug } = await params;

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

  // Resolve branch by slug
  let branch: Branch | null = null;
  try {
    branch = await fetchBranchBySlug(tenant.tenantId, branchSlug);
  } catch (err) {
    console.error('[custom-page] fetchBranchBySlug failed:', err);
  }

  const branchId = branch?._id ?? branchSlug;

  // Verify that the requested pageSlug is an active custom page on this branch.
  // If we have the full branch object, check the embedded customPages array.
  // Otherwise, try fetching sections directly — if sections exist, the page is valid.
  const hasCustomPageInBranch = branch?.customPages?.some(
    (cp) => cp.slug === pageSlug && cp.isActive
  );

  if (!hasCustomPageInBranch) {
    // Fallback: probe the sections endpoint to see if any sections exist for this page.
    // This handles the case where branch.customPages may not be populated yet.
    let probeSections: any[] = [];
    try {
      probeSections = await fetchPublicBranchSections(tenant.tenantId, branchId, pageSlug);
    } catch { /* ignore */ }
    if (!probeSections || probeSections.length === 0) {
      notFound();
    }
  }

  // Fetch sections for this custom page
  let sections = [];
  try {
    sections = await fetchPublicBranchSections(tenant.tenantId, branchId, pageSlug);
  } catch (err) {
    console.error('[custom-page] fetchPublicBranchSections failed:', err);
  }

  if (!sections || sections.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl text-text-secondary">This page has no content yet.</h1>
      </div>
    );
  }

  // Resolve dynamic items for carousel sections (server-side)
  const dynamicItemsMap = await resolveDynamicItems(tenant.tenantId, branchId, sections);
  const currencySymbol = getCurrencySymbol(tenant, branch);

  return (
    <SectionRenderer
      sections={sections}
      locale={locale}
      tenantDomain={tenantDomain}
      branchSlug={branchSlug}
      dynamicItemsMap={dynamicItemsMap}
      currencySymbol={currencySymbol}
    />
  );
}
