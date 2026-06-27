'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend, AreaChart, Area
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
import { Eye, Users, ShoppingCart, DollarSign, TrendingUp, Activity } from 'lucide-react';

const COLORS = ['#3b82f6', '#f97316', '#22c55e', '#e11d48', '#a855f7', '#06b6d4'];
const SALES_COLOR = '#22c55e';
const ORDERS_COLOR = '#a855f7';

// ─── Mock data generators (used because API doesn't return sales yet) ─
function generateSalesMock(days: number) {
  const data = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    data.push({
      date: dateStr.slice(5),   // "MM-DD"
      revenue: Math.floor(Math.random() * 15000 + 1000),   // 1k–16k
      orders: Math.floor(Math.random() * 30 + 1),          // 1–30
    });
  }
  return data;
}

function generateSalesSummary(totalDays: number) {
  const totalRevenue = Math.floor(Math.random() * 200000 + 20000);
  const totalOrders = Math.floor(Math.random() * 500 + 20);
  return {
    totalRevenue,
    totalOrders,
    avgCheck: Math.round(totalRevenue / totalOrders),
    conversionRate: (Math.random() * 5 + 1).toFixed(1),   // 1–6%
  };
}

// ─── Types ─────────────────────────────────────────────────────────────
interface AnalyticsData {
  totalViews: number;
  uniqueVisitors: number;
  timeline: { date: string; totalViews: number; uniqueVisitors: number }[];
  cities: { name: string; value: number }[];
  devices: { name: string; value: number }[];
}

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

  // ─── Sales mock – always generated for now, but can be replaced later ─
  const salesTimeline = useMemo(() => generateSalesMock(days), [days]);
  const salesSummary = useMemo(() => generateSalesSummary(days), [days]);

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

  const { totalViews, uniqueVisitors, timeline, cities, devices } = data;

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

      {/* KPI cards – audience + sales */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          icon={<Eye className="w-5 h-5" />}
          label={t('views')}
          value={totalViews.toLocaleString()}
          color="bg-blue-50 text-blue-600"
        />
        <MetricCard
          icon={<Users className="w-5 h-5" />}
          label={t('uniqueVisitors')}
          value={uniqueVisitors.toLocaleString()}
          color="bg-emerald-50 text-emerald-600"
        />
        <MetricCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Выручка"
          value={`$${salesSummary.totalRevenue.toLocaleString()}`}
          color="bg-green-50 text-green-600"
        />
        <MetricCard
          icon={<ShoppingCart className="w-5 h-5" />}
          label="Заказы"
          value={salesSummary.totalOrders.toLocaleString()}
          color="bg-purple-50 text-purple-600"
        />
        <MetricCard
          icon={<Activity className="w-5 h-5" />}
          label="Средний чек"
          value={`$${salesSummary.avgCheck.toLocaleString()}`}
          color="bg-amber-50 text-amber-600"
        />
        <MetricCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Конверсия"
          value={`${salesSummary.conversionRate}%`}
          color="bg-rose-50 text-rose-600"
        />
      </div>

      {/* Audience timeline */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{t('viewsOverTime')}</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
              <Legend />
              <Line type="monotone" dataKey="totalViews" stroke="#3b82f6" strokeWidth={2} name={t('views')} dot={false} />
              <Line type="monotone" dataKey="uniqueVisitors" stroke="#f97316" strokeWidth={2} name={t('uniqueVisitors')} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sales mock chart */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Продажи (mock)</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesTimeline}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={SALES_COLOR} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={SALES_COLOR} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ORDERS_COLOR} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={ORDERS_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="revenue" stroke={SALES_COLOR} fill="url(#revGrad)" name="Выручка ($)" />
              <Area yAxisId="right" type="monotone" dataKey="orders" stroke={ORDERS_COLOR} fill="url(#ordGrad)" name="Заказы" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

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

// ─── Metric card component ────────────────────────────────────────────
function MetricCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="flex flex-col items-center p-4 gap-2">
        <div className={`p-3 rounded-full ${color}`}>{icon}</div>
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-xl font-bold">{value}</span>
      </CardContent>
    </Card>
  );
}