'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Check, Clock, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { BookingService } from './types'

interface StepServicesProps {
  services: BookingService[]
  selectedIds: string[]
  onToggle: (id: string) => void
}

export function StepServices({ services, selectedIds, onToggle }: StepServicesProps) {
  const t = useTranslations('serviceBooking')

  const serviceContent = {
    'svc-ceramic': {
      name: t('servicesData.ceramicCoating.name'),
      description: t('servicesData.ceramicCoating.description'),
      duration: t('servicesData.ceramicCoating.duration'),
    },
    'svc-correction': {
      name: t('servicesData.paintCorrection.name'),
      description: t('servicesData.paintCorrection.description'),
      duration: t('servicesData.paintCorrection.duration'),
    },
    'svc-interior': {
      name: t('servicesData.interiorCleaning.name'),
      description: t('servicesData.interiorCleaning.description'),
      duration: t('servicesData.interiorCleaning.duration'),
    },
    'svc-detailing': {
      name: t('servicesData.fullDetailing.name'),
      description: t('servicesData.fullDetailing.description'),
      duration: t('servicesData.fullDetailing.duration'),
    },
    'svc-wax': {
      name: t('servicesData.waxing.name'),
      description: t('servicesData.waxing.description'),
      duration: t('servicesData.waxing.duration'),
    },
    'svc-engine': {
      name: t('servicesData.engineCleaning.name'),
      description: t('servicesData.engineCleaning.description'),
      duration: t('servicesData.engineCleaning.duration'),
    },
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          {t('steps.services.title')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('steps.services.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service, idx) => {
          const isSelected = selectedIds.includes(service.id)
          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05, ease: 'easeOut' }}
            >
              <Card
                onClick={() => onToggle(service.id)}
                className={cn(
                  'group relative cursor-pointer p-5 ring-1 transition-all duration-200',
                  'hover:-translate-y-0.5 hover:shadow-lg hover:ring-foreground/20',
                  isSelected
                    ? 'ring-2 ring-primary bg-primary/5 shadow-md'
                    : 'ring-foreground/10 hover:ring-foreground/20'
                )}
              >
                {/* Selection indicator */}
                <div className="absolute right-4 top-4 flex items-center gap-2">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggle(service.id)}
                    aria-label={`${t('steps.services.selectService')}: ${serviceContent[service.id as keyof typeof serviceContent]?.name ?? service.name}`}
                    className="pointer-events-none"
                  />
                </div>

                {/* Icon */}
                <div
                  className={cn(
                    'mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition-colors',
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground group-hover:bg-foreground/5'
                  )}
                >
                  <Sparkles className="h-5 w-5" />
                </div>

                {/* Name + description */}
                <h3 className="font-heading text-base font-semibold text-foreground pr-8">
                  {serviceContent[service.id as keyof typeof serviceContent]?.name ?? service.name}
                </h3>
                {(serviceContent[service.id as keyof typeof serviceContent]?.description ?? service.description) && (
                  <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                    {serviceContent[service.id as keyof typeof serviceContent]?.description ?? service.description}
                  </p>
                )}

                {/* Meta row */}
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-heading text-lg font-semibold text-foreground">
                    {service.price} {t('currency')}
                  </span>
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {serviceContent[service.id as keyof typeof serviceContent]?.duration ?? service.duration}
                  </Badge>
                </div>

                {/* Selected overlay check */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-primary/40"
                  >
                    <div className="absolute bottom-3 left-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
