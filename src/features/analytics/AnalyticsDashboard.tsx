'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ComposedChart, Line,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslations } from 'next-intl';
import {
  Eye, Users, ShoppingCart, DollarSign, TrendingUp, Activity,
  ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react';

const COLORS = ['#3b82f6', '#f97316', '#22c55e', '#e11d48', '#a855f7', '#06b6d4'];

// ─── Types ─────────────────────────────────────────────────────────────
interface ComparisonValue {
  current: number;
  previous: number;
  delta: string;
}

interface SalesTimelineEntry {
  date: string;
  revenue: number;
  orders: number;
}

interface SalesSummary {
  totalRevenue: number;
  totalOrders: number;
  avgCheck: number;
  conversionRate: string;
  totalItems: number;
  reservationCount: number;
}

interface TopItem {
  name: string;
  quantity: number;
  revenue: number;
}

interface FunnelStep {
  step: string;
  value: number;
}

interface AnalyticsData {
  totalViews: number;
  uniqueVisitors: number;
  timeline: { date: string; totalViews: number; uniqueVisitors: number }[];
  cities: { name: string; value: number }[];
  devices: { name: string; value: number }[];
  salesTimeline: SalesTimelineEntry[];
  salesSummary: SalesSummary;
  topItems: TopItem[];
  funnel: FunnelStep[];
  comparison: {
    views: ComparisonValue;
    visitors: ComparisonValue;
    revenue: ComparisonValue;
    orders: ComparisonValue;
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────
function formatShortDate(dateStr: string) {
  // "2026-09-01" → "Sep 1"
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

// ─── Dashboard ─────────────────────────────────────────────────────────
export default function AnalyticsDashboard({ tenantId }: { tenantId: string }) {
  const t = useTranslations('admin.analyticsPage');
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    const token = localStorage.getItem('saas_token');
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/analytics?days=${days}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch((err) => {
        console.error('Analytics fetch error:', err);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [tenantId, days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        {t('loading')}
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex items-center justify-center py-20 text-destructive">
        {t('error')}
      </div>
    );
  }

  const {
    totalViews, uniqueVisitors, timeline, cities, devices,
    salesTimeline, salesSummary, topItems, funnel, comparison,
  } = data;

  // Merge timeline into a single dataset for the combined bar chart
  const viewsLabel = t('views');
  const ordersLabel = t('orders');
  const combinedTimeline = timeline.map((entry, i) => ({
    date: formatShortDate(entry.date),
    [viewsLabel]: entry.totalViews,
    [ordersLabel]: salesTimeline[i]?.orders ?? 0,
  }));

  return (
    <div className="space-y-8">
      {/* Period selector */}
      <div className="flex justify-end">
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">{t('days7')}</SelectItem>
            <SelectItem value="30">{t('days30')}</SelectItem>
            <SelectItem value="90">{t('days90')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI cards with comparison deltas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          icon={<Eye className="w-5 h-5" />}
          label={t('views')}
          value={totalViews.toLocaleString()}
          delta={comparison.views.delta}
          color="bg-blue-50 text-blue-600"
        />
        <KpiCard
          icon={<Users className="w-5 h-5" />}
          label={t('uniqueVisitors')}
          value={uniqueVisitors.toLocaleString()}
          delta={comparison.visitors.delta}
          color="bg-emerald-50 text-emerald-600"
        />
        <KpiCard
          icon={<DollarSign className="w-5 h-5" />}
          label={t('revenue')}
          value={`${salesSummary.totalRevenue.toLocaleString()}`}
          delta={comparison.revenue.delta}
          color="bg-green-50 text-green-600"
        />
        <KpiCard
          icon={<ShoppingCart className="w-5 h-5" />}
          label={t('orders')}
          value={salesSummary.totalOrders.toLocaleString()}
          delta={comparison.orders.delta}
          color="bg-purple-50 text-purple-600"
        />
        <KpiCard
          icon={<Activity className="w-5 h-5" />}
          label={t('avgBill')}
          value={salesSummary.avgCheck.toLocaleString()}
          color="bg-amber-50 text-amber-600"
        />
        <KpiCard
          icon={<TrendingUp className="w-5 h-5" />}
          label={t('conversion')}
          value={`${salesSummary.conversionRate}%`}
          color="bg-rose-50 text-rose-600"
        />
      </div>

      {/* Combined bar chart: Views + Orders over time */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{t('overview')}</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={combinedTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey={t('views')} fill="#3b82f6" radius={[3, 3, 0, 0]} barSize={days > 30 ? 6 : 16} />
              <Line yAxisId="right" type="monotone" dataKey={t('orders')} stroke="#a855f7" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Funnel + Top Items side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{t('funnel')}</CardTitle>
          </CardHeader>
          <CardContent>
            <FunnelChart funnel={funnel} t={t} />
          </CardContent>
        </Card>

        {/* Top Items */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{t('topItems')}</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {topItems.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topItems} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11 }}
                    width={100}
                    tickFormatter={(v: string) => v.length > 14 ? v.slice(0, 14) + '…' : v}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                    formatter={(value: number, name: string) => [
                      name === 'quantity' ? `${value} pcs` : `${value.toLocaleString()}`,
                      name === 'quantity' ? t('quantity') : t('itemRevenue'),
                    ]}
                  />
                  <Bar dataKey="quantity" fill="#22c55e" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                {t('noData')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Devices + Cities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{t('devices')}</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={devices}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={3}
                >
                  {devices.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{t('topCities')}</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer>
              <BarChart data={cities} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── KPI Card with delta badge ────────────────────────────────────────
function KpiCard({
  icon, label, value, delta, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta?: string;
  color: string;
}) {
  const deltaNum = delta ? parseFloat(delta) : null;
  const DeltaIcon = deltaNum === null ? Minus : deltaNum > 0 ? ArrowUpRight : deltaNum < 0 ? ArrowDownRight : Minus;
  const deltaColor = deltaNum === null
    ? 'text-muted-foreground'
    : deltaNum > 0
      ? 'text-emerald-600'
      : deltaNum < 0
        ? 'text-red-500'
        : 'text-muted-foreground';

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="flex flex-col items-center p-4 gap-1.5">
        <div className={`p-3 rounded-full ${color}`}>{icon}</div>
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xl font-bold">{value}</span>
        {delta !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${deltaColor}`}>
            <DeltaIcon className="w-3 h-3" />
            {delta}%
          </span>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Funnel visualization ──────────────────────────────────────────────
function FunnelChart({ funnel, t }: { funnel: FunnelStep[]; t: (key: string) => string }) {
  const maxValue = funnel[0]?.value || 1;
  const labels: Record<string, string> = {
    visitors: t('funnelVisitors'),
    views:    t('funnelViews'),
    orders:   t('funnelOrders'),
    revenue:  t('funnelRevenue'),
  };
  const funnelColors = ['#3b82f6', '#f97316', '#a855f7', '#22c55e'];

  return (
    <div className="flex flex-col gap-3">
      {funnel.map((step, i) => {
        const pct = maxValue > 0 ? (step.value / maxValue) * 100 : 0;
        const stepRate = i > 0 && funnel[i - 1].value > 0
          ? ((step.value / funnel[i - 1].value) * 100).toFixed(1)
          : null;

        return (
          <div key={step.step} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{labels[step.step] || step.step}</span>
              <span className="text-muted-foreground">
                {step.step === 'revenue'
                  ? step.value.toLocaleString()
                  : step.value.toLocaleString()}
                {stepRate && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({stepRate}% {t('funnelConversion')})
                  </span>
                )}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-6 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                style={{
                  width: `${Math.max(pct, 4)}%`,
                  backgroundColor: funnelColors[i],
                }}
              >
                <span className="text-xs font-medium text-white drop-shadow-sm">
                  {Math.round(pct)}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}