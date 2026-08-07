'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { User, Phone, Mail } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { GuestInfo } from './types'

interface StepDetailsProps {
  guestInfo: GuestInfo
  onGuestInfoChange: (info: GuestInfo) => void
}

const inputBase = 'h-10'

export function StepDetails({ guestInfo, onGuestInfoChange }: StepDetailsProps) {
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
            Contact details
          </h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={guestInfo.name}
            onChange={(e) => onGuestInfoChange({ ...guestInfo, name: e.target.value })}
            placeholder="Your name"
            className={inputBase}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              value={guestInfo.phone}
              onChange={(e) => onGuestInfoChange({ ...guestInfo, phone: e.target.value })}
              placeholder="Your phone"
              className={`${inputBase} pl-9`}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={guestInfo.email}
              onChange={(e) => onGuestInfoChange({ ...guestInfo, email: e.target.value })}
              placeholder="Your email"
              className={`${inputBase} pl-9`}
            />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
