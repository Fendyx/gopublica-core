import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import { getTenantByDomain } from '@/entities/tenant/api';
import { fetchBranches } from '@/entities/branch/api';

// Dynamic: uses headers() for multi-tenant domain detection.
export const dynamic = 'force-dynamic';

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

  // Redirect to the best branch for this user.
  // Priority: 1) saved cookie preference, 2) default branch, 3) first branch
  let defaultBranchSlug = 'main';
  try {
    const branches = await fetchBranches(tenant.tenantId);
    
    // Check if user has a saved branch preference in cookie
    const cookieStore = await cookies();
    const savedBranchSlug = cookieStore.get('selectedBranch')?.value;
    
    if (savedBranchSlug) {
      const savedBranch = branches.find(b => b.slug === savedBranchSlug);
      if (savedBranch) {
        defaultBranchSlug = savedBranch.slug;
      } else {
        // Saved branch no longer exists, fall back to default
        const defaultBranch = branches.find(b => b.isDefault) || branches[0];
        if (defaultBranch?.slug) {
          defaultBranchSlug = defaultBranch.slug;
        }
      }
    } else {
      const defaultBranch = branches.find(b => b.isDefault) || branches[0];
      if (defaultBranch?.slug) {
        defaultBranchSlug = defaultBranch.slug;
      }
    }
  } catch (err) {
    console.error('[locale] page: fetchBranches failed:', err);
  }

  redirect(`/${locale}/${defaultBranchSlug}`);
}