export interface StaffScheduleSlot {
  start: string
  end: string
}

export interface StaffScheduleEntry {
  dayOfWeek: string
  start: string
  end: string
}

export interface StaffBreak {
  dayOfWeek: string
  start: string
  end: string
}

export interface StaffScheduleOverride {
  date: string
  type: 'day_off' | 'custom_hours'
  start: string | null
  end: string | null
}

export interface StaffSchedule {
  monday?: StaffScheduleSlot[]
  tuesday?: StaffScheduleSlot[]
  wednesday?: StaffScheduleSlot[]
  thursday?: StaffScheduleSlot[]
  friday?: StaffScheduleSlot[]
  saturday?: StaffScheduleSlot[]
  sunday?: StaffScheduleSlot[]
  [key: string]: StaffScheduleSlot[] | undefined
}

export interface StaffMember {
  _id: string
  tenantId: string
  branchId: string | null
  name: string
  photo: string
  role: string
  email: string
  phone: string
  languages: string[]
  specializations: string[]
  schedule: StaffSchedule
  breaks: StaffBreak[]
  overrides: StaffScheduleOverride[]
  timezone: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}
