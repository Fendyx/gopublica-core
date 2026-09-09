'use client'
import { useState, useEffect, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useTenant } from '@/entities/tenant/TenantContext'
import { useBranch } from '@/entities/branch/BranchContext'
import {
  getAvailableSlots,
  findNextAvailable,
  createSlotBooking,
} from '@/entities/slot-booking/api'
import type { BookingSlot } from '@/entities/slot-booking/types'
import ConsentCheckboxes, { type ConsentState, INITIAL_CONSENT } from '@/shared/ui/ConsentCheckboxes'

const today = new Date().toISOString().split('T')[0]

type Step = 1 | 2

interface SlotBookingFormProps {
  title?: string
  subtitle?: string
  variant?: 'centered' | 'split'
  checkoutFlow?: 'inline' | 'redirect'
}

export default function SlotBookingForm({
  title,
  subtitle,
  variant = 'centered',
  checkoutFlow = 'inline',
}: SlotBookingFormProps) {
  const t = useTranslations('booking')
  const locale = useLocale()
  const tenant = useTenant()
  const { selectedBranch, loading: branchLoading } = useBranch()

  const [step, setStep] = useState<Step>(1)
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState<BookingSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null)
  const [partySize, setPartySize] = useState(1)
  const [form, setForm] = useState({ name: '', phone: '', email: '', comment: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [consent, setConsent] = useState<ConsentState>(INITIAL_CONSENT)
  const [errorMessage, setErrorMessage] = useState('')

  const set = (key: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }))

  // ── Fetch slots from database when date or branch changes ──
  const fetchSlots = useCallback(async (targetDate: string) => {
    if (!tenant?.tenantId || !selectedBranch?._id || !targetDate) return

    setSlotsLoading(true)
    setSelectedSlot(null)
    try {
      const result = await getAvailableSlots(tenant.tenantId, selectedBranch._id, targetDate)
      setSlots(result)
    } catch {
      setSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }, [tenant?.tenantId, selectedBranch?._id])

  useEffect(() => {
    if (date) fetchSlots(date)
  }, [date, fetchSlots])

  // ── Find Next Available ──
  const handleFindNextAvailable = async () => {
    if (!tenant?.tenantId || !selectedBranch?._id) return
    setSlotsLoading(true)
    try {
      const fromDate = date || today
      const fromTime = new Date().toTimeString().slice(0, 5)
      const result = await findNextAvailable(tenant.tenantId, selectedBranch._id, fromDate, fromTime)
      if (result.slot) {
        // Set the date to the found slot's date and select it
        setDate(result.slot.date)
        setSelectedSlot(result.slot)
        setStep(1) // Stay on step 1 so they can review
      }
    } catch {
      // Silent fail
    } finally {
      setSlotsLoading(false)
    }
  }

  const step1Valid = selectedSlot && partySize >= 1 && partySize <= (selectedSlot.remaining)

  // ── Submit booking ──
  const handleSubmit = async () => {
    if (!selectedBranch || !selectedSlot || !tenant?.tenantId) return

    setStatus('loading')
    setErrorMessage('')
    try {
      const result = await createSlotBooking(tenant.tenantId, {
        branchId: selectedBranch._id,
        slotId: selectedSlot._id,
        name: form.name,
        phone: form.phone,
        email: form.email,
        partySize,
        comment: form.comment,
        consents: consent as unknown as Record<string, unknown>,
      })
      // Update local slot state
      setSelectedSlot(result.slot)
      setStatus('success')
    } catch (err: any) {
      const msg = err?.message || ''
      if (msg.includes('409') || msg.includes('fully booked')) {
        setErrorMessage(t('errorSlotFull'))
      } else {
        setErrorMessage(t('error'))
      }
      setStatus('error')
    }
  }

  // ── Success screen ──
  if (status === 'success' && selectedSlot) {
    return (
      <Section variant={variant}>
        <SectionHeader title={title || t('title')} subtitle={subtitle} />
        <div className="max-w-md mx-auto">
          <div className="bg-surface-card border border-border rounded-2xl p-8 text-center shadow-card">
            <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-5">
              <IconCheck />
            </div>
            <h3 className="font-heading text-2xl text-text-primary mb-2">{t('success')}</h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-6">{t('successMessage')}</p>

            <div className="bg-surface-hover rounded-xl p-4 text-left space-y-2">
              <SummaryRow icon={<IconCalendar size={14} />} value={formatDate(selectedSlot.date, locale)} />
              <SummaryRow icon={<IconClock size={14} />} value={`${selectedSlot.startTime} – ${selectedSlot.endTime}`} />
              <SummaryRow icon={<IconPeople size={14} />} value={`${partySize} ${partySize === 1 ? t('person') : t('persons')}`} />
              <SummaryRow icon={<IconUser size={14} />} value={form.name} />
            </div>

            <button
              onClick={() => {
                setStatus('idle')
                setStep(1)
                setSelectedSlot(null)
                setPartySize(1)
                setForm({ name: '', phone: '', email: '', comment: '' })
              }}
              className="mt-6 text-xs font-semibold tracking-wider uppercase text-primary hover:underline transition-colors"
            >
              {t('newBooking')}
            </button>
          </div>
        </div>
      </Section>
    )
  }

  // ── Loading / No branch ──
  if (branchLoading) {
    return (
      <Section variant={variant}>
        <SectionHeader title={title || t('title')} subtitle={subtitle} />
        <div className="text-center py-10 text-text-secondary">{t('form.branchSelection.loading')}</div>
      </Section>
    )
  }
  if (!selectedBranch) {
    return (
      <Section variant={variant}>
        <SectionHeader title={title || t('title')} subtitle={subtitle} />
        <div className="text-center py-10 text-text-secondary">{t('form.branchSelection.prompt')}</div>
      </Section>
    )
  }

  return (
    <Section variant={variant}>
      <SectionHeader title={title || t('title')} subtitle={subtitle} />

      <div className={variant === 'split' ? 'w-full' : 'max-w-xl mx-auto'}>
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {([1, 2] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <button
                disabled={s > 1 && !step1Valid}
                onClick={() => s < step && setStep(s)}
                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border transition-all duration-200 ${
                  step === s
                    ? 'bg-primary border-primary text-white shadow-sm'
                    : step > s
                    ? 'bg-primary/10 border-primary/30 text-primary cursor-pointer'
                    : 'bg-surface-hover border-border text-text-tertiary'
                }`}
              >
                {step > s ? <IconCheckSmall /> : s}
              </button>
              <span className={`text-xs font-medium ${step === s ? 'text-text-primary' : 'text-text-tertiary'}`}>
                {s === 1 ? t('step1Label') : t('step2Label')}
              </span>
              {i === 0 && <div className="w-10 h-px bg-border mx-1" />}
            </div>
          ))}
        </div>

        <div className="bg-surface-card border border-border rounded-2xl shadow-card overflow-hidden">
          {/* ── Step 1: Date + Slot selection ── */}
          {step === 1 && (
            <div className="p-6 sm:p-8 space-y-7">
              {/* Date + Party Size row */}
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label={t('date')}>
                  <input
                    type="date"
                    min={today}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={inputCls}
                    required
                  />
                </Field>

                <Field label={t('partySize')}>
                  <div className="flex items-center gap-3 h-11 px-3 bg-surface-hover border border-border rounded-xl">
                    <StepperBtn onClick={() => setPartySize(Math.max(1, partySize - 1))}>−</StepperBtn>
                    <span className="flex-1 text-center font-semibold text-text-primary text-sm tabular-nums">
                      {partySize} {partySize === 1 ? t('person') : t('persons')}
                    </span>
                    <StepperBtn onClick={() => setPartySize(Math.min(20, partySize + 1))}>+</StepperBtn>
                  </div>
                </Field>
              </div>

              {/* Find Next Available button */}
              <button
                type="button"
                onClick={handleFindNextAvailable}
                disabled={slotsLoading}
                className="w-full py-2.5 rounded-xl border border-dashed border-primary/40 text-primary text-xs font-semibold tracking-wide hover:bg-primary/5 active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2"
              >
                <IconSearch size={14} />
                {t('findNextAvailable')}
              </button>

              {/* Slot grid */}
              {date && (
                <Field label={t('selectSlot')}>
                  {slotsLoading ? (
                    <div className="text-center py-6 text-text-secondary text-sm">{t('loadingSlots')}</div>
                  ) : slots.length === 0 ? (
                    <div className="text-center py-6 text-text-secondary text-sm">{t('noSlotsAvailable')}</div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                      {slots.map((slot) => {
                        const isFull = slot.remaining <= 0
                        const isSelected = selectedSlot?._id === slot._id
                        const fitsParty = partySize <= slot.remaining

                        return (
                          <button
                            key={slot._id}
                            type="button"
                            disabled={isFull}
                            onClick={() => setSelectedSlot(slot)}
                            className={`relative py-3 px-2 text-center rounded-xl border transition-all duration-150 ${
                              isFull
                                ? 'bg-surface-hover border-border text-text-tertiary opacity-50 cursor-not-allowed'
                                : isSelected
                                ? 'bg-primary border-primary text-white shadow-sm'
                                : !fitsParty
                                ? 'bg-surface-hover border-red-200 text-red-400 hover:border-red-300'
                                : 'bg-surface-hover border-border text-text-secondary hover:border-primary/40 hover:text-text-primary'
                            }`}
                          >
                            <div className="text-xs font-semibold tabular-nums">
                              {slot.startTime} – {slot.endTime}
                            </div>
                            <div className={`text-[10px] mt-1 ${isFull ? 'text-red-400' : isSelected ? 'text-white/80' : 'text-text-tertiary'}`}>
                              {isFull
                                ? t('full')
                                : `${slot.remaining}/${slot.capacity}`}
                            </div>
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                                <IconCheckSmall />
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </Field>
              )}

              {/* Party size warning */}
              {selectedSlot && partySize > selectedSlot.remaining && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-center">
                  {t('errorPartyTooLarge', { remaining: selectedSlot.remaining })}
                </p>
              )}

              <button
                type="button"
                disabled={!step1Valid}
                onClick={() => setStep(2)}
                className="w-full py-3.5 rounded-xl bg-primary text-white text-sm font-semibold tracking-wide disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.99] transition-all duration-150 shadow-sm"
              >
                {t('next')} →
              </button>
            </div>
          )}

          {/* ── Step 2: Contact info + confirm ── */}
          {step === 2 && selectedSlot && (
            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2 p-3 bg-surface-hover rounded-xl mb-2">
                <Chip icon={<IconCalendar size={12} />} text={formatDate(selectedSlot.date, locale)} />
                <Chip icon={<IconClock size={12} />} text={`${selectedSlot.startTime} – ${selectedSlot.endTime}`} />
                <Chip icon={<IconPeople size={12} />} text={`${partySize} ${t('persons')}`} />
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="ml-auto text-[11px] font-semibold text-primary hover:underline uppercase tracking-wider"
                >
                  {t('edit')}
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label={t('name')}>
                  <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)}
                    placeholder="John Doe" className={inputCls} required />
                </Field>
                <Field label={t('phone')}>
                  <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)}
                    placeholder="+48 123 456 789" className={inputCls} required />
                </Field>
              </div>

              <Field label={`${t('email')} (${t('optional')})`}>
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                  placeholder="your@email.com" className={inputCls} />
              </Field>

              <Field label={`${t('comment')} (${t('optional')})`}>
                <textarea
                  value={form.comment}
                  onChange={(e) => set('comment', e.target.value)}
                  placeholder={t('commentPlaceholder')}
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </Field>

              {status === 'error' && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-center">
                  {errorMessage || t('error')}
                </p>
              )}

              <ConsentCheckboxes onChange={setConsent} hideMarketing />

              <button
                type="button"
                disabled={!form.name || !form.phone || status === 'loading' || !consent.terms || !consent.privacy}
                onClick={handleSubmit}
                className="w-full py-3.5 rounded-xl bg-primary text-white text-sm font-semibold tracking-wide disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.99] transition-all duration-150 shadow-sm flex items-center justify-center gap-2"
              >
                {status === 'loading'
                  ? <><Spinner /> {t('sending')}</>
                  : t('submit')}
              </button>
            </div>
          )}
        </div>
      </div>
    </Section>
  )
}

/* ─── Helper Components ────────────────────────────────────────────────── */

function Section({ children, variant = 'centered' }: { children: React.ReactNode; variant?: 'centered' | 'split' }) {
  return (
    <section id="booking" className={variant === 'split' ? 'py-0 bg-surface-page' : 'pt-6 pb-24 bg-surface-page'}>
      <div className={variant === 'split' ? 'w-full px-4 sm:px-6' : 'max-w-5xl mx-auto px-4 sm:px-6'}>
        {children}
      </div>
    </section>
  )
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center text-center mb-14">
      <h2 className="font-heading text-4xl sm:text-5xl text-text-primary leading-tight">{title}</h2>
      {subtitle && <p className="mt-3 text-sm text-text-secondary">{subtitle}</p>}
      <div className="flex items-center gap-3 mt-5">
        <div className="h-px w-12 bg-border" />
        <div className="w-1.5 h-1.5 rounded-full bg-primary opacity-70" />
        <div className="w-1 h-1 rounded-full bg-primary opacity-40" />
        <div className="h-px w-12 bg-border" />
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold tracking-[0.15em] uppercase text-text-tertiary">{label}</label>
      {children}
    </div>
  )
}

function StepperBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className="w-7 h-7 rounded-lg bg-surface-card border border-border text-text-secondary hover:border-primary hover:text-primary flex items-center justify-center text-base font-medium leading-none transition-colors">
      {children}
    </button>
  )
}

function Chip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-card border border-border rounded-lg text-[11px] font-medium text-text-secondary">
      <span className="text-primary">{icon}</span>{text}
    </span>
  )
}

function SummaryRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return <div className="flex items-center gap-2.5 text-sm text-text-secondary"><span className="text-primary">{icon}</span><span>{value}</span></div>
}

function Spinner() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
      <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

const IconCheck = () => <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 14l7 7L23 8" /></svg>
const IconCheckSmall = () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l3 3 5-5" /></svg>
const IconCalendar = ({ size = 16 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="2.5" width="13" height="12" rx="2" /><path d="M5 1v3M11 1v3M1.5 7h13" /></svg>
const IconClock = ({ size = 16 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6.5" /><path d="M8 4.5V8l2.5 2" /></svg>
const IconPeople = ({ size = 16 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="5" r="2.5" /><path d="M1 14c0-3 2-4.5 5-4.5s5 1.5 5 4.5" /><path d="M11 7.5c1.5 0 3 .8 3 3" strokeOpacity="0.6" /><circle cx="11.5" cy="4.5" r="2" strokeOpacity="0.6" /></svg>
const IconUser = ({ size = 16 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="5.5" r="3" /><path d="M2 14c0-3.5 2.5-5.5 6-5.5s6 2 6 5.5" /></svg>
const IconSearch = ({ size = 16 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="7" r="4.5" /><path d="M14 14l-3.5-3.5" /></svg>

const inputCls = 'w-full h-11 px-4 bg-surface-hover border border-border rounded-xl text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors'

function formatDate(dateStr: string, locale: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
}
