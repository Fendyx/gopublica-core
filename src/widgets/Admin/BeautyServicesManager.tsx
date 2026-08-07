'use client'

import { useEffect, useMemo, useState } from 'react'
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
          <CardTitle>Beauty Services</CardTitle>
          <p className="text-sm text-muted-foreground">Manage services available in the beauty niche.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>Add service</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit service' : 'Create service'}</DialogTitle>
              <DialogDescription>Fill in service details and publish it in the admin panel.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Price</Label>
                <Input id="price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input id="duration" type="number" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category key</Label>
                <Input id="category" value={form.categoryKey} onChange={(e) => setForm({ ...form, categoryKey: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit}>{editingId ? 'Save' : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">Total services: {services.length} • Total duration: {totalDuration} min</div>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service, index) => (
                <TableRow key={service.id ?? `service-${index}`}>
                  <TableCell>{service.name}</TableCell>
                  <TableCell>{service.price}</TableCell>
                  <TableCell>{service.durationMinutes} min</TableCell>
                  <TableCell>{service.isActive ? 'Active' : 'Inactive'}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(service)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => void remove(service.id)}>Delete</Button>
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
