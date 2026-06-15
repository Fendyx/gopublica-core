'use client'
import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useTenant } from '@/entities/tenant/TenantContext'
import { useBranch } from '@/entities/branch/BranchContext'

const TIME_SLOTS = Array.from({ length: 21 }, (_, i) => {
  const total = 12 * 60 + i * 30
  const h = String(Math.floor(total / 60)).padStart(2, '0')
  const m = String(total % 60).padStart(2, '0')
  return `${h}:${m}`
})

const today = new Date().toISOString().split('T')[0]

type Step = 1 | 2

export default function BookingForm() {
  const t = useTranslations('booking')
  const locale = useLocale()
  const tenant = useTenant()
  const { selectedBranch, loading: branchLoading } = useBranch()

  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    date: '', time: '', guests: 2, comment: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const set = (key: keyof typeof form, value: string | number) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const step1Valid = form.date && form.time

  const handleSubmit = async () => {
    if (!selectedBranch) {
      alert(t('selectBranchFirst') || 'Выберите филиал в навигации')
      return
    }
    setStatus('loading')
    try {
      const payload = {
        branchId: selectedBranch._id,
        name: form.name,
        phone: form.phone,
        email: form.email,
        date: form.date,
        time: form.time,
        guests: form.guests,
        comment: form.comment,
      }
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/saas/reservations?tenantId=${tenant?.tenantId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      if (!res.ok) throw new Error()
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <Section>
        <SectionHeader title={t('title')} />
        <div className="max-w-md mx-auto">
          <div className="bg-surface-card border border-border rounded-2xl p-8 text-center shadow-card">
            <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-5">
              <IconCheck />
            </div>
            <h3 className="font-heading text-2xl text-text-primary mb-2">{t('success')}</h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-6">{t('successMessage')}</p>

            <div className="bg-surface-hover rounded-xl p-4 text-left space-y-2">
              <SummaryRow icon={<IconCalendar size={14} />} value={formatDate(form.date, locale)} />
              <SummaryRow icon={<IconClock size={14} />} value={form.time} />
              <SummaryRow icon={<IconPeople size={14} />} value={`${form.guests} ${t('guestsLabel')}`} />
              <SummaryRow icon={<IconUser size={14} />} value={form.name} />
            </div>

            <button
              onClick={() => { setStatus('idle'); setStep(1); setForm({ name: '', phone: '', email: '', date: '', time: '', guests: 2, comment: '' }) }}
              className="mt-6 text-xs font-semibold tracking-wider uppercase text-primary hover:underline transition-colors"
            >
              {t('newBooking')}
            </button>
          </div>
        </div>
      </Section>
    )
  }

  if (branchLoading) {
    return (
      <Section>
        <SectionHeader title={t('title')} />
        <div className="text-center py-10 text-text-secondary">Загрузка информации о филиале...</div>
      </Section>
    )
  }

  if (!selectedBranch) {
    return (
      <Section>
        <SectionHeader title={t('title')} />
        <div className="text-center py-10 text-text-secondary">Пожалуйста, выберите филиал в навигации, чтобы забронировать столик.</div>
      </Section>
    )
  }

  return (
    <Section>
      <SectionHeader title={t('title')} />

      <div className="max-w-xl mx-auto">
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
          {step === 1 && (
            <div className="p-6 sm:p-8 space-y-7">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label={t('date')}>
                  <input
                    type="date"
                    min={today}
                    value={form.date}
                    onChange={e => set('date', e.target.value)}
                    className={inputCls}
                    required
                  />
                </Field>

                <Field label={t('guests')}>
                  <div className="flex items-center gap-3 h-11 px-3 bg-surface-hover border border-border rounded-xl">
                    <StepperBtn onClick={() => set('guests', Math.max(1, form.guests - 1))}>−</StepperBtn>
                    <span className="flex-1 text-center font-semibold text-text-primary text-sm tabular-nums">
                      {form.guests} {form.guests === 1 ? t('person') : t('persons')}
                    </span>
                    <StepperBtn onClick={() => set('guests', Math.min(20, form.guests + 1))}>+</StepperBtn>
                  </div>
                </Field>
              </div>

              <Field label={t('time')}>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                  {TIME_SLOTS.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => set('time', slot)}
                      className={`py-2 text-xs font-semibold rounded-lg border transition-all duration-150 ${
                        form.time === slot
                          ? 'bg-primary border-primary text-white shadow-sm'
                          : 'bg-surface-hover border-border text-text-secondary hover:border-primary/40 hover:text-text-primary'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </Field>

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

          {step === 2 && (
            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2 p-3 bg-surface-hover rounded-xl mb-2">
                <Chip icon={<IconCalendar size={12} />} text={formatDate(form.date, locale)} />
                <Chip icon={<IconClock size={12} />} text={form.time} />
                <Chip icon={<IconPeople size={12} />} text={`${form.guests} ${t('guestsLabel')}`} />
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
                  <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                    placeholder="John Doe" className={inputCls} required />
                </Field>
                <Field label={t('phone')}>
                  <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                    placeholder="+48 123 456 789" className={inputCls} required />
                </Field>
              </div>

              <Field label={`${t('email')} (${t('optional')})`}>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  placeholder="your@email.com" className={inputCls} />
              </Field>

              <Field label={`${t('comment')} (${t('optional')})`}>
                <textarea
                  value={form.comment}
                  onChange={e => set('comment', e.target.value)}
                  placeholder={t('commentPlaceholder')}
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </Field>

              {status === 'error' && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-center">
                  {t('error')}
                </p>
              )}

              <button
                type="button"
                disabled={!form.name || !form.phone || status === 'loading'}
                onClick={handleSubmit}
                className="w-full py-3.5 rounded-xl bg-primary text-white text-sm font-semibold tracking-wide disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.99] transition-all duration-150 shadow-sm flex items-center justify-center gap-2"
              >
                {status === 'loading'
                  ? <><Spinner /> {t('sending')}</>
                  : t('submit')}
              </button>

              <p className="text-[11px] text-text-tertiary text-center leading-relaxed">
                {t('privacyNote')}
              </p>
            </div>
          )}
        </div>
      </div>
    </Section>
  )
}

/* Вспомогательные компоненты остаются без изменений */
function Section({ children }: { children: React.ReactNode }) {
  return <section id="booking" className="pt-6 pb-24 bg-surface-page"><div className="max-w-5xl mx-auto px-4 sm:px-6">{children}</div></section>
}
function SectionHeader({ title }: { title: string }) {
  return <div className="flex flex-col items-center text-center mb-14">
    <h2 className="font-heading text-4xl sm:text-5xl text-text-primary leading-tight">{title}</h2>
    <div className="flex items-center gap-3 mt-5">
      <div className="h-px w-12 bg-border" />
      <div className="w-1.5 h-1.5 rounded-full bg-primary opacity-70" />
      <div className="w-1 h-1 rounded-full bg-primary opacity-40" />
      <div className="h-px w-12 bg-border" />
    </div>
  </div>
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-semibold tracking-[0.15em] uppercase text-text-tertiary">{label}</label>
    {children}
  </div>
}
function StepperBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick}
    className="w-7 h-7 rounded-lg bg-surface-card border border-border text-text-secondary hover:border-primary hover:text-primary flex items-center justify-center text-base font-medium leading-none transition-colors">
    {children}
  </button>
}
function Chip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-card border border-border rounded-lg text-[11px] font-medium text-text-secondary">
    <span className="text-primary">{icon}</span>{text}
  </span>
}
function SummaryRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return <div className="flex items-center gap-2.5 text-sm text-text-secondary"><span className="text-primary">{icon}</span><span>{value}</span></div>
}
function Spinner() {
  return <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
    <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
}
// Icons (IconCheck, IconCheckSmall, IconCalendar, IconClock, IconPeople, IconUser) остаются без изменений...
const IconCheck = () => <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 14l7 7L23 8" /></svg>
const IconCheckSmall = () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l3 3 5-5" /></svg>
const IconCalendar = ({ size = 16 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="2.5" width="13" height="12" rx="2" /><path d="M5 1v3M11 1v3M1.5 7h13" /></svg>
const IconClock = ({ size = 16 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6.5" /><path d="M8 4.5V8l2.5 2" /></svg>
const IconPeople = ({ size = 16 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="5" r="2.5" /><path d="M1 14c0-3 2-4.5 5-4.5s5 1.5 5 4.5" /><path d="M11 7.5c1.5 0 3 .8 3 3" strokeOpacity="0.6" /><circle cx="11.5" cy="4.5" r="2" strokeOpacity="0.6" /></svg>
const IconUser = ({ size = 16 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="5.5" r="3" /><path d="M2 14c0-3.5 2.5-5.5 6-5.5s6 2 6 5.5" /></svg>

const inputCls = 'w-full h-11 px-4 bg-surface-hover border border-border rounded-xl text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors'

function formatDate(dateStr: string, locale: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
}