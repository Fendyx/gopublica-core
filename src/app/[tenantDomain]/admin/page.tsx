'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/entities/tenant/TenantContext';
import {
  UtensilsCrossed,
  CalendarCheck,
  ClipboardList,
  ArrowRight,
  Settings,
  ImageIcon,
  Users,
  Users2,
  Package,
  ShoppingCart,
  Sparkles,
  CheckCircle2,
  Circle,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Types ───────────────────────────────────────────────────────────────────
interface AttentionCard {
  type: string;
  count: number;
  href: string;
  icon: string;
}

interface StatCard {
  key: string;
  value: number;
  icon: string;
}

interface ChecklistItem {
  key: string;
  label: string;
  done: boolean;
}

interface ActivityItem {
  type: string;
  text: string;
  time: string;
  status: string;
  href: string;
}

interface DashboardData {
  attention: AttentionCard[];
  stats: StatCard[];
  checklist: ChecklistItem[];
  activity: ActivityItem[];
  setupProgress: number;
}

// ─── Icon resolver ───────────────────────────────────────────────────────────
const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  UtensilsCrossed,
  CalendarCheck,
  ClipboardList,
  Users,
  Users2,
  Package,
  ShoppingCart,
  Sparkles,
};

function resolveIcon(name: string) {
  return iconMap[name] || ClipboardList;
}

// ─── Status dot colour ───────────────────────────────────────────────────────
function statusColor(status: string) {
  if (['confirmed', 'completed', 'paid', 'accepted', 'hired'].includes(status)) return 'text-emerald-500';
  if (['cancelled', 'declined', 'rejected', 'no_show'].includes(status)) return 'text-red-500';
  if (['preparing', 'out_for_delivery', 'invited'].includes(status)) return 'text-amber-500';
  return 'text-blue-500';
}

// ─── Time ago helper ─────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const t = useTranslations('admin.dashboardPage');
  const tenant = useTenant();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('saas_token');
    if (!savedToken) {
      router.push('/admin/login');
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/dashboard`, {
      headers: { Authorization: `Bearer ${savedToken}` },
    })
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  // ── Quick links based on niche / permissions ──
  const quickLinks = useMemo(() => {
    const canManageMenu = tenant?.canManageMenu ?? tenant?.moduleAccess?.menu?.canManage ?? false;
    const canManageOrders = tenant?.canManageOrders ?? tenant?.moduleAccess?.orders?.canManage ?? false;
    const isBeauty = tenant?.niche === 'beauty';

    const links: Array<{ label: string; href: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [];

    if (isBeauty) {
      links.push({ label: t('beautyServices'), href: '/admin/beauty-services', icon: Sparkles });
      links.push({ label: t('beautyMasters'), href: '/admin/beauty-masters', icon: Users2 });
    } else if (canManageMenu) {
      links.push({ label: t('manageMenu'), href: '/admin/menu', icon: UtensilsCrossed });
    }

    if (canManageOrders) {
      links.push({ label: t('orders'), href: '/admin/orders', icon: ClipboardList });
    }
    links.push({ label: t('reservations'), href: '/admin/reservations', icon: CalendarCheck });
    links.push({ label: t('gallery'), href: '/admin/gallery', icon: ImageIcon });
    links.push({ label: t('settings'), href: '/admin/settings', icon: Settings });

    return links;
  }, [tenant, t]);

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-5">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="glass-card p-5">
          <Skeleton className="h-5 w-48 mb-4" />
          <Skeleton className="h-2 w-full rounded-full mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-6 w-full rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* ── Welcome header ─────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('welcome', { name: tenant?.businessName || tenant?.clientName || '' })}
        </h1>
        <p className="text-muted-foreground mt-1">{t('summary')}</p>
      </div>

      {/* ── Attention cards (needs-action) ─────────────────────────────── */}
      {data?.attention && data.attention.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.attention.map((card) => {
            const Icon = resolveIcon(card.icon);
            return (
              <button
                key={card.type}
                onClick={() => router.push(card.href)}
                className="glass-card p-5 text-left hover:ring-2 hover:ring-amber-500/40 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <AlertCircle size={20} className="text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t(`attention.${card.type}`)}
                    </p>
                    <p className="text-3xl font-bold tracking-tight mt-0.5">{card.count}</p>
                  </div>
                  <ChevronRight size={18} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Stats cards ────────────────────────────────────────────────── */}
      {data?.stats && data.stats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.stats.map((stat) => {
            const Icon = resolveIcon(stat.icon);
            return (
              <div key={stat.key} className="glass-card glass-stat-accent p-5">
                <div className="flex items-center gap-4">
                  <div className="surface-inset p-3 flex items-center justify-center">
                    <Icon size={20} className="text-[var(--admin-accent)]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t(`stats.${stat.key}`)}
                    </p>
                    <p className="text-3xl font-bold tracking-tight mt-0.5">{stat.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Two-column: Checklist + Activity ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Setup checklist */}
        {data?.checklist && data.checklist.length > 0 && (
          <div className="lg:col-span-2 glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {t('setupChecklist')}
              </h2>
              <span className="text-xs font-medium text-muted-foreground">{data.setupProgress}%</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-muted rounded-full mb-5 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${data.setupProgress}%` }}
              />
            </div>
            <ul className="space-y-2.5">
              {data.checklist.map((item) => (
                <li key={item.key} className="flex items-center gap-3">
                  {item.done ? (
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  ) : (
                    <Circle size={16} className="text-muted-foreground/40 shrink-0" />
                  )}
                  <span className={`text-sm ${item.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {t(`checklist.${item.label}`)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Activity feed */}
        <div className="lg:col-span-3 glass-card p-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            {t('recentActivity')}
          </h2>
          {data?.activity && data.activity.length > 0 ? (
            <ul className="space-y-1">
              {data.activity.map((item, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => router.push(item.href)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-hover transition-colors text-left"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColor(item.status)}`} />
                    <span className="flex-1 min-w-0 text-sm truncate">{item.text}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(item.time)}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">{t('noActivity')}</p>
          )}
        </div>
      </div>

      {/* ── Quick actions ──────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {t('quickActions')}
        </h2>
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
    </div>
  );
}