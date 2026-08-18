import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getTenantByDomain } from '@/entities/tenant/api';
import { fetchBranches } from '@/entities/branch/api';

export default async function TenantHomePage(props: {
  params: Promise<{ tenantDomain: string; locale: string }>;
}) {
  const params = await props.params;
  const { tenantDomain, locale } = params;
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

  // Redirect to the default branch's home page.
  // The backend may not be ready yet, so we wrap in try/catch
  // and fall back to a hardcoded 'main' slug.
  let defaultBranchSlug = 'main';
  try {
    const branches = await fetchBranches(tenant.tenantId);
    const defaultBranch = branches.find(b => b.isDefault) || branches[0];
    if (defaultBranch?.slug) {
      defaultBranchSlug = defaultBranch.slug;
    }
  } catch (err) {
    console.error('[locale] page: fetchBranches failed:', err);
  }

  redirect(`/${locale}/${defaultBranchSlug}`);
}