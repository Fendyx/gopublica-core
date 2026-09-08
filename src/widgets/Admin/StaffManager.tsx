'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import { getStaffMembers, createStaffMember, updateStaffMember, deleteStaffMember } from '@/entities/staff/api'
import type { StaffMember, StaffSchedule, StaffBreak } from '@/entities/staff/types'
import ScheduleEditor, { emptySchedule } from '@/features/staff/ScheduleEditor'
import ScheduleCalendar from '@/widgets/Team/ScheduleCalendar'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

function emptyForm(branchId?: string | null): Omit<StaffMember, '_id' | 'tenantId' | 'createdAt' | 'updatedAt'> {
  return {
    branchId: branchId || null,
    name: '',
    photo: '',
    role: '',
    email: '',
    phone: '',
    languages: [],
    specializations: [],
    schedule: emptySchedule(),
    breaks: [] as StaffBreak[],
    overrides: [],
    timezone: 'Europe/Warsaw',
    isActive: true,
    sortOrder: 0,
  }
}

function scheduleSummary(schedule: StaffSchedule): string {
  const activeDays = DAYS.filter((d) => schedule[d] && schedule[d]!.length > 0)
  if (activeDays.length === 0) return '—'
  return `${activeDays.length}/7 ${activeDays.length === 7 ? '(everyday)' : ''}`
}

export default function StaffManager({ selectedBranch }: { selectedBranch?: string }) {
  const t = useTranslations('admin.team')
  const [members, setMembers] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [languagesInput, setLanguagesInput] = useState('')
  const [specsInput, setSpecsInput] = useState('')

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await getStaffMembers(selectedBranch)
      setMembers(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [selectedBranch])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm(selectedBranch))
    setLanguagesInput('')
    setSpecsInput('')
    setOpen(true)
  }

  const openEdit = (member: StaffMember) => {
    setEditingId(member._id)
    setForm({
      branchId: member.branchId,
      name: member.name,
      photo: member.photo,
      role: member.role,
      email: member.email,
      phone: member.phone,
      languages: member.languages || [],
      specializations: member.specializations || [],
      schedule: member.schedule || emptySchedule(),
      breaks: member.breaks || [],
      overrides: member.overrides || [],
      timezone: member.timezone || 'Europe/Warsaw',
      isActive: member.isActive,
      sortOrder: member.sortOrder,
    })
    setLanguagesInput((member.languages || []).join(', '))
    setSpecsInput((member.specializations || []).join(', '))
    setOpen(true)
  }

  const submit = async () => {
    try {
      const payload = {
        ...form,
        branchId: form.branchId || selectedBranch || null,
        name: form.name.trim(),
        role: form.role.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        languages: languagesInput
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        specializations: specsInput
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      }

      if (editingId) {
        await updateStaffMember(editingId, payload)
      } else {
        await createStaffMember(payload)
      }
      setOpen(false)
      await loadData()
    } catch (error) {
      console.error(error)
    }
  }

  const remove = async (id: string) => {
    try {
      await deleteStaffMember(id)
      await loadData()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('title')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-1 h-4 w-4" />
              {t('addMember')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? t('editMember') : t('createMember')}</DialogTitle>
              <DialogDescription>{t('formDescription')}</DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">{t('tabProfile')}</TabsTrigger>
                <TabsTrigger value="schedule">{t('tabSchedule')}</TabsTrigger>
                <TabsTrigger value="details">{t('tabDetails')}</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-4 pt-2">
                <div className="grid gap-2">
                  <Label htmlFor="staff-name">{t('name')} *</Label>
                  <Input
                    id="staff-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={t('namePlaceholder')}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="staff-role">{t('role')}</Label>
                  <Input
                    id="staff-role"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    placeholder={t('rolePlaceholder')}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="staff-email">{t('email')}</Label>
                    <Input
                      id="staff-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="staff-phone">{t('phone')}</Label>
                    <Input
                      id="staff-phone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="staff-photo">{t('photo')}</Label>
                  <Input
                    id="staff-photo"
                    value={form.photo}
                    onChange={(e) => setForm({ ...form, photo: e.target.value })}
                    placeholder={t('photoPlaceholder')}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                  />
                  <Label>{t('active')}</Label>
                </div>
              </TabsContent>

              {/* Schedule Tab */}
              <TabsContent value="schedule" className="pt-2">
                <ScheduleEditor
                  value={form.schedule}
                  onChange={(schedule) => setForm({ ...form, schedule })}
                />
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4 pt-2">
                <div className="grid gap-2">
                  <Label htmlFor="staff-langs">{t('languages')}</Label>
                  <Input
                    id="staff-langs"
                    value={languagesInput}
                    onChange={(e) => setLanguagesInput(e.target.value)}
                    placeholder={t('languagesPlaceholder')}
                  />
                  <p className="text-xs text-muted-foreground">{t('commaSeparatedHint')}</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="staff-specs">{t('specializations')}</Label>
                  <Input
                    id="staff-specs"
                    value={specsInput}
                    onChange={(e) => setSpecsInput(e.target.value)}
                    placeholder={t('specializationsPlaceholder')}
                  />
                  <p className="text-xs text-muted-foreground">{t('commaSeparatedHint')}</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="staff-timezone">{t('timezone')}</Label>
                  <Input
                    id="staff-timezone"
                    value={form.timezone}
                    onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={submit} disabled={!form.name.trim()}>
                {editingId ? t('save') : t('create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-sm text-muted-foreground">{t('loading')}</div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">{t('noMembers')}</p>
          </div>
        ) : (
          <Tabs defaultValue="members" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="members">{t('tabMembers')}</TabsTrigger>
              <TabsTrigger value="schedule">{t('tabSchedule')}</TabsTrigger>
            </TabsList>
            <TabsContent value="members">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('tableName')}</TableHead>
                    <TableHead>{t('tableRole')}</TableHead>
                    <TableHead>{t('tableContact')}</TableHead>
                    <TableHead>{t('tableSchedule')}</TableHead>
                    <TableHead>{t('tableStatus')}</TableHead>
                    <TableHead className="text-right">{t('tableActions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member._id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell className="text-muted-foreground">{member.role || '—'}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {member.email || member.phone || '—'}
                      </TableCell>
                      <TableCell className="text-sm">{scheduleSummary(member.schedule)}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            member.isActive
                              ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          }`}
                        >
                          {member.isActive ? t('active') : t('inactive')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(member)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => void remove(member._id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="schedule">
              <ScheduleCalendar staff={members} />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
