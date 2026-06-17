'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface Application {
  _id: string;
  fields: Record<string, any>;
  status: 'new' | 'viewed' | 'invited' | 'rejected' | 'hired';
  comment: string;
  resumeUrl: string;
  createdAt: string;
  branchId?: string;
}

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  new: 'default',
  viewed: 'secondary',
  invited: 'outline',
  rejected: 'destructive',
  hired: 'default',
};

export default function JobApplicationsPage() {
  const router = useRouter();
  const t = useTranslations('admin.jobsPage'); // Подключаем переводы

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    const savedToken = localStorage.getItem('saas_token');
    if (!savedToken) router.push('/admin/login');
    else setToken(savedToken);
  }, [router]);

  const fetchApplications = async () => {
    if (!token) return;
    try {
      setLoading(true);
      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/saas/jobs/applications?page=${page}&limit=10`;
      if (filterStatus !== 'all') url += `&status=${filterStatus}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 403) { router.push('/admin'); return; }
        throw new Error('Failed to fetch');
      }
      const data = await res.json();
      setApplications(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApplications(); }, [token, page, filterStatus]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/jobs/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setApplications(prev =>
          prev.map(app => (app._id === id ? { ...app, status: newStatus as any } : app))
        );
      }
    } catch (err) { console.error(err); }
  };

  // Вспомогательная функция для получения перевода статуса
  const getStatusLabel = (status: string) => {
    // next-intl может ругаться на динамические ключи, поэтому делаем проверку или маппинг
    const statusMap: Record<string, string> = {
      new: t('statusLabels.new'),
      viewed: t('statusLabels.viewed'),
      invited: t('statusLabels.invited'),
      rejected: t('statusLabels.rejected'),
      hired: t('statusLabels.hired'),
    };
    return statusMap[status] || status;
  };

  if (loading) return <div className="text-center py-10 font-medium text-gray-500">{t('loading')}</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('title')}</h1>
        <Button onClick={() => router.push('/admin/jobs/settings')} className="shadow-sm">
          {t('settingsBtn')}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder={t('allStatuses')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStatuses')}</SelectItem>
            <SelectItem value="new">{t('statusLabels.new')}</SelectItem>
            <SelectItem value="viewed">{t('statusLabels.viewed')}</SelectItem>
            <SelectItem value="invited">{t('statusLabels.invited')}</SelectItem>
            <SelectItem value="rejected">{t('statusLabels.rejected')}</SelectItem>
            <SelectItem value="hired">{t('statusLabels.hired')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-sm rounded-xl">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                <TableHead className="font-semibold">{t('table.date')}</TableHead>
                <TableHead className="font-semibold">{t('table.name')}</TableHead>
                <TableHead className="font-semibold">{t('table.position')}</TableHead>
                <TableHead className="font-semibold">{t('table.status')}</TableHead>
                <TableHead className="font-semibold text-right pr-6">{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                    {t('empty')}
                  </TableCell>
                </TableRow>
              ) : (
                applications.map(app => (
                  <TableRow key={app._id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="font-medium text-gray-600">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-semibold text-gray-900">
                      {app.fields?.fullName || t('table.anonymous')}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {app.fields?.position || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[app.status] || 'default'} className="shadow-none">
                        {getStatusLabel(app.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2 pr-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-gray-100 text-gray-500 hover:text-gray-900"
                          onClick={() => router.push(`/admin/jobs/${app._id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Select
                          value={app.status}
                          onValueChange={(val) => handleStatusChange(app._id, val)}
                        >
                          <SelectTrigger className="w-[130px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">{t('statusLabels.new')}</SelectItem>
                            <SelectItem value="viewed">{t('statusLabels.viewed')}</SelectItem>
                            <SelectItem value="invited">{t('statusLabels.invited')}</SelectItem>
                            <SelectItem value="rejected">{t('statusLabels.rejected')}</SelectItem>
                            <SelectItem value="hired">{t('statusLabels.hired')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-between items-center px-1">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="shadow-sm">
            <ChevronLeft className="w-4 h-4 mr-1" /> {t('back')}
          </Button>
          <span className="text-sm font-medium text-gray-600">
            {t('pageInfo', { current: page, total: totalPages })}
          </span>
          <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="shadow-sm">
             {t('next')} <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}