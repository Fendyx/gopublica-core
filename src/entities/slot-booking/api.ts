import { apiFetch, API_BASE } from '@/shared/api/apiClient'
import type { BookingSlot, SlotBooking } from './types'

/**
 * Public API — used by the storefront SlotBookingForm.
 * These endpoints don't require auth; tenantId is passed as a query param.
 */

/** Get available slots for a date (with real-time occupancy) */
export async function getAvailableSlots(
  tenantId: string,
  branchId: string,
  date: string,
): Promise<BookingSlot[]> {
  const params = new URLSearchParams({ tenantId, branchId, date })
  return apiFetch<BookingSlot[]>(`/api/public/slot-bookings/slots?${params}`)
}

/** Find the nearest upcoming slot that still has capacity */
export async function findNextAvailable(
  tenantId: string,
  branchId: string,
  fromDate: string,
  fromTime: string,
): Promise<{ slot: BookingSlot | null; remaining: number; message?: string }> {
  const params = new URLSearchParams({ tenantId, branchId, fromDate, fromTime })
  return apiFetch(`/api/public/slot-bookings/slots/next-available?${params}`)
}

/** Create a slot booking */
export async function generateSlotsForDate(
  tenantId: string,
  branchId: string,
  date: string,
  config: {
    slotStartTime: string
    slotEndTime: string
    slotIntervalMinutes: number
    slotCapacity: number
  },
): Promise<BookingSlot[]> {
  return apiFetch<BookingSlot[]>(`/api/public/slot-bookings/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ branchId, date, tenantId, ...config }),
  })
}

/** Create a slot booking */
export async function createSlotBooking(
  tenantId: string,
  payload: {
    branchId: string
    slotId: string
    name: string
    phone: string
    email?: string
    partySize: number
    comment?: string
    consents?: Record<string, unknown>
  },
): Promise<{ booking: SlotBooking; slot: BookingSlot }> {
  const params = new URLSearchParams({ tenantId })
  return apiFetch(`/api/public/slot-bookings/book?${params}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ─── Admin API — requires saas_token ──────────────────────────────────────

function getAdminHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('saas_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/** Get slots for a date (admin view — with real-time occupancy) */
export async function getAdminSlots(
  branchId: string,
  date: string,
): Promise<BookingSlot[]> {
  const params = new URLSearchParams({ branchId, date })
  return apiFetch<BookingSlot[]>(`/api/saas/slot-bookings/slots?${params}`, {
    headers: getAdminHeaders(),
  })
}

/** Generate slots for a date (admin) */
export async function generateAdminSlots(
  branchId: string,
  date: string,
  config: {
    slotStartTime: string
    slotEndTime: string
    slotIntervalMinutes: number
    slotCapacity: number
  },
): Promise<BookingSlot[]> {
  return apiFetch('/api/saas/slot-bookings/slots/generate', {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify({ branchId, date, ...config }),
  })
}

/** Get all bookings for a slot (admin) */
export async function getSlotBookings(
  slotId: string,
): Promise<SlotBooking[]> {
  return apiFetch<SlotBooking[]>(`/api/saas/slot-bookings/slots/${slotId}/bookings`, {
    headers: getAdminHeaders(),
  })
}

/** Admin manually adds an attendee to a slot */
export async function addManualBooking(
  slotId: string,
  payload: {
    name: string
    phone: string
    email?: string
    partySize: number
    comment?: string
  },
): Promise<SlotBooking> {
  return apiFetch(`/api/saas/slot-bookings/slots/${slotId}/bookings`, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify(payload),
  })
}

/** Remove an attendee (admin) */
export async function removeBooking(bookingId: string): Promise<void> {
  await apiFetch(`/api/saas/slot-bookings/bookings/${bookingId}`, {
    method: 'DELETE',
    headers: getAdminHeaders(),
  })
}

/** Update booking status (admin) */
export async function updateBookingStatus(
  bookingId: string,
  status: 'pending' | 'confirmed' | 'cancelled',
): Promise<SlotBooking> {
  return apiFetch(`/api/saas/slot-bookings/bookings/${bookingId}/status`, {
    method: 'PATCH',
    headers: getAdminHeaders(),
    body: JSON.stringify({ status }),
  })
}
