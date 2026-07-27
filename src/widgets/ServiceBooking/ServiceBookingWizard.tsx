'use client'

import { useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, Calendar, Clock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useBranch } from '@/entities/branch/BranchContext'
import { apiFetch } from '@/shared/api/apiClient'
import { StepServices } from './StepServices'
import { StepDateTime } from './StepDateTime'
import { StepDetails } from './StepDetails'
import {
  MOCK_SERVICES,
  type BookingPayload,
  type GuestInfo,
  type VehicleMetadata,
} from './types'

const STEPS = [
  { id: 1, labelKey: 'steps.labels.services', icon: Sparkles },
  { id: 2, labelKey: 'steps.labels.dateTime', icon: Calendar },
  { id: 3, labelKey: 'steps.labels.details', icon: Check },
]

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
  }),
}

export default function ServiceBookingWizard() {
  const { selectedBranch, branches } = useBranch()
  const t = useTranslations('serviceBooking')
  const locale = useLocale()

  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(0)

  // Step 1 state
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])

  // Step 2 state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  // Step 3 state
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({ name: '', phone: '', email: '' })
  const [vehicle, setVehicle] = useState<VehicleMetadata>({ carMake: '', carModel: '', bodyType: '' })
  const [notes, setNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const selectedServices = useMemo(
    () => MOCK_SERVICES.filter((s) => selectedServiceIds.includes(s.id)),
    [selectedServiceIds]
  )

  const totalPrice = useMemo(
    () => selectedServices.reduce((sum, s) => sum + s.price, 0),
    [selectedServices]
  )

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const goToStep = (target: number) => {
    setDirection(target > step ? 1 : -1)
    setStep(target)
  }

  const canProceed = (): boolean => {
    if (step === 1) return selectedServiceIds.length > 0
    if (step === 2) return selectedDate !== null && selectedTime !== null
    if (step === 3) {
      return (
        guestInfo.name.trim() !== '' &&
        guestInfo.phone.trim() !== '' &&
        vehicle.carMake !== '' &&
        vehicle.carModel.trim() !== '' &&
        vehicle.bodyType !== ''
      )
    }
    return false
  }

  const handleNext = () => {
    if (!canProceed()) return
    if (step < 3) {
      goToStep(step + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (step > 1) goToStep(step - 1)
  }

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) return

    setSubmitting(true)
    // Combine date + time into a single ISO string
    const [hours, minutes] = selectedTime.split(':').map(Number)
    const startAt = new Date(selectedDate)
    startAt.setHours(hours, minutes, 0, 0)

    // Determine the branch id from the branch context
    const branchId =
      selectedBranch?._id ||
      selectedBranch?._id ||
      branches?.[0]?._id ||
      branches?.[0]?._id

    // Backend requires an endAt date — add 1 hour to startAt
    const endAt = new Date(startAt.getTime() + 60 * 60 * 1000)

    const payload: BookingPayload = {
      branchId,
      services: selectedServices,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      metadata: {
        carMake: vehicle.carMake,
        carModel: vehicle.carModel,
        bodyType: vehicle.bodyType,
      },
      guestInfo: {
        name: guestInfo.name,
        phone: guestInfo.phone,
        email: guestInfo.email,
      },
      notes,
    }

    try {
      await apiFetch('/api/saas/appointments/public', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setSubmitted(true)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Booking submission failed:', err)
      alert(t('errors.bookingSubmission'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setStep(1)
    setDirection(0)
    setSelectedServiceIds([])
    setSelectedDate(null)
    setSelectedTime(null)
    setGuestInfo({ name: '', phone: '', email: '' })
    setVehicle({ carMake: '', carModel: '', bodyType: '' })
    setNotes('')
    setSubmitted(false)
  }

  // Success screen
  if (submitted) {
    return (
      <section id="booking" className="py-16">
        <div className="mx-auto max-w-2xl px-4">
          <Card className="overflow-hidden p-0 ring-1 ring-foreground/10">
            <div className="h-1.5 w-full bg-gradient-to-r from-primary to-primary/60" />
            <div className="p-8 text-center sm:p-12">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 ring-4 ring-green-50/50 dark:bg-green-500/10 dark:ring-green-500/10"
              >
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </motion.div>
              <h2 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
                {t('success.title')}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                {t('success.message')}
              </p>

              <div className="mx-auto mt-6 max-w-sm space-y-3 rounded-xl border border-border bg-muted/30 p-5 text-left text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('summary.services')}:</span>
                  <span className="font-medium text-foreground">{selectedServices.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('summary.date')}:</span>
                  <span className="font-medium text-foreground">
                    {selectedDate?.toLocaleDateString(locale, {
                      day: 'numeric',
                      month: 'long',
                    })}{' '}
                    · {selectedTime}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('summary.estimatedCost')}:</span>
                  <span className="font-heading text-base font-semibold text-foreground">
                    {totalPrice} zł
                  </span>
                </div>
              </div>

              <Button onClick={handleReset} variant="outline" className="mt-6" size="lg">
                {t('success.newBooking')}
              </Button>
            </div>
          </Card>
        </div>
      </section>
    )
  }

  return (
    <section id="booking" className="py-16">
      <div className="mx-auto max-w-5xl px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t('hero.title')}
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            {t('hero.description')}
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-10 flex items-center justify-center">
          <div className="flex items-center gap-2 sm:gap-4">
            {STEPS.map((s, idx) => {
              const isActive = step === s.id
              const isDone = step > s.id
              const Icon = s.icon
              const label = t(s.labelKey)
              return (
                <div key={s.id} className="flex items-center gap-2 sm:gap-4">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300',
                        isActive && 'border-primary bg-primary text-primary-foreground shadow-md',
                        isDone && 'border-primary bg-primary/10 text-primary',
                        !isActive && !isDone && 'border-border bg-background text-muted-foreground'
                      )}
                    >
                      {isDone ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-xs font-medium transition-colors',
                        isActive ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={cn(
                        'h-0.5 w-8 rounded-full transition-colors duration-300 sm:w-16',
                        step > s.id ? 'bg-primary' : 'bg-border'
                      )}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step content with sliding transition */}
        <div className="relative overflow-hidden pb-28 sm:pb-24">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {step === 1 && (
                <StepServices
                  services={MOCK_SERVICES}
                  selectedIds={selectedServiceIds}
                  onToggle={toggleService}
                />
              )}
              {step === 2 && (
                <StepDateTime
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  onSelectDate={(d) => {
                    setSelectedDate(d)
                    setSelectedTime(null)
                  }}
                  onSelectTime={setSelectedTime}
                />
              )}
              {step === 3 && (
                <StepDetails
                  guestInfo={guestInfo}
                  vehicle={vehicle}
                  notes={notes}
                  onGuestInfoChange={setGuestInfo}
                  onVehicleChange={setVehicle}
                  onNotesChange={setNotes}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Sticky bottom summary bar */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
            {/* Left: summary */}
            <div className="flex min-w-0 flex-1 items-center gap-4">
              {step === 1 && (
                <>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {t('steps.services.selectedCount', { count: selectedServiceIds.length })}{' '}
                    </p>
                    <p className="font-heading text-lg font-semibold text-foreground">
                      {t('summary.total', { totalPrice, currency: t('currency') })}
                    </p>
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{t('summary.selectedDate')}</p>
                    <p className="truncate font-heading text-base font-semibold text-foreground">
                      {selectedDate
                        ? selectedDate.toLocaleDateString(locale, {
                            day: 'numeric',
                            month: 'long',
                          })
                        : t('summary.selectedDatePlaceholder')}
                      {selectedTime && (
                        <span className="ml-2 inline-flex items-center gap-1 text-sm font-normal text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {selectedTime}
                        </span>
                      )}
                    </p>
                  </div>
                </>
              )}
              {step === 3 && (
                <>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Check className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{t('summary.title')}</p>
                    <p className="truncate font-heading text-base font-semibold text-foreground">
                      {t('summary.servicesCount', { count: selectedServices.length, totalPrice, currency: t('currency') })}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Right: navigation */}
            <div className="flex shrink-0 items-center gap-2">
              {step > 1 && (
                <Button variant="outline" onClick={handleBack} size="lg" disabled={submitting}>
                  <ArrowLeft className="h-4 w-4" />
                  {t('navigation.back')}
                </Button>
              )}
              <Button
                onClick={handleNext}
                size="lg"
                disabled={!canProceed() || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('navigation.submitting')}
                  </>
                ) : step === 3 ? (
                  <>
                    {t('navigation.confirm')}
                    <Check className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    {t('navigation.next')}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
