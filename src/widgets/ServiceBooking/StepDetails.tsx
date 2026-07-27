'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { User, Phone, Mail, Car, FileText } from 'lucide-react'
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
import { CAR_MAKES, BODY_TYPES, type BodyType, type GuestInfo, type VehicleMetadata } from './types'

interface StepDetailsProps {
  guestInfo: GuestInfo
  vehicle: VehicleMetadata
  notes: string
  onGuestInfoChange: (info: GuestInfo) => void
  onVehicleChange: (vehicle: VehicleMetadata) => void
  onNotesChange: (notes: string) => void
}

const inputBase = 'h-10'

export function StepDetails({
  guestInfo,
  vehicle,
  notes,
  onGuestInfoChange,
  onVehicleChange,
  onNotesChange,
}: StepDetailsProps) {
  const t = useTranslations('serviceBooking')

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          {t('steps.details.title')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('steps.details.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Contact info */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4 rounded-2xl border border-border bg-card p-5 ring-1 ring-foreground/5"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </div>
            <h3 className="font-heading text-base font-semibold text-foreground">
              {t('forms.contact.title')}
            </h3>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">{t('forms.contact.nameLabel')}</Label>
            <Input
              id="name"
              value={guestInfo.name}
              onChange={(e) => onGuestInfoChange({ ...guestInfo, name: e.target.value })}
              placeholder={t('forms.contact.placeholderName')}
              className={inputBase}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t('forms.contact.phoneLabel')}</Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                value={guestInfo.phone}
                onChange={(e) => onGuestInfoChange({ ...guestInfo, phone: e.target.value })}
                placeholder={t('forms.contact.placeholderPhone')}
                className={`${inputBase} pl-9`}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('forms.contact.emailLabel')}</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={guestInfo.email ?? ''}
                onChange={(e) => onGuestInfoChange({ ...guestInfo, email: e.target.value })}
                placeholder={t('forms.contact.placeholderEmail')}
                className={`${inputBase} pl-9`}
              />
            </div>
          </div>
        </motion.div>

        {/* Vehicle metadata */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4 rounded-2xl border border-border bg-card p-5 ring-1 ring-foreground/5"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Car className="h-4 w-4" />
            </div>
            <h3 className="font-heading text-base font-semibold text-foreground">
              {t('forms.vehicle.title')}
            </h3>
          </div>

          <div className="space-y-2">
            <Label htmlFor="carMake">{t('forms.vehicle.makeLabel')}</Label>
            <Select
              value={vehicle.carMake}
              onValueChange={(v) => onVehicleChange({ ...vehicle, carMake: v })}
            >
              <SelectTrigger id="carMake" className={`${inputBase} w-full`}>
                <SelectValue placeholder={t('forms.vehicle.makePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {CAR_MAKES.map((make) => (
                  <SelectItem key={make} value={make}>
                    {make}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="carModel">{t('forms.vehicle.modelLabel')}</Label>
            <Input
              id="carModel"
              value={vehicle.carModel}
              onChange={(e) => onVehicleChange({ ...vehicle, carModel: e.target.value })}
              placeholder={t('forms.vehicle.modelPlaceholder')}
              className={inputBase}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bodyType">{t('forms.vehicle.bodyTypeLabel')}</Label>
            <Select
              value={vehicle.bodyType}
              onValueChange={(v) => onVehicleChange({ ...vehicle, bodyType: v as BodyType })}
            >
              <SelectTrigger id="bodyType" className={`${inputBase} w-full`}>
                <SelectValue placeholder={t('forms.vehicle.bodyTypePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {BODY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>
      </div>

      {/* Notes */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="space-y-2 rounded-2xl border border-border bg-card p-5 ring-1 ring-foreground/5"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </div>
          <Label htmlFor="notes" className="font-heading text-base font-semibold text-foreground">
            {t('forms.notes.title')}
          </Label>
        </div>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder={t('forms.notes.placeholder')}
          className="min-h-24"
        />
      </motion.div>
    </div>
  )
}
