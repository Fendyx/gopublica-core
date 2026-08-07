'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, CalendarDays, Clock, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getAvailableSlots } from '@/entities/beauty/api'
import type { BeautyAvailabilitySlot, BeautyMaster } from './types'

interface StepDateTimeProps {
  tenantId: string
  branchId?: string
  serviceId: string | null
  selectedDate: string
  selectedTime: string
  selectedMasterId: string | null
  onSelectDate: (date: string) => void
  onSelectTime: (slot: { startTime: string; endTime: string }) => void
  onSelectMaster: (masterId: string | null) => void
}

function isSameDay(a: string, b: string) {
  return a === b
}

function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function StepDateTime({
  tenantId,
  branchId,
  serviceId,
  selectedDate,
  selectedTime,
  selectedMasterId,
  onSelectDate,
  onSelectTime,
  onSelectMaster,
}: StepDateTimeProps) {
  const t = useTranslations('serviceBooking')
  const locale = useLocale()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [slots, setSlots] = useState<BeautyAvailabilitySlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [masters, setMasters] = useState<BeautyMaster[]>([])

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth])
  const weekdayLabels = useMemo(() => Array.from({ length: 7 }, (_, idx) => new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, idx + 1))), [locale])
  const monthLabel = useMemo(() => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(viewYear, viewMonth, 1)), [locale, viewYear, viewMonth])

  useEffect(() => {
    if (!serviceId || !selectedDate) return
    const loadSlots = async () => {
      setLoadingSlots(true)
      try {
        const data = await getAvailableSlots(tenantId, branchId, serviceId, selectedDate, selectedMasterId ?? undefined)
        setSlots(data)
      } catch (error) {
        console.error(error)
        setSlots([])
      } finally {
        setLoadingSlots(false)
      }
    }
    void loadSlots()
  }, [branchId, selectedDate, selectedMasterId, serviceId, tenantId])

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const isPast = (date: Date) => date < today
  const isSelectable = (date: Date) => !isPast(date)

  useEffect(() => {
    if (!selectedDate) return
    const isSelectedInMonth = new Date(selectedDate).getMonth() === viewMonth && new Date(selectedDate).getFullYear() === viewYear
    if (!isSelectedInMonth) {
      setViewMonth(new Date(selectedDate).getMonth())
      setViewYear(new Date(selectedDate).getFullYear())
    }
  }, [selectedDate, viewMonth, viewYear])

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          {t('steps.dateTime.title')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('steps.dateTime.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 ring-1 ring-foreground/5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <span className="font-heading text-base font-semibold text-foreground">{monthLabel}</span>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={goPrevMonth} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label={t('calendar.previousMonth')}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" onClick={goNextMonth} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label={t('calendar.nextMonth')}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1">
            {weekdayLabels.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {grid.map((date, idx) => {
              if (!date) return <div key={idx} className="h-10" />
              const selectable = isSelectable(date)
              const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
              const isSelected = selectedDate === iso
              const isToday = isSameDay(iso, new Date().toISOString().slice(0, 10))
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={!selectable}
                  onClick={() => onSelectDate(iso)}
                  className={cn('relative flex h-10 items-center justify-center rounded-lg text-sm transition-all', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50', !selectable && 'cursor-not-allowed text-muted-foreground/40', selectable && !isSelected && 'text-foreground hover:bg-muted', isSelected && 'bg-primary font-semibold text-primary-foreground shadow-sm', isToday && !isSelected && 'ring-1 ring-primary/40')}
                >
                  {date.getDate()}
                  {isToday && <span className={cn('absolute bottom-1 h-1 w-1 rounded-full', isSelected ? 'bg-primary-foreground' : 'bg-primary')} />}
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 ring-1 ring-foreground/5">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span className="font-heading text-base font-semibold text-foreground">Available slots</span>
          </div>

          {!selectedDate ? (
            <div className="flex h-48 flex-col items-center justify-center text-center text-sm text-muted-foreground">
              <CalendarDays className="mb-2 h-8 w-8 opacity-40" />
              Select a date first.
            </div>
          ) : loadingSlots ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading slots…
            </div>
          ) : slots.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-center text-sm text-muted-foreground">
              No available slots for this date yet.
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 gap-2">
              {slots.map((slot) => {
                const isSelected = selectedTime === slot.startTime && selectedMasterId === (slot.masterId ?? null)
                return (
                  <motion.button
                    key={`${slot.id}-${slot.startTime}`}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      onSelectMaster(slot.masterId ?? null)
                      onSelectTime({ startTime: slot.startTime, endTime: slot.endTime })
                    }}
                    className={cn('flex items-center justify-between rounded-xl border px-3 py-3 text-left text-sm font-medium transition-all', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50', isSelected ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted')}
                  >
                    <span>{slot.startTime} – {slot.endTime}</span>
                    {slot.masterName && <span className="text-xs opacity-80">{slot.masterName}</span>}
                  </motion.button>
                )
              })}
            </motion.div>
          )}

          {selectedDate && selectedTime && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-lg bg-primary/5 px-4 py-3 text-sm text-foreground">
              <span className="font-medium">Selected</span> {selectedDate} · {selectedTime}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
