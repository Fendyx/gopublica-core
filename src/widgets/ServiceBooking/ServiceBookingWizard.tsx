'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, Calendar, Clock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useBranch } from '@/entities/branch/BranchContext'
import { createPublicAppointment, getPublicServices } from '@/entities/beauty/api'
import { StepServices } from './StepServices'
import { StepDateTime } from './StepDateTime'
import { StepDetails } from './StepDetails'
import { EMPTY_GUEST_INFO, type BeautyService, type BookingWizardState, type GuestInfo } from './types'
import ConsentCheckboxes, { type ConsentState, INITIAL_CONSENT } from '@/shared/ui/ConsentCheckboxes'

const STEPS = [
  { id: 1, labelKey: 'steps.labels.services', icon: Sparkles },
  { id: 2, labelKey: 'steps.labels.dateTime', icon: Calendar },
  { id: 3, labelKey: 'steps.labels.details', icon: Check },
]

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -40 : 40, opacity: 0 }),
}

export default function ServiceBookingWizard() {
  const { selectedBranch, branches } = useBranch()
  const t = useTranslations('serviceBooking')
  const locale = useLocale()

  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(0)
  const [services, setServices] = useState<BeautyService[]>([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [wizardState, setWizardState] = useState<BookingWizardState>({
    serviceId: null,
    date: '',
    masterId: null,
    startTime: '',
    endTime: '',
    guestInfo: EMPTY_GUEST_INFO,
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [consent, setConsent] = useState<ConsentState>(INITIAL_CONSENT)

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoadingServices(true)
        const tenantId = typeof window !== 'undefined' ? window.localStorage.getItem('tenantId') || '' : ''
        const branchId = selectedBranch?._id || branches?.[0]?._id || ''
        const data = await getPublicServices(tenantId, branchId)
        setServices(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoadingServices(false)
      }
    }
    void loadServices()
  }, [branches, selectedBranch])

  const selectedService = useMemo(
    () => services.find((service) => service.id === wizardState.serviceId) ?? null,
    [services, wizardState.serviceId],
  )

  const goToStep = (target: number) => {
    setDirection(target > step ? 1 : -1)
    setStep(target)
  }

  const canProceed = (): boolean => {
    if (step === 1) return Boolean(wizardState.serviceId)
    if (step === 2) return Boolean(wizardState.date && wizardState.startTime && wizardState.endTime)
    if (step === 3) {
      return Boolean(wizardState.guestInfo.name.trim() && wizardState.guestInfo.phone.trim() && consent.terms && consent.privacy)
    }
    return false
  }

  const handleNext = () => {
    if (!canProceed()) return
    if (step < 3) {
      goToStep(step + 1)
    } else {
      void handleSubmit()
    }
  }

  const handleBack = () => {
    if (step > 1) goToStep(step - 1)
  }

  const handleSubmit = async () => {
    if (!wizardState.serviceId || !wizardState.date || !wizardState.startTime || !wizardState.endTime) return
    setSubmitting(true)
    const tenantId = typeof window !== 'undefined' ? window.localStorage.getItem('tenantId') || '' : ''
    const branchId = selectedBranch?._id || branches?.[0]?._id || ''

    try {
      await createPublicAppointment({
        tenantId,
        branchId,
        serviceId: wizardState.serviceId,
        date: wizardState.date,
        masterId: wizardState.masterId,
        startTime: wizardState.startTime,
        endTime: wizardState.endTime,
        guestInfo: wizardState.guestInfo,
        consents: consent,
      })
      setSubmitted(true)
    } catch (error) {
      console.error(error)
      alert(t('errors.bookingSubmission'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setStep(1)
    setDirection(0)
    setWizardState({
      serviceId: null,
      date: '',
      masterId: null,
      startTime: '',
      endTime: '',
      guestInfo: EMPTY_GUEST_INFO,
    })
    setSubmitted(false)
  }

  if (submitted) {
    return (
      <section id="booking" className="py-16">
        <div className="mx-auto max-w-2xl px-4">
          <Card className="overflow-hidden p-0 ring-1 ring-foreground/10">
            <div className="h-1.5 w-full bg-gradient-to-r from-primary to-primary/60" />
            <div className="p-8 text-center sm:p-12">
              <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 18 }} className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 ring-4 ring-green-50/50 dark:bg-green-500/10 dark:ring-green-500/10">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </motion.div>
              <h2 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">{t('success.title')}</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t('success.message')}</p>

              <div className="mx-auto mt-6 max-w-sm space-y-3 rounded-xl border border-border bg-muted/30 p-5 text-left text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Service:</span>
                  <span className="font-medium text-foreground">{selectedService?.name ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium text-foreground">{wizardState.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Time:</span>
                  <span className="font-medium text-foreground">{wizardState.startTime} – {wizardState.endTime}</span>
                </div>
              </div>

              <Button onClick={handleReset} variant="outline" className="mt-6" size="lg">{t('success.newBooking')}</Button>
            </div>
          </Card>
        </div>
      </section>
    )
  }

  return (
    <section id="booking" className="py-16">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{t('hero.title')}</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{t('hero.description')}</p>
        </div>

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
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300', isActive && 'border-primary bg-primary text-primary-foreground shadow-md', isDone && 'border-primary bg-primary/10 text-primary', !isActive && !isDone && 'border-border bg-background text-muted-foreground')}>
                      {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <span className={cn('text-xs font-medium transition-colors', isActive ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
                  </div>
                  {idx < STEPS.length - 1 && <div className={cn('h-0.5 w-8 rounded-full transition-colors duration-300 sm:w-16', step > s.id ? 'bg-primary' : 'bg-border')} />}
                </div>
              )
            })}
          </div>
        </div>

        <div className="relative overflow-hidden pb-28 sm:pb-24">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div key={step} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: 'easeInOut' }}>
              {step === 1 && (
                <StepServices services={services} selectedServiceId={wizardState.serviceId} onSelect={(serviceId) => setWizardState((prev) => ({ ...prev, serviceId }))} />
              )}
              {step === 2 && (
                <StepDateTime
                  tenantId={typeof window !== 'undefined' ? window.localStorage.getItem('tenantId') || '' : ''}
                  branchId={selectedBranch?._id || branches?.[0]?._id || ''}
                  serviceId={wizardState.serviceId}
                  selectedDate={wizardState.date}
                  selectedTime={wizardState.startTime}
                  selectedMasterId={wizardState.masterId}
                  onSelectDate={(date) => setWizardState((prev) => ({ ...prev, date, startTime: '', endTime: '', masterId: prev.masterId }))}
                  onSelectTime={(slot) => setWizardState((prev) => ({ ...prev, startTime: slot.startTime, endTime: slot.endTime }))}
                  onSelectMaster={(masterId) => setWizardState((prev) => ({ ...prev, masterId }))}
                />
              )}
              {step === 3 && (
                <>
                  <StepDetails guestInfo={wizardState.guestInfo} onGuestInfoChange={(guestInfo) => setWizardState((prev) => ({ ...prev, guestInfo }))} />
                  <div className="mt-4">
                    <ConsentCheckboxes onChange={setConsent} hideMarketing />
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              {step === 1 && (
                <>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Sparkles className="h-5 w-5" /></div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Selected service</p>
                    <p className="font-heading text-lg font-semibold text-foreground">{selectedService?.name ?? 'Choose a service'}</p>
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Calendar className="h-5 w-5" /></div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Selected date</p>
                    <p className="truncate font-heading text-base font-semibold text-foreground">{wizardState.date || 'Choose a date'}{wizardState.startTime ? ` · ${wizardState.startTime}` : ''}</p>
                  </div>
                </>
              )}
              {step === 3 && (
                <>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Check className="h-5 w-5" /></div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Summary</p>
                    <p className="truncate font-heading text-base font-semibold text-foreground">{selectedService?.name ?? 'Service'}</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {step > 1 && (
                <Button variant="outline" onClick={handleBack} size="lg" disabled={submitting}><ArrowLeft className="h-4 w-4" />Back</Button>
              )}
              <Button onClick={handleNext} size="lg" disabled={!canProceed() || submitting}>
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting</> : step === 3 ? <><Check className="h-4 w-4" />Confirm</> : <><ArrowRight className="h-4 w-4" />Next</>}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
