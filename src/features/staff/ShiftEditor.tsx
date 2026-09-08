'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { StaffMember } from '@/entities/staff/types'
import type { StaffShift, CreateShiftPayload } from '@/entities/staffShift/types'

interface ShiftEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Staff members available for assignment */
  staff: StaffMember[]
  /** Pre-selected date (YYYY-MM-DD) when clicking on calendar */
  defaultDate?: string
  /** Pre-selected staffId when clicking on a specific staff row */
  defaultStaffId?: string
  /** Existing shift to edit (null = create mode) */
  shift?: StaffShift | null
  /** Called with the payload to save */
  onSave: (payload: CreateShiftPayload, shiftId?: string) => Promise<void>
  /** Called when user wants to delete (only in edit mode) */
  onDelete?: (shiftId: string) => Promise<void>
}

export default function ShiftEditor({
  open,
  onOpenChange,
  staff,
  defaultDate,
  defaultStaffId,
  shift,
  onSave,
  onDelete,
}: ShiftEditorProps) {
  const t = useTranslations('admin.team')

  const [staffId, setStaffId] = useState(defaultStaffId || shift?.staffId || '')
  const [date, setDate] = useState(defaultDate || shift?.date || '')
  const [start, setStart] = useState(shift?.start || '09:00')
  const [end, setEnd] = useState(shift?.end || '17:00')
  const [status, setStatus] = useState<StaffShift['status']>(shift?.status || 'scheduled')
  const [notes, setNotes] = useState(shift?.notes || '')
  const [saving, setSaving] = useState(false)

  // Reset form when dialog opens with new defaults
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setStaffId(defaultStaffId || shift?.staffId || '')
      setDate(defaultDate || shift?.date || '')
      setStart(shift?.start || '09:00')
      setEnd(shift?.end || '17:00')
      setStatus(shift?.status || 'scheduled')
      setNotes(shift?.notes || '')
    }
    onOpenChange(nextOpen)
  }

  const handleSave = async () => {
    if (!staffId || !date || !start || !end) return
    setSaving(true)
    try {
      await onSave(
        {
          staffId,
          date,
          start,
          end,
          status,
          notes,
        },
        shift?._id,
      )
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!shift?._id || !onDelete) return
    setSaving(true)
    try {
      await onDelete(shift._id)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const isEdit = !!shift

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('editShift') : t('addShift')}</DialogTitle>
          <DialogDescription>{t('shiftFormDescription')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Staff member */}
          <div className="grid gap-2">
            <Label>{t('staffMember')}</Label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectStaff')} />
              </SelectTrigger>
              <SelectContent>
                {staff.map((m) => (
                  <SelectItem key={m._id} value={m._id}>
                    {m.name}{m.role ? ` · ${m.role}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="grid gap-2">
            <Label htmlFor="shift-date">{t('date')}</Label>
            <Input
              id="shift-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="shift-start">{t('startTime')}</Label>
              <Input
                id="shift-start"
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shift-end">{t('endTime')}</Label>
              <Input
                id="shift-end"
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>

          {/* Status (edit mode only) */}
          {isEdit && (
            <div className="grid gap-2">
              <Label>{t('shiftStatus')}</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as StaffShift['status'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">{t('statusScheduled')}</SelectItem>
                  <SelectItem value="confirmed">{t('statusConfirmed')}</SelectItem>
                  <SelectItem value="completed">{t('statusCompleted')}</SelectItem>
                  <SelectItem value="cancelled">{t('statusCancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="shift-notes">{t('notes')}</Label>
            <Textarea
              id="shift-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('notesPlaceholder')}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          {isEdit && onDelete ? (
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {t('delete')}
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving || !staffId || !date || !start || !end}>
              {isEdit ? t('save') : t('create')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
