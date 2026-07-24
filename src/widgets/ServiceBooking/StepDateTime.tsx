'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, CalendarDays, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TIME_SLOTS } from './types'

interface StepDateTimeProps {
  selectedDate: Date | null
  selectedTime: string | null
  onSelectDate: (date: Date) => void
  onSelectTime: (time: string) => void
}

const WEEKDAYS_PL = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd']
const MONTHS_PL = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
]

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1)
  // Monday-first offset
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (Date | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function StepDateTime({
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
}: StepDateTimeProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [viewYear, setViewYear] = useState(today.getFullYear())

  const grid = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  )

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
  const isSelectable = (date: Date) => {
    // Disable Sundays (getDay() === 0) and past dates
    return !isPast(date) && date.getDay() !== 0
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Termin Wizyty
        </h2>
        <p className="text-sm text-muted-foreground">
          Wybierz dogodny termin. Dostępne godziny pojawią się po wybraniu daty.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Calendar */}
        <div className="rounded-2xl border border-border bg-card p-5 ring-1 ring-foreground/5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <span className="font-heading text-base font-semibold text-foreground">
                {MONTHS_PL[viewMonth]} {viewYear}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={goPrevMonth}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Poprzedni miesiąc"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={goNextMonth}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Następny miesiąc"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Weekday header */}
          <div className="mb-2 grid grid-cols-7 gap-1">
            {WEEKDAYS_PL.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-medium text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1">
            {grid.map((date, idx) => {
              if (!date) return <div key={idx} className="h-10" />
              const selectable = isSelectable(date)
              const isSelected = selectedDate && isSameDay(selectedDate, date)
              const isToday = isSameDay(date, today)
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={!selectable}
                  onClick={() => onSelectDate(date)}
                  className={cn(
                    'relative flex h-10 items-center justify-center rounded-lg text-sm transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                    !selectable && 'cursor-not-allowed text-muted-foreground/40',
                    selectable && !isSelected && 'text-foreground hover:bg-muted',
                    isSelected && 'bg-primary font-semibold text-primary-foreground shadow-sm',
                    isToday && !isSelected && 'ring-1 ring-primary/40'
                  )}
                >
                  {date.getDate()}
                  {isToday && (
                    <span
                      className={cn(
                        'absolute bottom-1 h-1 w-1 rounded-full',
                        isSelected ? 'bg-primary-foreground' : 'bg-primary'
                      )}
                    />
                  )}
                </button>
              )
            })}
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            * Niedziele nie są dostępne. Wybierz inny dzień.
          </p>
        </div>

        {/* Time slots */}
        <div className="rounded-2xl border border-border bg-card p-5 ring-1 ring-foreground/5">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span className="font-heading text-base font-semibold text-foreground">
              Dostępne godziny
            </span>
          </div>

          {!selectedDate ? (
            <div className="flex h-48 flex-col items-center justify-center text-center text-sm text-muted-foreground">
              <CalendarDays className="mb-2 h-8 w-8 opacity-40" />
              Najpierw wybierz datę w kalendarzu.
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 gap-2 sm:grid-cols-3"
            >
              {TIME_SLOTS.map((slot) => {
                const isSelected = selectedTime === slot
                return (
                  <motion.button
                    key={slot}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onSelectTime(slot)}
                    className={cn(
                      'flex h-11 items-center justify-center rounded-lg border text-sm font-medium transition-all',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted'
                    )}
                  >
                    {slot}
                  </motion.button>
                )
              })}
            </motion.div>
          )}

          {selectedDate && selectedTime && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 rounded-lg bg-primary/5 px-4 py-3 text-sm text-foreground"
            >
              <span className="font-medium">Wybrany termin:</span>{' '}
              {selectedDate.toLocaleDateString('pl-PL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}{' '}
              · <span className="font-medium">{selectedTime}</span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
