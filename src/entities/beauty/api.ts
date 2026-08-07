import { apiFetch } from '@/shared/api/apiClient'
import type { BeautyAvailabilitySlot, BeautyMaster, BeautyService } from '@/entities/beauty/types'
import type { PublicBeautyAppointmentPayload } from '@/widgets/ServiceBooking/types'

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

export async function getBeautyServices() {
  return apiFetch<BeautyService[]>('/api/saas/beauty/services', { headers: buildHeaders() })
}

export async function createBeautyService(payload: Omit<BeautyService, 'id'>) {
  return apiFetch<BeautyService>('/api/saas/beauty/services', {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })
}

export async function updateBeautyService(id: string, payload: Partial<BeautyService>) {
  return apiFetch<BeautyService>(`/api/saas/beauty/services/${id}`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })
}

export async function deleteBeautyService(id: string) {
  return apiFetch<{ ok: boolean }>(`/api/saas/beauty/services/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  })
}

export async function getBeautyMasters() {
  return apiFetch<BeautyMaster[]>('/api/saas/beauty/masters', { headers: buildHeaders() })
}

export async function createBeautyMaster(payload: Omit<BeautyMaster, 'id'>) {
  return apiFetch<BeautyMaster>('/api/saas/beauty/masters', {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })
}

export async function updateBeautyMaster(id: string, payload: Partial<BeautyMaster>) {
  return apiFetch<BeautyMaster>(`/api/saas/beauty/masters/${id}`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })
}

export async function deleteBeautyMaster(id: string) {
  return apiFetch<{ ok: boolean }>(`/api/saas/beauty/masters/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  })
}

export async function getPublicServices(tenantId: string, branchId?: string) {
  const headers = buildHeaders()
  if (tenantId) headers['x-tenant-id'] = tenantId
  const query = branchId ? `?branchId=${encodeURIComponent(branchId)}` : ''
  return apiFetch<BeautyService[]>(`/api/saas/beauty/public/services${query}`, { headers })
}

export async function getAvailableSlots(tenantId: string, branchId: string | undefined, serviceId: string, date: string, masterId?: string) {
  const headers = buildHeaders()
  if (tenantId) headers['x-tenant-id'] = tenantId
  const params = new URLSearchParams({ serviceId, date })
  if (branchId) params.set('branchId', branchId)
  if (masterId) params.set('masterId', masterId)
  return apiFetch<BeautyAvailabilitySlot[]>(`/api/saas/beauty/public/availability?${params.toString()}`, { headers })
}

export async function createPublicAppointment(payload: PublicBeautyAppointmentPayload) {
  const headers = buildHeaders()
  if (payload.tenantId) headers['x-tenant-id'] = payload.tenantId
  return apiFetch<{ ok: boolean }>('/api/saas/beauty/public/appointments', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
}
