'use client';
import { useEffect, useState } from 'react';
import { useTenant } from '@/entities/tenant/TenantContext';
import { useTranslations } from 'next-intl';
import { useBranch } from '@/entities/branch/BranchContext';

export default function SettingsPageContent() {
  const t = useTranslations('admin.settingsPage');
  const tenant = useTenant();
  const { selectedBranch, loading: branchLoading } = useBranch();
  const [token, setToken] = useState<string | null>(null);
  const [form, setForm] = useState({
    phone: '',
    address: '',
    email: '',
    hours: '',
    googleMapsUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [primaryLanguage, setPrimaryLanguage] = useState('pl');
  const [primaryCurrency, setPrimaryCurrency] = useState('PLN');

  const [hoursI18n, setHoursI18n] = useState<Record<string, string>>({});
  const [seoTitleI18n, setSeoTitleI18n] = useState<Record<string, string>>({});
  const [seoDescriptionI18n, setSeoDescriptionI18n] = useState<Record<string, string>>({});

  const [notifications, setNotifications] = useState({
    booking: {
      sound: true,
      message: true,
      soundFile: '',
    },
  });

  const SUPPORTED_LANGUAGES = ['pl', 'en', 'de', 'ru', 'es', 'ua'];
  const availableLangs = SUPPORTED_LANGUAGES.filter(lang => lang !== primaryLanguage);

  useEffect(() => {
    const savedToken = localStorage.getItem('saas_token');
    if (!savedToken) {
      window.location.href = '/admin/login';
    } else {
      setToken(savedToken);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    if (branchLoading) return;
    if (!selectedBranch) return;

    let url = `${process.env.NEXT_PUBLIC_API_URL}/api/saas/settings?tenantId=${tenant?.tenantId}`;
    if (selectedBranch) url += `&branchId=${selectedBranch._id}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setForm({
          phone: data.phone || tenant?.contact?.phone || '',
          address: data.address || tenant?.contact?.address || '',
          email: data.email || tenant?.contact?.email || '',
          hours: data.hours || tenant?.contact?.hours || '',
          googleMapsUrl: data.googleMapsUrl || tenant?.contact?.googleMapsUrl || '',
        });
        if (data.primaryLanguage) setPrimaryLanguage(data.primaryLanguage);
        if (data.primaryCurrency) setPrimaryCurrency(data.primaryCurrency);
        setHoursI18n(data.hoursI18n || {});
        setSeoTitleI18n(data.seoTitleI18n || {});
        setSeoDescriptionI18n(data.seoDescriptionI18n || {});
        if (data.notifications) {
          setNotifications(prev => ({
            ...prev,
            ...data.notifications,
            booking: { ...prev.booking, ...(data.notifications.booking || {}) },
          }));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, selectedBranch, branchLoading, tenant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch) {
      alert('Сначала выберите филиал');
      return;
    }
    try {
      const payload = {
        ...form,
        notifications,
        primaryLanguage,
        primaryCurrency,
        hoursI18n,
        seoTitleI18n,
        seoDescriptionI18n,
        branchId: selectedBranch._id,
      };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (branchLoading || loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-[var(--color-text-tertiary)]">{t('loading')}</div>;
  }

  if (!selectedBranch) {
    return <div className="text-center py-20">Выберите филиал в переключателе справа вверху</div>;
  }

  const labelCls = 'block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 uppercase tracking-wide';
  const inputCls = 'w-full bg-[var(--color-surface-page)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm rounded-lg px-3 py-2.5 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 placeholder:text-[var(--color-text-tertiary)]';
  const selectCls = 'bg-[var(--color-surface-page)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm rounded-lg px-3 py-2.5 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 w-full max-w-xs';
  const sectionTitleCls = 'text-xs font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-4';

  return (
    <div className="max-w-2xl">
      <div className="mb-4 text-sm text-gray-500">
        Настройки для филиала: <strong>{selectedBranch.name}</strong> {selectedBranch.city && `(${selectedBranch.city})`}
      </div>
      
      <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-6">{t('title')}</h2>

      <form onSubmit={handleSubmit} className="bg-[var(--color-surface-card)] border border-[var(--color-border)] rounded-2xl shadow-[var(--shadow-card)] divide-y divide-[var(--color-border)]">
        {/* контактная секция */}
        <div className="p-6 space-y-4">
          <p className={sectionTitleCls}>{t('contactSection')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t('phone')}</label>
              <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{t('email')}</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>{t('address')}</label>
            <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={inputCls} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t('hours')}</label>
              <input type="text" value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{t('googleMapsUrl')}</label>
              <input type="text" value={form.googleMapsUrl} onChange={e => setForm({ ...form, googleMapsUrl: e.target.value })} className={inputCls} />
            </div>
          </div>
          {/* переводы часов */}
          <details className="group border border-[var(--color-border)] rounded-xl bg-[var(--color-surface-page)] overflow-hidden">
            <summary className="cursor-pointer p-3 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-2 list-none [&::-webkit-details-marker]:hidden">
              <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              {t('hoursTranslations')}
            </summary>
            <div className="px-4 pb-4 grid sm:grid-cols-3 gap-3">
              {availableLangs.map(lang => (
                <div key={lang}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">{lang}</p>
                  <input type="text" placeholder={`${t('hours')} (${lang})`} value={hoursI18n[lang] || ''} onChange={e => setHoursI18n(prev => ({ ...prev, [lang]: e.target.value }))} className={inputCls} />
                </div>
              ))}
            </div>
          </details>
        </div>

        {/* уведомления */}
        <div className="p-6 space-y-4">
          <p className={sectionTitleCls}>{t('notifications.title')}</p>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <span className="relative inline-flex">
                <input type="checkbox" checked={notifications.booking.sound} onChange={e => setNotifications({ ...notifications, booking: { ...notifications.booking, sound: e.target.checked } })} className="peer sr-only" />
                <span className="h-5 w-9 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-page)] transition peer-checked:bg-[var(--color-primary)] peer-checked:border-[var(--color-primary)]" />
                <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-[var(--color-text-tertiary)] transition peer-checked:translate-x-4 peer-checked:bg-white" />
              </span>
              <span className="text-sm text-[var(--color-text-primary)]">{t('notifications.sound')}</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <span className="relative inline-flex">
                <input type="checkbox" checked={notifications.booking.message} onChange={e => setNotifications({ ...notifications, booking: { ...notifications.booking, message: e.target.checked } })} className="peer sr-only" />
                <span className="h-5 w-9 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-page)] transition peer-checked:bg-[var(--color-primary)] peer-checked:border-[var(--color-primary)]" />
                <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-[var(--color-text-tertiary)] transition peer-checked:translate-x-4 peer-checked:bg-white" />
              </span>
              <span className="text-sm text-[var(--color-text-primary)]">{t('notifications.message')}</span>
            </label>
            <div className="pt-1">
              <label className={labelCls}>{t('notifications.melody')}</label>
              <div className="flex items-center gap-2">
                <select value={notifications.booking.soundFile} onChange={e => setNotifications({ ...notifications, booking: { ...notifications.booking, soundFile: e.target.value } })} className={selectCls}>
                  <option value="">{t('notifications.default')}</option>
                  <option value="/sounds/1.mp3">{t('notifications.melody1')}</option>
                  <option value="custom">{t('notifications.customUrl')}</option>
                </select>
                <button type="button" onClick={() => { const src = notifications.booking.soundFile && notifications.booking.soundFile !== 'custom' ? notifications.booking.soundFile : '/sounds/default.mp3'; new Audio(src).play() }} className="shrink-0 text-xs font-medium text-[var(--color-primary)] border border-[var(--color-primary)]/30 rounded-lg px-3 py-2.5 hover:bg-[var(--color-primary)]/5 transition">{t('notifications.listen')}</button>
              </div>
              {notifications.booking.soundFile === 'custom' && (
                <input type="text" placeholder={t('notifications.customUrl')} onChange={e => setNotifications({ ...notifications, booking: { ...notifications.booking, soundFile: e.target.value } })} className={`${inputCls} mt-2`} />
              )}
            </div>
          </div>
        </div>

        {/* локализация */}
        <div className="p-6">
          <p className={sectionTitleCls}>{t('localisationSection')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t('primaryLanguage')}</label>
              <select value={primaryLanguage} onChange={e => setPrimaryLanguage(e.target.value)} className={selectCls}>
                <option value="pl">Polski</option>
                <option value="en">English</option>
                <option value="de">Deutsch</option>
                <option value="ru">Русский</option>
                <option value="es">Español</option>
                <option value="ua">Українська</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>{t('primaryCurrency')}</label>
              <select value={primaryCurrency} onChange={e => setPrimaryCurrency(e.target.value)} className={selectCls}>
                <option value="PLN">PLN (zł)</option>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="UAH">UAH (₴)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CZK">CZK (Kč)</option>
              </select>
            </div>
          </div>
        </div>

        {/* SEO переводы */}
        <div className="p-6 space-y-4">
          <p className={sectionTitleCls}>{t('seoTranslations')}</p>
          <details className="group border border-[var(--color-border)] rounded-xl bg-[var(--color-surface-page)] overflow-hidden">
            <summary className="cursor-pointer p-3 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-2 list-none [&::-webkit-details-marker]:hidden">
              <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              {t('seoTitleLabel')}
            </summary>
            <div className="px-4 pb-4 grid sm:grid-cols-3 gap-3">
              {availableLangs.map(lang => (
                <div key={lang}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">{lang}</p>
                  <input type="text" placeholder={`${t('seoTitleLabel')} (${lang})`} value={seoTitleI18n[lang] || ''} onChange={e => setSeoTitleI18n(prev => ({ ...prev, [lang]: e.target.value }))} className={inputCls} />
                </div>
              ))}
            </div>
          </details>
          <details className="group border border-[var(--color-border)] rounded-xl bg-[var(--color-surface-page)] overflow-hidden">
            <summary className="cursor-pointer p-3 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-2 list-none [&::-webkit-details-marker]:hidden">
              <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              {t('seoDescriptionLabel')}
            </summary>
            <div className="px-4 pb-4 grid sm:grid-cols-3 gap-3">
              {availableLangs.map(lang => (
                <div key={lang}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">{lang}</p>
                  <textarea placeholder={`${t('seoDescriptionLabel')} (${lang})`} value={seoDescriptionI18n[lang] || ''} onChange={e => setSeoDescriptionI18n(prev => ({ ...prev, [lang]: e.target.value }))} className={inputCls} rows={2} />
                </div>
              ))}
            </div>
          </details>
        </div>

        <div className="px-6 py-4 flex items-center justify-between bg-[var(--color-surface-hover)]/40 rounded-b-2xl">
          <button type="submit" className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-[var(--color-primary)] hover:brightness-110 active:brightness-95 transition">{t('save')}</button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 animate-in fade-in duration-300">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              {t('saved')}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}