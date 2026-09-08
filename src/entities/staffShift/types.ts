export interface StaffShift {
  _id: string
  tenantId: string
  branchId: string | null
  staffId: string
  /** "YYYY-MM-DD" local date */
  date: string
  /** "HH:mm" start time */
  start: string
  /** "HH:mm" end time */
  end: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  notes: string
  createdAt: string
  updatedAt: string
}

/** Payload for creating a new shift */
export interface CreateShiftPayload {
  staffId: string
  date: string
  start: string
  end: string
  status?: StaffShift['status']
  notes?: string
  branchId?: string | null
}

/** Payload for bulk creating from explicit shifts */
export interface BulkCreateShiftsPayload {
  shifts: CreateShiftPayload[]
}

/** Payload for bulk creating from weekly template */
export interface ApplyTemplatePayload {
  applyTemplate: {
    staffId: string
    dates: string[]
  }
}
