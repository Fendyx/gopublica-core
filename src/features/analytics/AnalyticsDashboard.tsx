'use client';

import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
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
import { Eye, Users } from 'lucide-react';

const COLORS = ['#3b82f6', '#f97316', '#22c55e', '#e11d48', '#a855f7', '#06b6d4'];

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

  if (loading) return <div className="p-8 text-muted-foreground">{t('loading')}</div>;
  if (!data) return <div className="p-8 text-destructive">{t('error')}</div>;

  const { totalViews, uniqueVisitors, timeline, cities, devices } = data;

  return (
    <div className="space-y-6">
      {/* Переключатель периода */}
      <div className="flex justify-end">
        <Select
          value={String(days)}
          onValueChange={(v) => setDays(Number(v))}
        >
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

      {/* Карточки метрик */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('views')}</p>
              <p className="text-3xl font-bold">{totalViews.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('uniqueVisitors')}</p>
              <p className="text-3xl font-bold">{uniqueVisitors.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Линейный график */}
      <Card>
        <CardHeader>
          <CardTitle>{t('viewsOverTime')}</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="totalViews" stroke="#3b82f6" name={t('views')} />
              <Line type="monotone" dataKey="uniqueVisitors" stroke="#f97316" name={t('uniqueVisitors')} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Устройства + города */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('devices')}</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={devices} dataKey="value" nameKey="name" outerRadius={80} label>
                  {devices.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('topCities')}</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <BarChart data={cities} layout="vertical" margin={{ left: 40 }}>
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}