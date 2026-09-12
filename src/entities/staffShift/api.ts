import { apiFetch } from '@/shared/api/apiClient'
import { getAuthHeaders } from '@/shared/lib/authFetch'
import type {
  StaffShift,
  CreateShiftPayload,
  BulkCreateShiftsPayload,
  ApplyTemplatePayload,
} from '@/entities/staffShift/types'

const getTenantId = () => {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem('tenantId') || ''
}

/** Merges centralized auth headers with x-tenant-id for staff shift API calls. */
const buildHeaders = () => ({
  ...getAuthHeaders(),
  ...(getTenantId() ? { 'x-tenant-id': getTenantId() } : {}),
})

/** List shifts for a date range, optionally filtered by staffId */
export async function getShifts(params: { from?: string; to?: string; staffId?: string }) {
  const query = new URLSearchParams()
  if (params.from) query.set('from', params.from)
  if (params.to) query.set('to', params.to)
  if (params.staffId) query.set('staffId', params.staffId)
  const qs = query.toString()
  return apiFetch<StaffShift[]>(`/api/saas/staff-shifts${qs ? `?${qs}` : ''}`, {
    headers: buildHeaders(),
  })
}

/** Create a single shift */
export async function createShift(payload: CreateShiftPayload) {
  return apiFetch<StaffShift>('/api/saas/staff-shifts', {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })
}

/** Update a shift */
export async function updateShift(id: string, payload: Partial<StaffShift>) {
  return apiFetch<StaffShift>(`/api/saas/staff-shifts/${id}`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })
}

/** Delete a shift */
export async function deleteShift(id: string) {
  return apiFetch<{ ok: boolean }>(`/api/saas/staff-shifts/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  })
}

/** Bulk create from explicit shift array */
export async function bulkCreateShifts(payload: BulkCreateShiftsPayload) {
  return apiFetch<{ count: number; shifts: StaffShift[] }>('/api/saas/staff-shifts/bulk', {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })
}

/** Bulk create by applying weekly template to specific dates */
export async function applyTemplate(payload: ApplyTemplatePayload) {
  return apiFetch<{ count: number; shifts: StaffShift[] }>('/api/saas/staff-shifts/bulk', {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })
}
