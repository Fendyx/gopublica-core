import type { ProductAttribute, ProductAttributeTree, AttributeType, ProductAttributeGroup } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function fetchAttributes(
  tenantId: string,
  type?: AttributeType,
): Promise<ProductAttribute[]> {
  const params = new URLSearchParams({ tenantId });
  if (type) params.set('type', type);
  const res = await fetch(`${API_BASE}/api/saas/product-attributes?${params}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch attributes');
  return res.json();
}

export async function fetchAttributeTree(
  tenantId: string,
): Promise<ProductAttributeTree> {
  const res = await fetch(
    `${API_BASE}/api/saas/product-attributes/tree?tenantId=${tenantId}`,
    { cache: 'no-store' },
  );
  if (!res.ok) throw new Error('Failed to fetch attribute tree');
  return res.json();
}

export async function suggestAttributes(
  tenantId: string,
  type: AttributeType,
  query: string,
): Promise<ProductAttribute[]> {
  const params = new URLSearchParams({ tenantId, type, q: query });
  const res = await fetch(
    `${API_BASE}/api/saas/product-attributes/suggest?${params}`,
    { cache: 'no-store' },
  );
  if (!res.ok) throw new Error('Failed to suggest attributes');
  return res.json();
}

export async function createAttribute(
  data: {
    type: AttributeType;
    name: string;
    translations?: Record<string, { name?: string }>;
    description?: string;
    image?: string;
  },
  token: string,
): Promise<ProductAttribute> {
  const res = await fetch(`${API_BASE}/api/saas/product-attributes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed' }));
    throw new Error(err.error || 'Failed to create attribute');
  }
  return res.json();
}

export async function updateAttribute(
  id: string,
  data: Partial<{
    name: string;
    translations: Record<string, { name?: string }>;
    description: string;
    image: string;
    isActive: boolean;
    slug: string;
  }>,
  token: string,
): Promise<ProductAttribute> {
  const res = await fetch(`${API_BASE}/api/saas/product-attributes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed' }));
    throw new Error(err.error || 'Failed to update attribute');
  }
  return res.json();
}

export async function deleteAttribute(
  id: string,
  token: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/saas/product-attributes/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed' }));
    throw new Error(err.error || 'Failed to delete attribute');
  }
}

// ── Attribute Groups ──

export async function fetchAttributeGroups(
  tenantId: string,
): Promise<ProductAttributeGroup[]> {
  const res = await fetch(
    `${API_BASE}/api/saas/attribute-groups?tenantId=${tenantId}`,
    { cache: 'no-store' },
  );
  if (!res.ok) throw new Error('Failed to fetch attribute groups');
  return res.json();
}

export async function fetchAttributeGroupWithAttributes(
  groupId: string,
  tenantId: string,
): Promise<ProductAttributeGroup & { attributes: ProductAttribute[] }> {
  const res = await fetch(
    `${API_BASE}/api/saas/attribute-groups/${groupId}?tenantId=${tenantId}`,
    { cache: 'no-store' },
  );
  if (!res.ok) throw new Error('Failed to fetch attribute group');
  return res.json();
}

export async function resolveAttributeBySlug(
  tenantId: string,
  groupSlug: string,
  attrSlug: string,
): Promise<{ group: ProductAttributeGroup; attribute: ProductAttribute }> {
  const res = await fetch(
    `${API_BASE}/api/saas/attribute-groups/resolve/${groupSlug}/${attrSlug}?tenantId=${tenantId}`,
    { cache: 'no-store' },
  );
  if (!res.ok) throw new Error('Failed to resolve attribute');
  return res.json();
}

export async function createAttributeGroup(
  data: {
    name: string;
    icon?: string;
    translations?: Record<string, { name?: string }>;
    sortOrder?: number;
  },
  token: string,
): Promise<ProductAttributeGroup> {
  const res = await fetch(`${API_BASE}/api/saas/attribute-groups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed' }));
    throw new Error(err.error || 'Failed to create attribute group');
  }
  return res.json();
}

export async function updateAttributeGroup(
  id: string,
  data: Partial<{
    name: string;
    icon: string;
    translations: Record<string, { name?: string }>;
    isActive: boolean;
    sortOrder: number;
    slug: string;
  }>,
  token: string,
): Promise<ProductAttributeGroup> {
  const res = await fetch(`${API_BASE}/api/saas/attribute-groups/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed' }));
    throw new Error(err.error || 'Failed to update attribute group');
  }
  return res.json();
}

export async function deleteAttributeGroup(
  id: string,
  token: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/saas/attribute-groups/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed' }));
    throw new Error(err.error || 'Failed to delete attribute group');
  }
}

export async function reorderAttributeGroups(
  orderedIds: string[],
  token: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/saas/attribute-groups/reorder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ orderedIds }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed' }));
    throw new Error(err.error || 'Failed to reorder attribute groups');
  }
}
