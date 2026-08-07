'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Check, Clock, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { BeautyService } from './types'

interface StepServicesProps {
  services: BeautyService[]
  selectedServiceId: string | null
  onSelect: (serviceId: string) => void
}

export function StepServices({ services, selectedServiceId, onSelect }: StepServicesProps) {
  const t = useTranslations('serviceBooking')

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
          const isSelected = selectedServiceId === service.id
          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05, ease: 'easeOut' }}
            >
              <Card
                onClick={() => onSelect(service.id)}
                className={cn(
                  'group relative cursor-pointer p-5 ring-1 transition-all duration-200',
                  'hover:-translate-y-0.5 hover:shadow-lg hover:ring-foreground/20',
                  isSelected
                    ? 'ring-2 ring-primary bg-primary/5 shadow-md'
                    : 'ring-foreground/10 hover:ring-foreground/20'
                )}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition-colors bg-muted text-muted-foreground group-hover:bg-foreground/5">
                  <Sparkles className="h-5 w-5" />
                </div>

                <h3 className="font-heading text-base font-semibold text-foreground pr-8">
                  {service.name}
                </h3>
                {service.description && (
                  <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                    {service.description}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <span className="font-heading text-lg font-semibold text-foreground">
                    {service.price} {t('currency')}
                  </span>
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {service.durationMinutes} min
                  </Badge>
                </div>

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
