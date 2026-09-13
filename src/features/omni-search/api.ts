import type { OmniSearchResponse } from './types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL

export async function fetchOmniSearch(
  tenantId: string,
  query: string,
  branchId?: string,
  locale?: string,
): Promise<OmniSearchResponse> {
  const params = new URLSearchParams({
    tenantId,
    q: query,
    ...(branchId ? { branchId } : {}),
    ...(locale ? { locale } : {}),
  })

  const res = await fetch(`${API_BASE}/api/public/omni-search?${params}`, {
    cache: 'no-store',
  })

  if (!res.ok) throw new Error(`Search API error: ${res.statusText}`)
  return res.json()
}
