export interface BeautyService {
  id: string
  name: string
  price: number
  durationMinutes: number
  categoryKey: string
  isActive: boolean
}

export interface BeautyScheduleSlot {
  start: string
  end: string
}

export interface BeautySchedule {
  monday?: BeautyScheduleSlot[]
  tuesday?: BeautyScheduleSlot[]
  wednesday?: BeautyScheduleSlot[]
  thursday?: BeautyScheduleSlot[]
  friday?: BeautyScheduleSlot[]
  saturday?: BeautyScheduleSlot[]
  sunday?: BeautyScheduleSlot[]
  [key: string]: BeautyScheduleSlot[] | undefined
}

export interface BeautyMaster {
  id: string
  name: string
  services: string[]
  schedule: BeautySchedule | string
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
