'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useBranch } from '@/entities/branch/BranchContext';

type Reservation = {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  date: string;
  time: string;
  guests: number;
  comment?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
};

export default function ReservationsPageContent() {
  const t = useTranslations('admin.reservationsPage');
  const { selectedBranch, loading: branchLoading } = useBranch();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== 'undefined' ? localStorage.getItem('saas_token') : null;

  const fetchReservations = async () => {
    if (!token || !selectedBranch) return;
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/saas/reservations?branchId=${selectedBranch._id}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setReservations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!branchLoading && selectedBranch) fetchReservations();
  }, [selectedBranch, branchLoading, token]);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/reservations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    fetchReservations();
  };

  const deleteReservation = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/reservations/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchReservations();
  };

  const statusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: t('statusLabels.pending'),
      confirmed: t('statusLabels.confirmed'),
      cancelled: t('statusLabels.cancelled'),
    };
    return labels[status] || status;
  };

  if (branchLoading || loading) return <div className="text-center py-16 text-text-secondary">{t('loading')}</div>;
  if (!selectedBranch) return <div className="text-center py-16 text-text-secondary">Выберите филиал в переключателе справа вверху</div>;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-4 text-sm text-gray-500">
        Бронирования для филиала: <strong>{selectedBranch.name}</strong> {selectedBranch.city && `(${selectedBranch.city})`}
      </div>
      <h2 className="text-2xl font-heading font-semibold text-text-primary mb-8">{t('title')}</h2>
      {reservations.length === 0 ? (
        <div className="text-center py-16 px-4 bg-surface-card rounded-2xl border border-dashed border-border">
          <p className="text-text-secondary">{t('empty')}</p>
        </div>
      ) : (
        <div className="bg-surface-card rounded-2xl shadow-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-surface-page border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">{t('name')}</th>
                  <th className="px-6 py-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">{t('date')}</th>
                  <th className="px-6 py-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">{t('time')}</th>
                  <th className="px-6 py-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">{t('guests')}</th>
                  <th className="px-6 py-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">{t('status')}</th>
                  <th className="px-6 py-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {reservations.map(r => (
                  <tr key={r._id} className="hover:bg-surface-hover transition-colors group">
                    <td className="px-6 py-4"><div className="font-medium text-text-primary">{r.name}</div>{r.phone && <div className="text-xs text-text-tertiary mt-0.5">{r.phone}</div>}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{r.date}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{r.time}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary"><span className="inline-flex items-center justify-center bg-surface-page border border-border rounded-lg px-2.5 py-1 font-medium">{r.guests}</span></td>
                    <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${r.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : r.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{statusLabel(r.status)}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 items-center">
                        {r.status === 'pending' && (<><button onClick={() => updateStatus(r._id, 'confirmed')} className="px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100">✓ {t('confirm')}</button><button onClick={() => updateStatus(r._id, 'cancelled')} className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100">✗ {t('reject')}</button></>)}
                        {r.status === 'confirmed' && <button onClick={() => updateStatus(r._id, 'cancelled')} className="px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary bg-surface-page border border-border hover:bg-surface-hover">{t('cancel')}</button>}
                        <button onClick={() => deleteReservation(r._id)} title={t('delete')} className="p-1.5 rounded-lg text-text-tertiary hover:text-rose-600 hover:bg-rose-50"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h10l-1 9H3L2 4z" /><path d="M5 4V2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2" /></svg></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}