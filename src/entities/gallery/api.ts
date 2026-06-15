export async function fetchGallery(tenantId: string, branchId?: string | null) {
  const params = new URLSearchParams({ tenantId })
  if (branchId) params.set('branchId', branchId)

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/saas/gallery?${params.toString()}`,
    { cache: 'no-store' }
  )
  if (!res.ok) throw new Error('Failed to fetch gallery')
  return res.json()
}