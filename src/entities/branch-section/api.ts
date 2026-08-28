import { BranchSection, BranchSectionItem } from './types';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('saas_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export async function fetchBranchSections(
  tenantId: string,
  branchId: string,
  page = 'home'
): Promise<BranchSection[]> {
  const params = new URLSearchParams({ tenantId, branchId, page });

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/saas/branch-sections?${params.toString()}`,
    {
      cache: 'no-store',
      headers: getAuthHeaders(),
    }
  );

  if (!res.ok) return [];
  return res.json();
}

export async function fetchBranchSectionItemBySlug(
  tenantId: string,
  slug: string
): Promise<BranchSectionItem | null> {
  const params = new URLSearchParams({ tenantId });
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/public/branch-sections/items/${slug}?${params.toString()}`;

  console.log('FETCHING ENTITY URL:', url);

  const res = await fetch(url, {
    cache: 'no-store',
    headers: getAuthHeaders(),
  });

  if (!res.ok) return null;
  return res.json();
}

export async function saveBranchSection(data: Partial<BranchSection>): Promise<BranchSection> {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/saas/branch-sections${data._id ? `/${data._id}` : ''}`;
  const res = await fetch(url, {
    method: data._id ? 'PUT' : 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    console.error('saveBranchSection failed:', {
      status: res.status,
      statusText: res.statusText,
      headers: Object.fromEntries(res.headers.entries()),
      body: errorBody,
    });
    throw new Error(`Failed to save branch section (${res.status}): ${errorBody?.message || errorBody?.error || 'unknown error'}`);
  }
  return res.json();
}

export async function deleteBranchSection(id: string): Promise<void> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/branch-sections/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete branch section');
}

export async function reorderBranchSections(branchId: string, orderedIds: string[]): Promise<void> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/branch-sections/reorder`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ branchId, orderedIds })
  });
  if (!res.ok) throw new Error('Failed to reorder branch sections');
}

export async function reorderBranchSectionsBulk(updates: { _id: string; order: number }[]): Promise<void> {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/saas/branch-sections/reorder-bulk`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ updates }),
  });
  if (!res.ok) throw new Error('Failed to reorder branch sections');
}

export async function fetchBranchSectionItems(sectionId: string): Promise<BranchSectionItem[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/saas/branch-sections/${sectionId}/items`,
    {
      cache: 'no-store',
      headers: getAuthHeaders(),
    }
  );

  if (!res.ok) return [];
  return res.json();
}

export async function saveBranchSectionItem(sectionId: string, item: Partial<BranchSectionItem>): Promise<BranchSectionItem> {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/saas/branch-sections/${sectionId}/items${item._id ? `/${item._id}` : ''}`;
  const res = await fetch(url, {
    method: item._id ? 'PUT' : 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(item)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('SERVER SAVE ERROR:', errorData);
    throw new Error(errorData.error || 'Failed to save branch section item');
  }
  return res.json();
}

export async function deleteBranchSectionItem(sectionId: string, itemId: string): Promise<void> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/branch-sections/${sectionId}/items/${itemId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete branch section item');
}

export async function fetchPublicBranchSections(
  tenantDomain: string,
  branchId: string,
  page = 'home'
): Promise<BranchSection[]> {
  const params = new URLSearchParams({ branchId, page });
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/public/branch-sections?${params.toString()}`;
  try {
    const res = await fetch(url, {
      next: { tags: [`sections:${tenantDomain}:${branchId}`] },
      cache: 'force-cache',
      headers: {
        'Host': tenantDomain,
        'x-tenant-host': tenantDomain // Fallback custom header for backend resolution
      }
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('fetchPublicBranchSections failed:', {
        status: res.status,
        statusText: res.statusText,
        body: text,
        url,
      });
      return [];
    }
    return res.json();
  } catch (err) {
    console.error('fetchPublicBranchSections network error:', err);
    return [];
  }
}
