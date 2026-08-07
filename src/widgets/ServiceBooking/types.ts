export interface BeautyService {
  id: string
  name: string
  price: number
  durationMinutes: number
  categoryKey: string
  isActive: boolean
  description?: string
}

export interface BeautyMaster {
  id: string
  name: string
  services: string[]
  schedule: string
  breaks: string
  isActive: boolean
}

export interface BeautyAvailabilitySlot {
  id: string
  date: string
  startTime: string
  endTime: string
  masterId?: string
  masterName?: string
}

export interface GuestInfo {
  name: string
  phone: string
  email: string
}

export interface BookingWizardState {
  serviceId: string | null
  date: string
  masterId: string | null
  startTime: string
  endTime: string
  guestInfo: GuestInfo
}

export interface PublicBeautyAppointmentPayload {
  tenantId: string
  branchId?: string
  serviceId: string
  date: string
  masterId?: string | null
  startTime: string
  endTime: string
  guestInfo: GuestInfo
}

export const EMPTY_GUEST_INFO: GuestInfo = {
  name: '',
  phone: '',
  email: '',
}
