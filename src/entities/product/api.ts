import type { MenuItem } from '@/entities/menu-item/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function searchProducts(
  tenantId: string,
  query: string,
  branchId?: string,
): Promise<MenuItem[]> {
  const params = new URLSearchParams({ tenantId, q: query });
  if (branchId) params.set('branchId', branchId);
  const res = await fetch(`${API_BASE}/api/public/products/search?${params}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to search products');
  return res.json();
}

export async function fetchRelatedProducts(
  productId: string,
  tenantId: string,
  limit = 5,
): Promise<MenuItem[]> {
  const params = new URLSearchParams({ productId, tenantId, limit: String(limit) });
  const res = await fetch(`${API_BASE}/api/public/products/related?${params}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch related products');
  return res.json();
}
