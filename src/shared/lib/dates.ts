/**
 * Minimal date utilities — no external dependencies.
 * Uses native Date + Intl.DateTimeFormat (consistent with project conventions).
 */

/** Day names matching StaffSchedule keys */
export const DAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const

export type DayName = (typeof DAY_NAMES)[number]

/** Convert JS getDay() (0=Sun) to our DayName key */
export function getDayName(date: Date): DayName {
  return DAY_NAMES[date.getDay()]
}

/** Format a Date as "YYYY-MM-DD" for schedule override lookups */
export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Parse "YYYY-MM-DD" into a local Date (no timezone shift) */
export function parseDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Check if two dates are the same calendar day */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** Build a month grid for calendar rendering (Mon-start) */
export function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1)
  // Offset: JS getDay() is 0=Sun, we want Mon=0
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

/** Get the week (Mon–Sun) containing a date as an array of 7 Dates */
export function getWeek(date: Date): Date[] {
  const d = new Date(date)
  const day = d.getDay()
  // Shift so Monday = 0
  const offset = (day + 6) % 7
  d.setDate(d.getDate() - offset)
  const week: Date[] = []
  for (let i = 0; i < 7; i++) {
    week.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return week
}

/** Format "HH:mm" → minutes since midnight for comparison */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}
