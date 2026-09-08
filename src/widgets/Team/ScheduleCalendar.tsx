'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, CalendarDays, LayoutGrid, Rows3, Plus, Zap, Download, FileSpreadsheet, FileText, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  buildMonthGrid,
  getWeek,
  toISODate,
  isSameDay,
  DAY_NAMES,
  type DayName,
} from '@/shared/lib/dates'
import {
  generateCalendarEvents,
  groupEventsByDate,
  getUniqueStaff,
  type CalendarEvent,
} from '@/features/staff/generateCalendarEvents'
import { getShifts, createShift, updateShift, deleteShift } from '@/entities/staffShift/api'
import { exportToExcel, exportToPDF, type ExportScope } from '@/shared/lib/exportSchedule'
import type { StaffMember } from '@/entities/staff/types'
import type { StaffShift, CreateShiftPayload } from '@/entities/staffShift/types'
import ShiftEditor from '@/features/staff/ShiftEditor'

/* ── Colour palette for staff members (Tailwind classes) ──────────────────── */
const STAFF_COLORS = [
  { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-800 dark:text-blue-200', border: 'border-blue-300 dark:border-blue-700', solid: 'bg-blue-500' },
  { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-800 dark:text-emerald-200', border: 'border-emerald-300 dark:border-emerald-700', solid: 'bg-emerald-500' },
  { bg: 'bg-violet-100 dark:bg-violet-900/40', text: 'text-violet-800 dark:text-violet-200', border: 'border-violet-300 dark:border-violet-700', solid: 'bg-violet-500' },
  { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-800 dark:text-amber-200', border: 'border-amber-300 dark:border-amber-700', solid: 'bg-amber-500' },
  { bg: 'bg-rose-100 dark:bg-rose-900/40', text: 'text-rose-800 dark:text-rose-200', border: 'border-rose-300 dark:border-rose-700', solid: 'bg-rose-500' },
  { bg: 'bg-cyan-100 dark:bg-cyan-900/40', text: 'text-cyan-800 dark:text-cyan-200', border: 'border-cyan-300 dark:border-cyan-700', solid: 'bg-cyan-500' },
]

function getStaffColor(index: number) {
  return STAFF_COLORS[index % STAFF_COLORS.length]
}

type ViewMode = 'week' | 'month'

interface ScheduleCalendarProps {
  staff: StaffMember[]
}

export default function ScheduleCalendar({ staff }: ScheduleCalendarProps) {
  const t = useTranslations('admin.team')
  const locale = useLocale()

  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [referenceDate, setReferenceDate] = useState(today)

  // ── Explicit shifts state ──
  const [shifts, setShifts] = useState<StaffShift[]>([])
  const [loadingShifts, setLoadingShifts] = useState(false)

  // ── Shift editor state ──
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingShift, setEditingShift] = useState<StaffShift | null>(null)
  const [defaultDate, setDefaultDate] = useState<string>('')
  const [defaultStaffId, setDefaultStaffId] = useState<string>('')

  // ── Date range for current view ──
  const { startDate, endDate, dates } = useMemo(() => {
    if (viewMode === 'week') {
      const week = getWeek(referenceDate)
      return { startDate: week[0], endDate: week[6], dates: week }
    }
    const grid = buildMonthGrid(referenceDate.getFullYear(), referenceDate.getMonth())
    const validDates = grid.filter(Boolean) as Date[]
    return {
      startDate: validDates[0],
      endDate: validDates[validDates.length - 1],
      dates: grid,
    }
  }, [viewMode, referenceDate])

  // ── Fetch shifts for visible date range ──
  const fetchShifts = useCallback(async () => {
    setLoadingShifts(true)
    try {
      const data = await getShifts({
        from: toISODate(startDate),
        to: toISODate(endDate),
      })
      setShifts(data)
    } catch (err) {
      console.error('Failed to load shifts:', err)
    } finally {
      setLoadingShifts(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    void fetchShifts()
  }, [fetchShifts])

  // ── Generate events (merges explicit shifts + weekly template) ──
  const events = useMemo(
    () => generateCalendarEvents(staff, startDate, endDate, shifts),
    [staff, startDate, endDate, shifts],
  )
  const eventsByDate = useMemo(() => groupEventsByDate(events), [events])
  const staffLegend = useMemo(() => getUniqueStaff(events), [events])

  // ── Shift CRUD handlers ──
  const handleSaveShift = useCallback(
    async (payload: CreateShiftPayload, shiftId?: string) => {
      if (shiftId) {
        await updateShift(shiftId, payload)
      } else {
        await createShift(payload)
      }
      await fetchShifts()
    },
    [fetchShifts],
  )

  const handleDeleteShift = useCallback(
    async (shiftId: string) => {
      await deleteShift(shiftId)
      await fetchShifts()
    },
    [fetchShifts],
  )

  // ── Export handler ──
  const [exporting, setExporting] = useState(false)

  const handleExport = useCallback(
    async (format: 'excel' | 'pdf', scope: ExportScope, targetStaffId?: string, targetStaffName?: string) => {
      setExporting(true)
      try {
        const label = viewMode === 'week'
          ? `${new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric' }).format(startDate)} – ${new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric', year: 'numeric' }).format(endDate)}`
          : new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(referenceDate)

        const baseName = scope === 'single' && targetStaffName
          ? `schedule-${targetStaffName.replace(/\s+/g, '-').toLowerCase()}`
          : 'schedule-team'

        const filename = `${baseName}-${toISODate(startDate)}-to-${toISODate(endDate)}`

        const exportFn = format === 'excel' ? exportToExcel : exportToPDF
        exportFn(events, {
          format,
          scope,
          staffId: targetStaffId,
          staffName: targetStaffName,
          dateRangeLabel: label,
          filename,
        })
      } catch (err) {
        console.error('Export failed:', err)
      } finally {
        setExporting(false)
      }
    },
    [events, startDate, endDate, viewMode, locale, referenceDate],
  )

  // ── Click to add shift ──
  const openAddShift = useCallback((date?: string, staffId?: string) => {
    setEditingShift(null)
    setDefaultDate(date || toISODate(new Date()))
    setDefaultStaffId(staffId || '')
    setEditorOpen(true)
  }, [])

  const openEditShift = useCallback((event: CalendarEvent) => {
    if (!event.shiftId) return
    const shift = shifts.find((s) => s._id === event.shiftId)
    if (!shift) return
    setEditingShift(shift)
    setDefaultDate('')
    setDefaultStaffId('')
    setEditorOpen(true)
  }, [shifts])

  // ── Navigation ──
  const navigatePrev = () => {
    const d = new Date(referenceDate)
    if (viewMode === 'week') d.setDate(d.getDate() - 7)
    else d.setMonth(d.getMonth() - 1)
    setReferenceDate(d)
  }
  const navigateNext = () => {
    const d = new Date(referenceDate)
    if (viewMode === 'week') d.setDate(d.getDate() + 7)
    else d.setMonth(d.getMonth() + 1)
    setReferenceDate(d)
  }
  const goToday = () => setReferenceDate(new Date(today))

  // ── Header label ──
  const headerLabel = useMemo(() => {
    if (viewMode === 'week') {
      const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }
      return `${new Intl.DateTimeFormat(locale, opts).format(startDate)} – ${new Intl.DateTimeFormat(locale, opts).format(endDate)}`
    }
    return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(referenceDate)
  }, [viewMode, referenceDate, startDate, endDate, locale])

  // ── Weekday headers ──
  const weekdayLabels = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, i + 1)),
      ),
    [locale],
  )

  // ── Time slots for vertical axis (06:00–22:00) ──
  const timeSlots = useMemo(() => {
    const slots: string[] = []
    for (let h = 6; h <= 22; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`)
    }
    return slots
  }, [])

  // ── Count of explicit shifts in current view ──
  const shiftCount = shifts.length

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            {t('scheduleCalendar')}
            {shiftCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                <Zap className="mr-1 h-3 w-3" />
                {shiftCount} {t('shiftsLabel')}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => openAddShift()}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              {t('addShift')}
            </Button>
            {/* Export dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8" disabled={exporting || events.length === 0}>
                  <Download className="mr-1 h-3.5 w-3.5" />
                  {exporting ? t('exporting') : t('export')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('excel', 'all')}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  {t('exportAllExcel')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf', 'all')}>
                  <FileText className="mr-2 h-4 w-4" />
                  {t('exportAllPdf')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled className="text-xs text-muted-foreground px-2">
                  <User className="mr-2 h-3 w-3" />
                  {t('exportSingleHint')}
                </DropdownMenuItem>
                {staffLegend.map((s) => {
                  const staffMember = staff.find((m) => m.name === s.name)
                  if (!staffMember) return null
                  return (
                    <DropdownMenuItem
                      key={s.name}
                      onClick={() => handleExport('pdf', 'single', staffMember._id, s.name)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      {s.name} (PDF)
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* View toggle */}
            <div className="flex rounded-md border">
              <Button
                variant={viewMode === 'week' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 rounded-r-none px-3"
                onClick={() => setViewMode('week')}
              >
                <Rows3 className="mr-1 h-3.5 w-3.5" />
                {t('weekView')}
              </Button>
              <Button
                variant={viewMode === 'month' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 rounded-l-none px-3"
                onClick={() => setViewMode('month')}
              >
                <LayoutGrid className="mr-1 h-3.5 w-3.5" />
                {t('monthView')}
              </Button>
            </div>
            {/* Navigation */}
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={navigatePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={goToday}>
              {t('today')}
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground text-center">{headerLabel}</p>

          {loadingShifts ? (
            <div className="text-sm text-muted-foreground text-center py-8">{t('loading')}</div>
          ) : viewMode === 'week' ? (
            <WeekView
              dates={dates as Date[]}
              eventsByDate={eventsByDate}
              staff={staff}
              timeSlots={timeSlots}
              weekdayLabels={weekdayLabels}
              today={today}
              onDayClick={openAddShift}
              onEventClick={openEditShift}
            />
          ) : (
            <MonthView
              dates={dates as (Date | null)[]}
              eventsByDate={eventsByDate}
              staff={staff}
              weekdayLabels={weekdayLabels}
              today={today}
              onDayClick={openAddShift}
            />
          )}

          {/* Legend */}
          {staffLegend.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 border-t text-xs text-muted-foreground">
              {staffLegend.map((s) => {
                const color = getStaffColor(s.colorIndex)
                return (
                  <div key={s.name} className="flex items-center gap-1.5">
                    <span className={cn('h-2.5 w-2.5 rounded-sm', color.bg, color.border, 'border')} />
                    <span>
                      {s.name}
                      {s.role && <span className="ml-1 opacity-60">· {s.role}</span>}
                    </span>
                  </div>
                )
              })}
              <div className="flex items-center gap-1.5 ml-2">
                <span className="h-2.5 w-2.5 rounded-sm bg-primary/30 border border-primary/50" />
                <span>{t('legendTemplate')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm border-2 border-primary" />
                <span>{t('legendShift')}</span>
              </div>
            </div>
          )}

          {events.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarDays className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">{t('noScheduleData')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shift Editor Dialog */}
      <ShiftEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        staff={staff}
        defaultDate={defaultDate}
        defaultStaffId={defaultStaffId}
        shift={editingShift}
        onSave={handleSaveShift}
        onDelete={handleDeleteShift}
      />
    </>
  )
}

/* ──────────────────────────────────────────────────────────────────────────────
   WEEK VIEW — Columns per day, time rows, shift blocks
   ────────────────────────────────────────────────────────────────────────────── */

function WeekView({
  dates,
  eventsByDate,
  staff,
  timeSlots,
  weekdayLabels,
  today,
  onDayClick,
  onEventClick,
}: {
  dates: Date[]
  eventsByDate: Map<string, CalendarEvent[]>
  staff: StaffMember[]
  timeSlots: string[]
  weekdayLabels: string[]
  today: Date
  onDayClick?: (date: string, staffId?: string) => void
  onEventClick?: (event: CalendarEvent) => void
}) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Day headers */}
        <div className="grid grid-cols-[100px_repeat(7,1fr)] border-b">
          <div className="p-2" />
          {dates.map((date, i) => {
            const isToday = isSameDay(date, today)
            return (
              <div
                key={i}
                className={cn(
                  'p-2 text-center border-l cursor-pointer hover:bg-muted/50 transition-colors',
                  isToday && 'bg-primary/5',
                )}
                onClick={() => onDayClick?.(toISODate(date))}
              >
                <div className="text-xs text-muted-foreground">{weekdayLabels[i]}</div>
                <div
                  className={cn(
                    'text-lg font-semibold',
                    isToday && 'text-primary',
                  )}
                >
                  {date.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        {/* Time grid */}
        <div className="relative">
          {timeSlots.map((time) => (
            <div key={time} className="grid grid-cols-[100px_repeat(7,1fr)] border-b border-dashed h-12">
              <div className="p-1 pr-2 text-right text-xs text-muted-foreground pt-0">
                {time}
              </div>
              {dates.map((date, colIdx) => {
                const dateStr = toISODate(date)
                const dayEvents = eventsByDate.get(dateStr) || []
                const hour = parseInt(time)
                const startingEvents = dayEvents.filter((e) => {
                  if (e.isCancelled) return false
                  const startH = parseInt(e.start)
                  return startH === hour
                })
                const isToday = isSameDay(date, today)

                return (
                  <div
                    key={colIdx}
                    className={cn(
                      'border-l p-0.5 relative cursor-pointer hover:bg-muted/30 transition-colors',
                      isToday && 'bg-primary/5',
                    )}
                    onClick={(ev) => {
                      // Only fire day click if not clicking on an event
                      if (ev.target === ev.currentTarget) {
                        onDayClick?.(dateStr)
                      }
                    }}
                  >
                    {startingEvents.map((event) => {
                      const startH = parseInt(event.start)
                      const endH = parseInt(event.end.split(':')[0])
                      const spanHours = Math.max(1, endH - startH)
                      const color = getStaffColor(event.colorIndex)
                      const isShift = event.source === 'shift'

                      return (
                        <div
                          key={event.id}
                          className={cn(
                            'rounded px-1.5 py-0.5 text-[10px] leading-tight border font-medium absolute inset-x-0.5 z-10 overflow-hidden transition-all',
                            color.bg,
                            color.text,
                            color.border,
                            isShift && 'border-2 ring-1 ring-primary/20',
                            !isShift && 'opacity-80 border-dashed',
                          )}
                          style={{
                            top: '2px',
                            height: `calc(${spanHours * 100}% - 4px)`,
                          }}
                          title={`${event.staffName} (${event.staffRole}): ${event.start}–${event.end}${isShift ? ' [shift]' : ' [template]'}`}
                          onClick={(ev) => {
                            ev.stopPropagation()
                            if (isShift && event.shiftId) {
                              onEventClick?.(event)
                            }
                          }}
                        >
                          <div className="truncate font-semibold">{event.staffName}</div>
                          <div className="truncate opacity-75">
                            {event.start}–{event.end}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────────
   MONTH VIEW — Calendar grid with shift chips per day
   ────────────────────────────────────────────────────────────────────────────── */

function MonthView({
  dates,
  eventsByDate,
  staff,
  weekdayLabels,
  today,
  onDayClick,
}: {
  dates: (Date | null)[]
  eventsByDate: Map<string, CalendarEvent[]>
  staff: StaffMember[]
  weekdayLabels: string[]
  today: Date
  onDayClick?: (date: string, staffId?: string) => void
}) {
  const t = useTranslations('admin.team')
  return (
    <div className="overflow-x-auto">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b">
        {weekdayLabels.map((label) => (
          <div key={label} className="p-2 text-center text-xs font-medium text-muted-foreground">
            {label}
          </div>
        ))}
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-7 border-l">
        {dates.map((date, i) => {
          if (!date) {
            return <div key={`empty-${i}`} className="min-h-[100px] border-b border-r bg-muted/20" />
          }

          const dateStr = toISODate(date)
          const dayEvents = eventsByDate.get(dateStr) || []
          const shiftEvents = dayEvents.filter((e) => !e.isCancelled)
          const cancelledEvents = dayEvents.filter((e) => e.isCancelled)
          const isToday = isSameDay(date, today)

          return (
            <div
              key={dateStr}
              className={cn(
                'min-h-[100px] border-b border-r p-1.5 cursor-pointer hover:bg-muted/30 transition-colors',
                isToday && 'bg-primary/5',
              )}
              onClick={() => onDayClick?.(dateStr)}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    'text-xs font-medium',
                    isToday && 'bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center',
                  )}
                >
                  {date.getDate()}
                </span>
                {cancelledEvents.length > 0 && (
                  <Badge variant="outline" className="text-[9px] h-4 px-1 text-muted-foreground border-dashed">
                    {t('dayOffShort')}
                  </Badge>
                )}
              </div>

              {/* Shift chips */}
              <div className="space-y-0.5">
                {shiftEvents.slice(0, 4).map((event) => {
                  const color = getStaffColor(event.colorIndex)
                  const isShift = event.source === 'shift'
                  return (
                    <div
                      key={event.id}
                      className={cn(
                        'rounded px-1 py-0.5 text-[10px] leading-tight border truncate',
                        color.bg,
                        color.text,
                        color.border,
                        isShift && 'border-2',
                        !isShift && 'opacity-80 border-dashed',
                      )}
                      title={`${event.staffName}: ${event.start}–${event.end}${isShift ? ' [shift]' : ''}`}
                    >
                      {isShift && <span className="mr-0.5 text-primary">●</span>}
                      <span className="font-medium">{event.staffName.split(' ')[0]}</span>
                      <span className="opacity-60 ml-1">
                        {event.start}–{event.end}
                      </span>
                    </div>
                  )
                })}
                {shiftEvents.length > 4 && (
                  <div className="text-[10px] text-muted-foreground pl-1">
                    +{shiftEvents.length - 4} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
