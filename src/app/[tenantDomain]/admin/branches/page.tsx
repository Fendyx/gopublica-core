'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useBranch } from '@/entities/branch/BranchContext';
import { Pencil, Trash2, Plus } from 'lucide-react';

type Branch = {
  _id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
};

export default function BranchesPage() {
  const t = useTranslations('admin.branchesPage');
  const router = useRouter();
  const { branches: contextBranches, loading: contextLoading, refetchBranches } = useBranch();
  const [token, setToken] = useState<string | null>(null);
  const [localBranches, setLocalBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('saas_token');
    if (!savedToken) router.push('/admin/login');
    else setToken(savedToken);
  }, []);

  const fetchBranches = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/branches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setLocalBranches(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchBranches();
  }, [token]);

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/branches/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchBranches();
      if (refetchBranches) refetchBranches();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || contextLoading) return <div className="text-center py-10">{t('loading')}</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-text-primary">{t('title')}</h2>
        <button
          onClick={() => router.push('/admin/branches/new')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90"
        >
          <Plus size={16} /> {t('addBranch')}
        </button>
      </div>

      {localBranches.length === 0 ? (
        <div className="text-center py-16 bg-surface-card rounded-2xl border border-dashed border-border">
          <p className="text-text-secondary">{t('empty')}</p>
        </div>
      ) : (
        <div className="bg-surface-card rounded-2xl shadow-card border border-border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-surface-page border-b border-border">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-text-tertiary uppercase">{t('name')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-text-tertiary uppercase">{t('city')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-text-tertiary uppercase">{t('address')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-text-tertiary uppercase">{t('phone')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-text-tertiary uppercase">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {localBranches.map((branch) => (
                <tr key={branch._id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-6 py-4 font-medium text-text-primary">{branch.name}</td>
                  <td className="px-6 py-4 text-text-secondary">{branch.city || '—'}</td>
                  <td className="px-6 py-4 text-text-secondary">{branch.address || '—'}</td>
                  <td className="px-6 py-4 text-text-secondary">{branch.phone || '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => router.push(`/admin/branches/${branch._id}`)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(branch._id)} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}