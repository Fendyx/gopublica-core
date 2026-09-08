import { apiFetch } from '@/shared/api/apiClient'
import type { StaffMember } from '@/entities/staff/types'

const getTenantId = () => {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem('tenantId') || ''
}

const buildHeaders = () => {
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('saas_token') : null
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (getTenantId()) headers['x-tenant-id'] = getTenantId()
  return headers
}

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
