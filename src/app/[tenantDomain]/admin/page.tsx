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
import { Button } from '@/components/ui/button';

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

  const canManageMenu = tenant?.canManageMenu ?? tenant?.moduleAccess?.menu?.canManage ?? false;
  const canManageOrders = tenant?.canManageOrders ?? tenant?.moduleAccess?.orders?.canManage ?? false;

  const stats = [
    { label: t('menuCount'), value: data?.menuCount ?? 0, icon: UtensilsCrossed },
    { label: t('todayReservations'), value: data?.todayReservationsCount ?? 0, icon: CalendarCheck },
    { label: t('totalReservations'), value: data?.totalReservationsCount ?? 0, icon: ClipboardList },
  ];

  const quickLinks = [
    ...(canManageMenu ? [{ label: t('manageMenu'), href: '/admin/menu', icon: UtensilsCrossed }] : []),
    ...(canManageOrders ? [{ label: t('orders'), href: '/admin/orders', icon: ClipboardList }] : []),
    { label: t('reservations'), href: '/admin/reservations', icon: CalendarCheck },
    { label: t('gallery'), href: '/admin/gallery', icon: ImageIcon },
    { label: t('settings'), href: '/admin/settings', icon: Settings },
  ];

  const statusLabel = (status: string) => {
    if (status === 'pending') return t('status.pending');
    if (status === 'confirmed') return t('status.confirmed');
    if (status === 'cancelled') return t('status.cancelled');
    return status;
  };

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('welcome', { clientName: tenant?.clientName ?? '' })}</h1>
        <p className="text-muted-foreground mt-1">{t('summary')}</p>
      </div>

      {/* Stat cards — glass with accent stripe */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="glass-card glass-stat-accent p-5">
            <div className="flex items-center gap-4">
              <div className="surface-inset p-3 flex items-center justify-center">
                <Icon size={20} className="text-[var(--admin-accent)]" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className="text-3xl font-bold tracking-tight mt-0.5">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions — glass pill buttons */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('quickActions')}</h2>
        <div className="flex flex-wrap gap-2">
          {quickLinks.map(({ label, href, icon: Icon }) => (
            <Button
              key={href}
              variant="outline"
              size="sm"
              onClick={() => router.push(href)}
              className="gap-2"
            >
              <Icon size={14} />
              {label}
              <ArrowRight size={14} className="opacity-50" />
            </Button>
          ))}
        </div>
      </div>

      {/* Today's reservations */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clock size={14} />
          {t('todayBookings')}
        </h2>
        {data?.lastReservations && data.lastReservations.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="glass-card overflow-hidden hidden md:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('name')}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('time')}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('guests')}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('phone')}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('statusHeader')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lastReservations.map(r => (
                    <tr key={r._id} className="border-b border-border/50 last:border-0 hover:bg-surface-hover transition-colors">
                      <td className="px-4 py-3 flex items-center gap-2">
                        <Users size={14} className="text-muted-foreground" />
                        <span className="font-medium">{r.name}</span>
                      </td>
                      <td className="px-4 py-3">{r.time}</td>
                      <td className="px-4 py-3">{r.guests}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <Phone size={12} className="inline mr-1" />
                        {r.phone}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`status-dot status-dot--${r.status}`} />
                          <span className="text-sm">{statusLabel(r.status)}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="space-y-3 md:hidden">
              {data.lastReservations.map(r => (
                <div key={r._id} className="glass-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-muted-foreground" />
                      <span className="font-medium">{r.name}</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <span className={`status-dot status-dot--${r.status}`} />
                      {statusLabel(r.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {r.time}
                    </span>
                    <span>{r.guests} {t('guests')}</span>
                    <span className="flex items-center gap-1">
                      <Phone size={12} /> {r.phone}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="glass-card p-8 text-center text-muted-foreground">
            {t('noBookings')}
          </div>
        )}
      </div>
    </div>
  );
}