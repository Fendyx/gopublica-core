export async function fetchMenu(tenantId: string, branchId?: string | null) {
  const params = new URLSearchParams({ tenantId })
  if (branchId) params.set('branchId', branchId)

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/saas/menu?${params.toString()}`,
    { cache: 'no-store' }
  )
  if (!res.ok) throw new Error('Failed to fetch menu')
  return res.json()
}