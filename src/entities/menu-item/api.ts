export async function fetchMenu(tenantId: string, branchId?: string | null) {
  const params = new URLSearchParams({ tenantId })
  if (branchId) params.set('branchId', branchId)

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/saas/menu?${params.toString()}`,
    { next: { tags: [`menu:${tenantId}:${branchId ?? 'all'}`], revalidate: 60 } }
  )
  if (!res.ok) throw new Error('Failed to fetch menu')
  return res.json()
}

/**
 * Fetch menu items and categories in a single API call.
 * Returns { items, categories } to avoid separate round-trips.
 */
export async function fetchMenuWithCategories(
  tenantId: string,
  branchId?: string | null,
  niche: string = 'food'
): Promise<{ items: any[]; categories: any[] }> {
  const params = new URLSearchParams({ tenantId, includeCategories: 'true', niche })
  if (branchId) params.set('branchId', branchId)

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/saas/menu?${params.toString()}`,
    { next: { tags: [`menu:${tenantId}:${branchId ?? 'all'}`], revalidate: 60 } }
  )
  if (!res.ok) throw new Error('Failed to fetch menu with categories')
  return res.json()
}