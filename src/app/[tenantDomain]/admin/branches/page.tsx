'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useBranch } from '@/entities/branch/BranchContext';
import { Pencil, Trash2, Plus, MapPin, Phone, Mail, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

  if (loading || contextLoading)
    return <div className="text-center py-10 text-muted-foreground">{t('loading')}</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          {t('title')}
        </h2>
        <Button onClick={() => router.push('/admin/branches/new')} className="gap-2">
          <Plus size={16} /> {t('addBranch')}
        </Button>
      </div>

      {localBranches.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MapPin className="w-8 h-8 text-muted-foreground/40 mb-2" />
            <p className="text-muted-foreground">{t('empty')}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">{t('name')}</TableHead>
                  <TableHead>{t('city')}</TableHead>
                  <TableHead>{t('address')}</TableHead>
                  <TableHead>{t('phone')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localBranches.map((branch) => (
                  <TableRow key={branch._id}>
                    <TableCell className="font-medium">{branch.name}</TableCell>
                    <TableCell>{branch.city || '—'}</TableCell>
                    <TableCell>{branch.address || '—'}</TableCell>
                    <TableCell>{branch.phone || '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/admin/branches/${branch._id}`)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(branch._id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}