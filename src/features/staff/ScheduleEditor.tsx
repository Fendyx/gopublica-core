'use client'

import { useTranslations } from 'next-intl'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'
import type { StaffSchedule, StaffScheduleSlot } from '@/entities/staff/types'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

const DEFAULT_SLOT: StaffScheduleSlot = { start: '09:00', end: '17:00' }

function emptySchedule(): StaffSchedule {
  return {
    monday: [{ ...DEFAULT_SLOT }],
    tuesday: [{ ...DEFAULT_SLOT }],
    wednesday: [{ ...DEFAULT_SLOT }],
    thursday: [{ ...DEFAULT_SLOT }],
    friday: [{ ...DEFAULT_SLOT }],
    saturday: [{ start: '10:00', end: '15:00' }],
    sunday: [],
  }
}

interface ScheduleEditorProps {
  value: StaffSchedule
  onChange: (schedule: StaffSchedule) => void
}

export default function ScheduleEditor({ value, onChange }: ScheduleEditorProps) {
  const t = useTranslations('admin.team')

  const isDayActive = (day: string): boolean => {
    const slots = value[day]
    return !!slots && slots.length > 0
  }

  const toggleDay = (day: string) => {
    const next = { ...value }
    if (isDayActive(day)) {
      next[day] = []
    } else {
      next[day] = [{ ...DEFAULT_SLOT }]
    }
    onChange(next)
  }

  const updateSlot = (day: string, index: number, field: 'start' | 'end', val: string) => {
    const next = { ...value }
    const slots = [...(next[day] || [])]
    slots[index] = { ...slots[index], [field]: val }
    next[day] = slots
    onChange(next)
  }

  const addSlot = (day: string) => {
    const next = { ...value }
    const slots = [...(next[day] || []), { start: '12:00', end: '13:00' }]
    next[day] = slots
    onChange(next)
  }

  const removeSlot = (day: string, index: number) => {
    const next = { ...value }
    const slots = (next[day] || []).filter((_: StaffScheduleSlot, i: number) => i !== index)
    next[day] = slots
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {DAYS.map((day) => {
        const active = isDayActive(day)
        return (
          <div key={day} className="flex flex-col gap-1.5 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Switch checked={active} onCheckedChange={() => toggleDay(day)} />
                <Label className="text-sm font-medium capitalize">{t(`days.${day}`)}</Label>
              </div>
              {active && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => addSlot(day)}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  {t('addSlot')}
                </Button>
              )}
            </div>
            {active && (
              <div className="ml-8 space-y-1.5">
                {(value[day] || []).map((slot: StaffScheduleSlot, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={slot.start}
                      onChange={(e) => updateSlot(day, idx, 'start', e.target.value)}
                      className="h-8 w-32 text-xs"
                    />
                    <span className="text-xs text-muted-foreground">–</span>
                    <Input
                      type="time"
                      value={slot.end}
                      onChange={(e) => updateSlot(day, idx, 'end', e.target.value)}
                      className="h-8 w-32 text-xs"
                    />
                    {(value[day]?.length ?? 0) > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeSlot(day, idx)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export { emptySchedule }
