'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useTenant } from '@/entities/tenant/TenantContext';
import { useBranch } from '@/entities/branch/BranchContext';
import ConsentCheckboxes, { type ConsentState, INITIAL_CONSENT } from '@/shared/ui/ConsentCheckboxes';
import type { BranchSection } from '@/entities/branch-section/types';

interface SystemBookingCheckoutProps {
  section: BranchSection;
  locale: string;
  tenantDomain: string;
}

export default function SystemBookingCheckoutSection({
  section,
  locale,
  tenantDomain,
}: SystemBookingCheckoutProps) {
  const t = useTranslations('booking');
  const tenant = useTenant();
  const { selectedBranch } = useBranch();
  const searchParams = useSearchParams();

  const bookingDate = searchParams.get('date') || '';
  const bookingTime = searchParams.get('time') || '';
  const bookingGuests = searchParams.get('guests') || '2';

  const [form, setForm] = useState({ name: '', phone: '', email: '', comment: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [consent, setConsent] = useState<ConsentState>(INITIAL_CONSENT);

  const set = (key: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const guests = parseInt(bookingGuests || '2', 10);
  const time = bookingTime || '';
  const date = bookingDate || '';

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleSubmit = async () => {
    if (!selectedBranch) return;
    setStatus('loading');
    try {
      const payload = {
        branchId: selectedBranch._id,
        name: form.name,
        phone: form.phone,
        email: form.email,
        date,
        time,
        guests,
        comment: form.comment,
        consents: consent,
      };
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/saas/reservations?tenantId=${tenant?.tenantId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error();
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <section className="py-12 bg-surface-page">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <div className="bg-surface-card border border-border rounded-2xl p-8 text-center shadow-card">
            <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-5">
              <IconCheck />
            </div>
            <h3 className="font-heading text-2xl text-text-primary mb-2">{t('success')}</h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-6">{t('successMessage')}</p>

            <div className="bg-surface-hover rounded-xl p-4 text-left space-y-2">
              <SummaryRow icon={<IconCalendar size={14} />} value={formatDate(date)} />
              <SummaryRow icon={<IconClock size={14} />} value={time} />
              <SummaryRow icon={<IconPeople size={14} />} value={`${guests} ${t('guestsLabel')}`} />
              <SummaryRow icon={<IconUser size={14} />} value={form.name} />
            </div>

            <button
              onClick={() => { setStatus('idle'); setForm({ name: '', phone: '', email: '', comment: '' }); }}
              className="mt-6 text-xs font-semibold tracking-wider uppercase text-primary hover:underline transition-colors"
            >
              {t('newBooking')}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-surface-page">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h2 className="font-heading text-3xl sm:text-4xl text-text-primary leading-tight text-center mb-2">
            {t('confirmReservation')}
          </h2>
          <p className="text-sm text-text-secondary text-center">{t('confirmReservationSubtitle')}</p>
        </div>

        {/* Booking summary chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 p-3 bg-surface-hover rounded-xl mb-6">
          <Chip icon={<IconCalendar size={12} />} text={formatDate(date)} />
          <Chip icon={<IconClock size={12} />} text={time} />
          <Chip icon={<IconPeople size={12} />} text={`${guests} ${t('guestsLabel')}`} />
        </div>

        {/* Contact form */}
        <div className="bg-surface-card border border-border rounded-2xl p-6 sm:p-8 shadow-card space-y-4">
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
      </div>
    </section>
  );
}

/* ── Helpers ── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-semibold tracking-[0.15em] uppercase text-text-tertiary">{label}</label>
    {children}
  </div>
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
const IconCheck = () => <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 14l7 7L23 8" /></svg>
const IconCalendar = ({ size = 16 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="2.5" width="13" height="12" rx="2" /><path d="M5 1v3M11 1v3M1.5 7h13" /></svg>
const IconClock = ({ size = 16 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6.5" /><path d="M8 4.5V8l2.5 2" /></svg>
const IconPeople = ({ size = 16 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="5" r="2.5" /><path d="M1 14c0-3 2-4.5 5-4.5s5 1.5 5 4.5" /><path d="M11 7.5c1.5 0 3 .8 3 3" strokeOpacity="0.6" /><circle cx="11.5" cy="4.5" r="2" strokeOpacity="0.6" /></svg>
const IconUser = ({ size = 16 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="5.5" r="3" /><path d="M2 14c0-3.5 2.5-5.5 6-5.5s6 2 6 5.5" /></svg>

const inputCls = 'w-full h-11 px-4 bg-surface-hover border border-border rounded-xl text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors';
