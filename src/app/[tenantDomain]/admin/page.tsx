'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/entities/tenant/TenantContext';
import {
  UtensilsCrossed,
  CalendarCheck,
  ClipboardList,
  ArrowRight,
  Settings,
  ImageIcon,
  Clock,
  Phone,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type DashboardData = {
  menuCount: number;
  todayReservationsCount: number;
  totalReservationsCount: number;
  lastReservations: Array<{
    _id: string;
    name: string;
    phone: string;
    date: string;
    time: string;
    guests: number;
    status: string;
  }>;
};

export default function DashboardPage() {
  const router = useRouter();
  const t = useTranslations('admin.dashboardPage');
  const tenant = useTenant();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('saas_token');
    if (!savedToken) {
      router.push('/admin/login');
    } else {
      setToken(savedToken);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="text-center py-10">{t('loading')}</div>;

  const stats = [
    { label: t('menuCount'), value: data?.menuCount ?? 0, icon: UtensilsCrossed },
    { label: t('todayReservations'), value: data?.todayReservationsCount ?? 0, icon: CalendarCheck },
    { label: t('totalReservations'), value: data?.totalReservationsCount ?? 0, icon: ClipboardList },
  ];

  const quickLinks = [
    { label: t('manageMenu'), href: '/admin/menu', icon: UtensilsCrossed },
    { label: t('reservations'), href: '/admin/reservations', icon: CalendarCheck },
    { label: t('gallery'), href: '/admin/gallery', icon: ImageIcon },
    { label: t('settings'), href: '/admin/settings', icon: Settings },
  ];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';   // обычно зелёный
      case 'cancelled': return 'destructive';
      default: return 'secondary';          // pending
    }
  };

  const statusLabel = (status: string) => {
    if (status === 'pending') return t('status.pending');
    if (status === 'confirmed') return t('status.confirmed');
    if (status === 'cancelled') return t('status.cancelled');
    return status;
  };

  return (
    <div className="space-y-8">
      {/* Приветствие */}
      <div>
        <h1 className="text-2xl font-bold">{t('welcome', { clientName: tenant?.clientName ?? '' })}</h1>
        <p className="text-muted-foreground">{t('summary')}</p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-3xl font-bold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      {/* Быстрые действия */}
      <div>
        <h2 className="text-lg font-semibold mb-3">{t('quickActions')}</h2>
        <div className="flex flex-wrap gap-2">
          {quickLinks.map(({ label, href, icon: Icon }) => (
            <Button
              key={href}
              variant="default"
              size="sm"
              onClick={() => router.push(href)}
              className="gap-2"
            >
              <Icon size={14} />
              {label}
              <ArrowRight size={14} />
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Бронирования на сегодня */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Clock size={18} className="text-muted-foreground" />
          {t('todayBookings')}
        </h2>
        {data?.lastReservations && data.lastReservations.length > 0 ? (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-sm font-medium">{t('name')}</th>
                    <th className="p-3 text-sm font-medium">{t('time')}</th>
                    <th className="p-3 text-sm font-medium">{t('guests')}</th>
                    <th className="p-3 text-sm font-medium">{t('phone')}</th>
                    <th className="p-3 text-sm font-medium">{t('statusHeader')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lastReservations.map(r => (
                    <tr key={r._id} className="border-t">
                      <td className="p-3 flex items-center gap-2">
                        <Users size={14} className="text-muted-foreground" />
                        {r.name}
                      </td>
                      <td className="p-3">{r.time}</td>
                      <td className="p-3">{r.guests}</td>
                      <td className="p-3">
                        <Phone size={14} className="inline mr-1 text-muted-foreground" />
                        {r.phone}
                      </td>
                      <td className="p-3">
                        <Badge variant={getStatusVariant(r.status)}>
                          {statusLabel(r.status)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ) : (
          <p className="text-muted-foreground">{t('noBookings')}</p>
        )}
      </div>
    </div>
  );
}