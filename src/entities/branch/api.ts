import type { Branch, CustomPage } from './types'

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('saas_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function fetchBranches(tenantId: string): Promise<Branch[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/saas/branches/public/${tenantId}`,
      { next: { tags: [`branches:${tenantId}`] }, cache: 'no-store' }
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
      `${process.env.NEXT_PUBLIC_API_URL}/api/saas/branches/public/${tenantId}/slug/${slug}`,
      { next: { tags: [`branches:${tenantId}`] }, cache: 'no-store' }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Custom Pages CRUD (Admin)
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchCustomPages(branchId: string): Promise<CustomPage[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/saas/branches/${branchId}/custom-pages`,
    { headers: getAuthHeaders() }
  )
  if (!res.ok) throw new Error('Failed to fetch custom pages')
  return res.json()
}

export async function createCustomPage(
  branchId: string,
  title: string
): Promise<CustomPage> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/saas/branches/${branchId}/custom-pages`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ title }),
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to create custom page')
  }
  return res.json()
}

export async function updateCustomPage(
  branchId: string,
  slug: string,
  data: { title?: string; isActive?: boolean; slug?: string }
): Promise<CustomPage> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/saas/branches/${branchId}/custom-pages/${slug}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to update custom page')
  }
  return res.json()
}

export async function deleteCustomPage(
  branchId: string,
  slug: string
): Promise<void> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/saas/branches/${branchId}/custom-pages/${slug}`,
    { method: 'DELETE', headers: getAuthHeaders() }
  )
  if (!res.ok) throw new Error('Failed to delete custom page')
}