'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useBranch } from '@/entities/branch/BranchContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, Save, Loader2, Clock } from 'lucide-react';

export default function BranchFormPage() {
  const t = useTranslations('admin.branchesForm');
  const router = useRouter();
  const params = useParams();
  const branchId = params?.id as string;
  const isNew = branchId === 'new';
  const { refetchBranches } = useBranch();

  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    city: '',
    address: '',
    phone: '',
    email: '',
    workingHours: {} as Record<string, string>,
    coordinates: { lat: 0, lng: 0 },
  });

  useEffect(() => {
    const savedToken = localStorage.getItem('saas_token');
    if (!savedToken) router.push('/admin/login');
    else setToken(savedToken);
  }, []);

  useEffect(() => {
    if (!token || isNew) {
      setLoading(false);
      return;
    }
    const fetchBranch = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/branches/${branchId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Branch not found');
        const data = await res.json();
        setForm({
          name: data.name || '',
          city: data.city || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          workingHours: data.workingHours || {},
          coordinates: data.coordinates || { lat: 0, lng: 0 },
        });
      } catch (err) {
        console.error(err);
        router.push('/admin/branches');
      } finally {
        setLoading(false);
      }
    };
    fetchBranch();
  }, [token, branchId, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const url = isNew
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/saas/branches`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/saas/branches/${branchId}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        if (refetchBranches) refetchBranches();
        router.push('/admin/branches');
      } else {
        const err = await res.json();
        alert(err.error || 'Ошибка сохранения');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <div className="text-center py-10 text-muted-foreground">{t('loading')}</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/admin/branches')}>
          <ArrowLeft size={18} />
        </Button>
        <h2 className="text-2xl font-bold">
          {isNew ? t('createTitle') : t('editTitle')}
        </h2>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">{t('name')} *</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">{t('city')}</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{t('address')}</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t('phone')}</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <Accordion type="single" collapsible>
              <AccordionItem value="working-hours" className="border rounded-lg px-3">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    {t('workingHours')}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-3">
                  <div className="space-y-3">
                    {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
                      <div key={day} className="flex items-center gap-3">
                        <Label className="w-16 text-sm capitalize">{day}</Label>
                        <Input
                          placeholder="09:00-22:00"
                          value={form.workingHours[day] || ''}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              workingHours: {
                                ...form.workingHours,
                                [day]: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/branches')}
              >
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('saving')}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {t('save')}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}