'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { createBeautyService, deleteBeautyService, getBeautyServices, updateBeautyService } from '@/entities/beauty/api'
import type { BeautyService } from '@/entities/beauty/types'

const emptyService: Omit<BeautyService, 'id'> = {
  name: '',
  price: 0,
  durationMinutes: 30,
  categoryKey: 'general',
  isActive: true,
}

export default function BeautyServicesManager() {
  const t = useTranslations('admin.beautyServices')
  const [services, setServices] = useState<BeautyService[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyService)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const loadServices = async () => {
    try {
      setLoading(true)
      const data = await getBeautyServices()
      setServices(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadServices()
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyService)
    setOpen(true)
  }

  const openEdit = (service: BeautyService) => {
    setEditingId(service.id)
    setForm({
      name: service.name,
      price: service.price,
      durationMinutes: service.durationMinutes,
      categoryKey: service.categoryKey,
      isActive: service.isActive,
    })
    setOpen(true)
  }

  const submit = async () => {
    try {
      if (editingId) {
        await updateBeautyService(editingId, form)
      } else {
        await createBeautyService(form)
      }
      setOpen(false)
      await loadServices()
    } catch (error) {
      console.error(error)
    }
  }

  const remove = async (id: string) => {
    try {
      await deleteBeautyService(id)
      await loadServices()
    } catch (error) {
      console.error(error)
    }
  }

  const totalDuration = useMemo(() => services.reduce((sum, item) => sum + item.durationMinutes, 0), [services])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>{t('title')}</CardTitle>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>{t('addService')}</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? t('editService') : t('createService')}</DialogTitle>
              <DialogDescription>{t('formDescription')}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="name">{t('name')}</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">{t('price')}</Label>
                <Input id="price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="duration">{t('durationMinutes')}</Label>
                <Input id="duration" type="number" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">{t('categoryKey')}</Label>
                <Input id="category" value={form.categoryKey} onChange={(e) => setForm({ ...form, categoryKey: e.target.value })} />
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
        <div className="text-sm text-muted-foreground">{t('totalServices', { count: services.length })} • {t('totalDuration', { duration: totalDuration })}</div>
        {loading ? (
          <div className="text-sm text-muted-foreground">{t('loading')}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('tableName')}</TableHead>
                <TableHead>{t('tablePrice')}</TableHead>
                <TableHead>{t('tableDuration')}</TableHead>
                <TableHead>{t('tableStatus')}</TableHead>
                <TableHead className="text-right">{t('tableActions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service, index) => (
                <TableRow key={service.id ?? `service-${index}`}>
                  <TableCell>{service.name}</TableCell>
                  <TableCell>{service.price}</TableCell>
                  <TableCell>{service.durationMinutes} min</TableCell>
                  <TableCell>{service.isActive ? t('active') : t('inactive')}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(service)}>{t('edit')}</Button>
                    <Button variant="destructive" size="sm" onClick={() => void remove(service.id)}>{t('delete')}</Button>
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
