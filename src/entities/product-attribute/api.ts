import type { ProductAttribute, ProductAttributeTree, AttributeType } from './types';

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
