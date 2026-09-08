import type { StaffMember, StaffScheduleOverride } from '@/entities/staff/types'
import type { StaffShift } from '@/entities/staffShift/types'
import { getDayName, toISODate, parseDate, timeToMinutes, type DayName } from '@/shared/lib/dates'

export interface CalendarEvent {
  /** Unique key for React rendering */
  id: string
  /** Staff member reference */
  staffId: string
  staffName: string
  staffRole: string
  /** Date as "YYYY-MM-DD" */
  date: string
  /** Time range */
  start: string // "HH:mm"
  end: string   // "HH:mm"
  /** Visual colour index (cycles through palette) */
  colorIndex: number
  /** Source of this event — determines styling and editability */
  source: 'shift' | 'template' | 'override' | 'break'
  /** If the shift is cancelled (day_off override) */
  isCancelled: boolean
  /** Reference to the original StaffShift document (if source='shift') */
  shiftId?: string
  /** Shift status (if source='shift') */
  shiftStatus?: StaffShift['status']
}

/**
 * Convert backend schedule data + explicit shifts into flat CalendarEvent array.
 *
 * Priority (per staff member per date):
 * 1. Explicit StaffShift records (source='shift') — highest priority
 * 2. Overrides (day_off → cancelled, custom_hours → replacement slot)
 * 3. Weekly template (StaffMember.schedule[dayName]) — fallback
 *
 * If explicit shifts exist for a date, the weekly template is ignored for that date.
 */
export function generateCalendarEvents(
  staffList: StaffMember[],
  startDate: Date,
  endDate: Date,
  explicitShifts: StaffShift[] = [],
): CalendarEvent[] {
  const events: CalendarEvent[] = []
  const activeStaff = staffList.filter((s) => s.isActive)

  // Index explicit shifts by "staffId:date" for O(1) lookup
  const shiftIndex = new Map<string, StaffShift[]>()
  for (const shift of explicitShifts) {
    const key = `${shift.staffId}:${shift.date}`
    const existing = shiftIndex.get(key)
    if (existing) {
      existing.push(shift)
    } else {
      shiftIndex.set(key, [shift])
    }
  }

  // Build a staffId → index map for colour assignment
  const staffColorMap = new Map<string, number>()
  activeStaff.forEach((s, i) => staffColorMap.set(s._id, i % 6))

  // Iterate day by day
  const cursor = new Date(startDate)
  cursor.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)

  while (cursor <= end) {
    const dateStr = toISODate(cursor)
    const dayName: DayName = getDayName(cursor)

    for (const member of activeStaff) {
      const colorIdx = staffColorMap.get(member._id) ?? 0
      const shiftKey = `${member._id}:${dateStr}`
      const dayShifts = shiftIndex.get(shiftKey)

      // ── Priority 1: Explicit shifts ──
      if (dayShifts && dayShifts.length > 0) {
        for (const shift of dayShifts) {
          if (shift.status === 'cancelled') {
            events.push({
              id: `shift-${shift._id}`,
              staffId: member._id,
              staffName: member.name,
              staffRole: member.role,
              date: dateStr,
              start: '00:00',
              end: '23:59',
              colorIndex: colorIdx,
              source: 'shift',
              isCancelled: true,
              shiftId: shift._id,
              shiftStatus: shift.status,
            })
          } else {
            events.push({
              id: `shift-${shift._id}`,
              staffId: member._id,
              staffName: member.name,
              staffRole: member.role,
              date: dateStr,
              start: shift.start,
              end: shift.end,
              colorIndex: colorIdx,
              source: 'shift',
              isCancelled: false,
              shiftId: shift._id,
              shiftStatus: shift.status,
            })
          }
        }
        // Explicit shifts exist → skip weekly template for this date
        continue
      }

      // ── Priority 2: Overrides ──
      const override = findOverride(member.overrides, dateStr)

      if (override?.type === 'day_off') {
        events.push({
          id: `${member._id}-${dateStr}-off`,
          staffId: member._id,
          staffName: member.name,
          staffRole: member.role,
          date: dateStr,
          start: '00:00',
          end: '23:59',
          colorIndex: colorIdx,
          source: 'override',
          isCancelled: true,
        })
        continue
      }

      // ── Priority 3: Weekly template ──
      let slots: { start: string; end: string }[] = []

      if (override?.type === 'custom_hours' && override.start && override.end) {
        slots = [{ start: override.start, end: override.end }]
      } else {
        const daySlots = member.schedule[dayName]
        if (daySlots && daySlots.length > 0) {
          slots = daySlots.filter((s) => s.start && s.end)
        }
      }

      if (slots.length === 0) continue

      for (const slot of slots) {
        events.push({
          id: `${member._id}-${dateStr}-${slot.start}`,
          staffId: member._id,
          staffName: member.name,
          staffRole: member.role,
          date: dateStr,
          start: slot.start,
          end: slot.end,
          colorIndex: colorIdx,
          source: override ? 'override' : 'template',
          isCancelled: false,
        })
      }

      // Breaks (visual gaps in template)
      const dayBreaks = (member.breaks || []).filter((b) => b.dayOfWeek === dayName)
      for (const brk of dayBreaks) {
        if (brk.start && brk.end) {
          events.push({
            id: `${member._id}-${dateStr}-break-${brk.start}`,
            staffId: member._id,
            staffName: member.name,
            staffRole: member.role,
            date: dateStr,
            start: brk.start,
            end: brk.end,
            colorIndex: colorIdx,
            source: 'break',
            isCancelled: false,
          })
        }
      }
    }

    cursor.setDate(cursor.getDate() + 1)
  }

  return events
}

/** Find the most specific override for a given date */
function findOverride(
  overrides: StaffScheduleOverride[] | undefined,
  dateStr: string,
): StaffScheduleOverride | undefined {
  if (!overrides?.length) return undefined
  return overrides.find((o) => o.date === dateStr)
}

/** Group events by date for efficient rendering */
export function groupEventsByDate(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>()
  for (const event of events) {
    const existing = map.get(event.date)
    if (existing) {
      existing.push(event)
    } else {
      map.set(event.date, [event])
    }
  }
  return map
}

/** Get unique staff names from events for the legend */
export function getUniqueStaff(events: CalendarEvent[]): { name: string; role: string; colorIndex: number }[] {
  const seen = new Map<string, { name: string; role: string; colorIndex: number }>()
  for (const e of events) {
    if (!seen.has(e.staffId)) {
      seen.set(e.staffId, { name: e.staffName, role: e.staffRole, colorIndex: e.colorIndex })
    }
  }
  return Array.from(seen.values())
}
