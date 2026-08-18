import { headers } from 'next/headers'
import { detectCityFromHeaders } from '@/shared/lib/geolocation'
import type { Branch } from './types'

export async function fetchBranches(tenantId: string): Promise<Branch[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/saas/branches/public/${tenantId}`,
      { next: { tags: [`branches:${tenantId}`] } }
    )
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

/**
 * Resolves a branch by its slug for the [branchSlug] URL segment.
 * Uses the new public endpoint that looks up a branch by slug.
 */
export async function fetchBranchBySlug(
  tenantId: string,
  slug: string
): Promise<Branch | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/public/branches/slug?tenantId=${tenantId}&slug=${slug}`,
      { next: { tags: [`branches:${tenantId}`] } }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

/**
 * Определяет branchId для SSR-запроса по IP/гео-заголовкам.
 * Повторяет логику BranchContext.detectCityByIp, но на сервере.
 * Возвращает null, если у тенанта нет филиалов вообще (старая single-branch логика).
 */
export async function resolveBranchId(tenantId: string): Promise<string | null> {
  const branches = await fetchBranches(tenantId)
  if (!branches.length) return null

  const headersList = await headers()
  const { city } = await detectCityFromHeaders(headersList)

  if (city) {
    const match = branches.find(b => b.city?.toLowerCase() === city.toLowerCase())
    if (match) return match._id
  }

  // fallback — тот же, что в BranchContext: первый филиал после sort по city
  return branches[0]._id
}