'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { createBeautyMaster, deleteBeautyMaster, getBeautyMasters, updateBeautyMaster, getBeautyServices } from '@/entities/beauty/api'
import type { BeautyMaster, BeautyService } from '@/entities/beauty/types'

const emptyMaster: Omit<BeautyMaster, 'id'> = {
  name: '',
  services: [],
  schedule: {
    monday: [{ start: '09:00', end: '18:00' }],
    tuesday: [{ start: '09:00', end: '18:00' }],
    wednesday: [{ start: '09:00', end: '18:00' }],
    thursday: [{ start: '09:00', end: '18:00' }],
    friday: [{ start: '09:00', end: '18:00' }],
    saturday: [{ start: '10:00', end: '16:00' }],
    sunday: [],
  },
  breaks: 'Lunch 13:00-14:00',
  isActive: true,
}

export default function BeautyMastersManager() {
  const t = useTranslations('admin.beautyMasters')
  const [masters, setMasters] = useState<BeautyMaster[]>([])
  const [services, setServices] = useState<BeautyService[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyMaster)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [mastersData, servicesData] = await Promise.all([getBeautyMasters(), getBeautyServices()])
      setMasters(mastersData)
      setServices(servicesData)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyMaster)
    setOpen(true)
  }

  const openEdit = (master: BeautyMaster) => {
    setEditingId(master.id)
    setForm({
      name: master.name,
      services: master.services,
      schedule: master.schedule,
      breaks: master.breaks,
      isActive: master.isActive,
    })
    setOpen(true)
  }

  const toggleService = (serviceId: string) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter((id) => id !== serviceId)
        : [...prev.services, serviceId],
    }))
  }

  const submit = async () => {
    try {
      // Формируем payload, строго соответствующий схеме бэкенда:
      // - services: массив валидных ID (строк), без пустых значений
      // - schedule: объект с днями недели и массивами слотов { start, end }
      const cleanedServices = form.services
        .map((id) => String(id).trim())
        .filter((id) => id.length > 0)

      const defaultSchedule = {
        monday: [{ start: '09:00', end: '18:00' }],
        tuesday: [{ start: '09:00', end: '18:00' }],
        wednesday: [{ start: '09:00', end: '18:00' }],
        thursday: [{ start: '09:00', end: '18:00' }],
        friday: [{ start: '09:00', end: '18:00' }],
        saturday: [{ start: '10:00', end: '16:00' }],
        sunday: [],
      }

      const payload = {
        name: form.name.trim(),
        services: cleanedServices,
        schedule: defaultSchedule,
        breaks: form.breaks,
        isActive: form.isActive,
      }

      if (editingId) {
        await updateBeautyMaster(editingId, payload)
      } else {
        await createBeautyMaster(payload)
      }
      setOpen(false)
      await loadData()
    } catch (error) {
      console.error(error)
    }
  }

  const remove = async (id: string) => {
    try {
      await deleteBeautyMaster(id)
      await loadData()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>{t('title')}</CardTitle>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>{t('addMaster')}</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? t('editMaster') : t('createMaster')}</DialogTitle>
              <DialogDescription>{t('formDescription')}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="master-name">{t('name')}</Label>
                <Input id="master-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>{t('services')}</Label>
                <div className="flex flex-wrap gap-2">
                  {services.map((service, index) => {
                    const selected = form.services.includes(service.id)
                    return (
                      <Button
                        key={service.id ?? `service-${index}`}
                        type="button"
                        variant={selected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleService(service.id)}
                      >
                        {service.name}
                      </Button>
                    )
                  })}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="schedule">{t('schedule')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('scheduleHint')}
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="breaks">{t('breaks')}</Label>
                <Input id="breaks" value={form.breaks} onChange={(e) => setForm({ ...form, breaks: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>{t('cancel')}</Button>
              <Button onClick={submit}>{editingId ? t('save') : t('create')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-sm text-muted-foreground">{t('loading')}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('tableName')}</TableHead>
                <TableHead>{t('tableServices')}</TableHead>
                <TableHead>{t('tableSchedule')}</TableHead>
                <TableHead>{t('tableStatus')}</TableHead>
                <TableHead className="text-right">{t('tableActions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {masters.map((master, index) => (
                <TableRow key={master.id ?? `master-${index}`}>
                  <TableCell>{master.name}</TableCell>
                  <TableCell>{master.services.length}</TableCell>
                  <TableCell>
                    {typeof master.schedule === 'string'
                      ? master.schedule
                      : t('scheduleFallback')}
                  </TableCell>
                  <TableCell>{master.isActive ? t('active') : t('inactive')}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(master)}>{t('edit')}</Button>
                    <Button variant="destructive" size="sm" onClick={() => void remove(master.id)}>{t('delete')}</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
