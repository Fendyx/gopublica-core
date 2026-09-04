/**
 * Server-only branch API utilities.
 * This file is intentionally separate from api.ts because it imports
 * "next/headers" which is only available in Server Components.
 */
import { headers } from 'next/headers'
import { detectCityFromHeaders } from '@/shared/lib/geolocation'
import { fetchBranches } from './api'

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
