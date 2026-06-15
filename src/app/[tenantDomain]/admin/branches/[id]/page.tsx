'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useBranch } from '@/entities/branch/BranchContext';

export default function BranchFormPage() {
  const t = useTranslations('admin.branchesForm');
  const router = useRouter();
  const params = useParams();
  const branchId = params?.id as string;
  const isNew = branchId === 'new';
  const { refetchBranches } = useBranch();

  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    city: '',
    address: '',
    phone: '',
    email: '',
    workingHours: {} as Record<string, string>,
    coordinates: { lat: 0, lng: 0 },
  });

  useEffect(() => {
    const savedToken = localStorage.getItem('saas_token');
    if (!savedToken) router.push('/admin/login');
    else setToken(savedToken);
  }, []);

  useEffect(() => {
    if (!token || isNew) {
      setLoading(false);
      return;
    }
    const fetchBranch = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/branches/${branchId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Branch not found');
        const data = await res.json();
        setForm({
          name: data.name || '',
          city: data.city || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          workingHours: data.workingHours || {},
          coordinates: data.coordinates || { lat: 0, lng: 0 },
        });
      } catch (err) {
        console.error(err);
        router.push('/admin/branches');
      } finally {
        setLoading(false);
      }
    };
    fetchBranch();
  }, [token, branchId, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const url = isNew
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/saas/branches`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/saas/branches/${branchId}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        if (refetchBranches) refetchBranches();
        router.push('/admin/branches');
      } else {
        const err = await res.json();
        alert(err.error || 'Ошибка сохранения');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-10">{t('loading')}</div>;

  const inputClass = "w-full border border-border bg-surface-page text-text-primary rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";
  const labelClass = "block text-sm font-medium text-text-secondary mb-1";

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold text-text-primary mb-6">
        {isNew ? t('createTitle') : t('editTitle')}
      </h2>
      <form onSubmit={handleSubmit} className="bg-surface-card rounded-2xl shadow-card border border-border p-6 space-y-5">
        <div>
          <label className={labelClass}>{t('name')} *</label>
          <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{t('city')}</label>
          <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{t('address')}</label>
          <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{t('phone')}</label>
          <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{t('email')}</label>
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} />
        </div>

        <details className="group border border-border rounded-lg p-3">
          <summary className="cursor-pointer text-sm font-medium text-text-secondary">{t('workingHours')}</summary>
          <div className="mt-3 space-y-2">
            {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(day => (
              <div key={day} className="flex items-center gap-2">
                <span className="w-16 text-sm capitalize">{day}</span>
                <input
                  type="text" placeholder="09:00-22:00"
                  value={form.workingHours[day] || ''}
                  onChange={e => setForm({ ...form, workingHours: { ...form.workingHours, [day]: e.target.value } })}
                  className={`${inputClass} flex-1`}
                />
              </div>
            ))}
          </div>
        </details>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={() => router.push('/admin/branches')} className="px-5 py-2 rounded-lg border border-border text-text-secondary hover:bg-surface-hover">
            {t('cancel')}
          </button>
          <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-primary text-white font-medium hover:opacity-90 disabled:opacity-50">
            {saving ? t('saving') : t('save')}
          </button>
        </div>
      </form>
    </div>
  );
}