import { apiFetch } from '@/shared/api/apiClient'
import { getAuthHeaders } from '@/shared/lib/authFetch'
import type { StaffMember } from '@/entities/staff/types'

const getTenantId = () => {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem('tenantId') || ''
}

/** Merges centralized auth headers with x-tenant-id for staff API calls. */
const buildHeaders = () => ({
  ...getAuthHeaders(),
  ...(getTenantId() ? { 'x-tenant-id': getTenantId() } : {}),
})

export async function getStaffMembers(branchId?: string) {
  const params = branchId ? `?branchId=${encodeURIComponent(branchId)}` : ''
  return apiFetch<StaffMember[]>(`/api/saas/staff${params}`, { headers: buildHeaders() })
}

export async function createStaffMember(payload: Omit<StaffMember, '_id' | 'tenantId' | 'createdAt' | 'updatedAt'>) {
  return apiFetch<StaffMember>('/api/saas/staff', {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })
}

export async function updateStaffMember(id: string, payload: Partial<StaffMember>) {
  return apiFetch<StaffMember>(`/api/saas/staff/${id}`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })
}

export async function deleteStaffMember(id: string) {
  return apiFetch<{ ok: boolean }>(`/api/saas/staff/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  })
}
