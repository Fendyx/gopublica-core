'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useBranch } from '@/entities/branch/BranchContext';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  XCircle,
  Ban,
  Trash2,
  CalendarDays,
  Clock,
  Users,
  Phone,
  MapPin,
} from 'lucide-react';

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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'cancelled': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'secondary';
    }
  };

  if (branchLoading || loading) return <div className="text-center py-16 text-muted-foreground">{t('loading')}</div>;
  if (!selectedBranch) return <div className="text-center py-16 text-muted-foreground">Выберите филиал в переключателе справа вверху</div>;

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="w-4 h-4" />
        Бронирования для филиала: <strong>{selectedBranch.name}</strong> {selectedBranch.city && `(${selectedBranch.city})`}
      </div>

      <h2 className="text-2xl font-bold flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-primary" />
        {t('title')}
      </h2>

      {reservations.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarDays className="w-8 h-8 text-muted-foreground/40 mb-2" />
            <p className="text-muted-foreground">{t('empty')}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('date')}</TableHead>
                  <TableHead>{t('time')}</TableHead>
                  <TableHead>{t('guests')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((r) => (
                  <TableRow key={r._id}>
                    <TableCell>
                      <div className="font-medium">{r.name}</div>
                      {r.phone && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          {r.phone}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm">{r.date}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm">{r.time}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-medium">{r.guests}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(r.status)}>
                        {statusLabel(r.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {r.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateStatus(r._id, 'confirmed')}
                              className="text-emerald-600 hover:text-emerald-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {t('confirm')}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateStatus(r._id, 'cancelled')}
                              className="text-destructive hover:text-destructive"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              {t('reject')}
                            </Button>
                          </>
                        )}
                        {r.status === 'confirmed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateStatus(r._id, 'cancelled')}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Ban className="w-4 h-4 mr-1" />
                            {t('cancel')}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteReservation(r._id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
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