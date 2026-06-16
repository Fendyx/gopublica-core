'use client';
import { useEffect, useState } from 'react';
import { useTenant } from '@/entities/tenant/TenantContext';
import { useTranslations } from 'next-intl';
import { useBranch } from '@/entities/branch/BranchContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Globe,
  Volume2,
  Bell,
  Languages,
  Banknote,
  Search,
  Save,
  CheckCircle2,
} from 'lucide-react';

export default function SettingsPageContent() {
  const t = useTranslations('admin.settingsPage');
  const tenant = useTenant();
  const { selectedBranch, loading: branchLoading } = useBranch();
  const [token, setToken] = useState<string | null>(null);
  const [form, setForm] = useState({
    phone: '',
    address: '',
    email: '',
    hours: '',
    googleMapsUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [primaryLanguage, setPrimaryLanguage] = useState('pl');
  const [primaryCurrency, setPrimaryCurrency] = useState('PLN');

  const [hoursI18n, setHoursI18n] = useState<Record<string, string>>({});
  const [seoTitleI18n, setSeoTitleI18n] = useState<Record<string, string>>({});
  const [seoDescriptionI18n, setSeoDescriptionI18n] = useState<Record<string, string>>({});

  const [notifications, setNotifications] = useState({
    booking: {
      sound: true,
      message: true,
      soundFile: '',
    },
  });

  const SUPPORTED_LANGUAGES = ['pl', 'en', 'de', 'ru', 'es', 'ua'];
  const availableLangs = SUPPORTED_LANGUAGES.filter(lang => lang !== primaryLanguage);

  useEffect(() => {
    const savedToken = localStorage.getItem('saas_token');
    if (!savedToken) {
      window.location.href = '/admin/login';
    } else {
      setToken(savedToken);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    if (branchLoading) return;
    if (!selectedBranch) return;

    let url = `${process.env.NEXT_PUBLIC_API_URL}/api/saas/settings?tenantId=${tenant?.tenantId}`;
    if (selectedBranch) url += `&branchId=${selectedBranch._id}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setForm({
          phone: data.phone || tenant?.contact?.phone || '',
          address: data.address || tenant?.contact?.address || '',
          email: data.email || tenant?.contact?.email || '',
          hours: data.hours || tenant?.contact?.hours || '',
          googleMapsUrl: data.googleMapsUrl || tenant?.contact?.googleMapsUrl || '',
        });
        if (data.primaryLanguage) setPrimaryLanguage(data.primaryLanguage);
        if (data.primaryCurrency) setPrimaryCurrency(data.primaryCurrency);
        setHoursI18n(data.hoursI18n || {});
        setSeoTitleI18n(data.seoTitleI18n || {});
        setSeoDescriptionI18n(data.seoDescriptionI18n || {});
        if (data.notifications) {
          setNotifications(prev => ({
            ...prev,
            ...data.notifications,
            booking: { ...prev.booking, ...(data.notifications.booking || {}) },
          }));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, selectedBranch, branchLoading, tenant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch) {
      alert('Сначала выберите филиал');
      return;
    }
    try {
      const payload = {
        ...form,
        notifications,
        primaryLanguage,
        primaryCurrency,
        hoursI18n,
        seoTitleI18n,
        seoDescriptionI18n,
        branchId: selectedBranch._id,
      };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (branchLoading || loading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">{t('loading')}</div>;
  }

  if (!selectedBranch) {
    return <div className="text-center py-20">Выберите филиал в переключателе справа вверху</div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <MapPin className="w-4 h-4" />
          Настройки для филиала: <strong>{selectedBranch.name}</strong> {selectedBranch.city && `(${selectedBranch.city})`}
        </div>
        <h2 className="text-2xl font-bold">{t('title')}</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Контактная секция */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">{t('contactSection')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    {t('phone')}
                  </Label>
                  <Input id="phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    {t('email')}
                  </Label>
                  <Input id="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  {t('address')}
                </Label>
                <Input id="address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hours" className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    {t('hours')}
                  </Label>
                  <Input id="hours" value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="googleMaps" className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                    {t('googleMapsUrl')}
                  </Label>
                  <Input id="googleMaps" value={form.googleMapsUrl} onChange={e => setForm({ ...form, googleMapsUrl: e.target.value })} />
                </div>
              </div>

              {/* Переводы часов */}
              <Accordion type="single" collapsible>
                <AccordionItem value="hours-translations" className="border rounded-lg px-3">
                  <AccordionTrigger className="text-sm font-medium hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Languages className="w-4 h-4 text-muted-foreground" />
                      {t('hoursTranslations')}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-3">
                    <div className="grid sm:grid-cols-3 gap-3">
                      {availableLangs.map(lang => (
                        <div key={lang} className="space-y-1.5">
                          <Label className="text-xs uppercase text-muted-foreground">{lang}</Label>
                          <Input
                            placeholder={`${t('hours')} (${lang})`}
                            value={hoursI18n[lang] || ''}
                            onChange={e => setHoursI18n(prev => ({ ...prev, [lang]: e.target.value }))}
                          />
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <Separator />

            {/* Уведомления */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">{t('notifications.title')}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notif-sound" className="flex items-center gap-2 cursor-pointer">
                    <Volume2 className="w-4 h-4 text-muted-foreground" />
                    {t('notifications.sound')}
                  </Label>
                  <Switch
                    id="notif-sound"
                    checked={notifications.booking.sound}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, booking: { ...notifications.booking, sound: checked } })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notif-message" className="flex items-center gap-2 cursor-pointer">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    {t('notifications.message')}
                  </Label>
                  <Switch
                    id="notif-message"
                    checked={notifications.booking.message}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, booking: { ...notifications.booking, message: checked } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('notifications.melody')}</Label>
                  <div className="flex gap-2">
                    <Select
                      value={notifications.booking.soundFile}
                      onValueChange={(value) => setNotifications({ ...notifications, booking: { ...notifications.booking, soundFile: value } })}
                    >
                      <SelectTrigger className="w-full max-w-xs">
                        <SelectValue placeholder={t('notifications.default')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">{t('notifications.default')}</SelectItem>
                        <SelectItem value="/sounds/1.mp3">{t('notifications.melody1')}</SelectItem>
                        <SelectItem value="custom">{t('notifications.customUrl')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const src = notifications.booking.soundFile && notifications.booking.soundFile !== 'custom'
                          ? notifications.booking.soundFile
                          : '/sounds/default.mp3';
                        new Audio(src).play();
                      }}
                    >
                      <Volume2 className="w-4 h-4 mr-1" />
                      {t('notifications.listen')}
                    </Button>
                  </div>
                  {notifications.booking.soundFile === 'custom' && (
                    <Input
                      placeholder={t('notifications.customUrl')}
                      value={notifications.booking.soundFile}
                      onChange={(e) => setNotifications({ ...notifications, booking: { ...notifications.booking, soundFile: e.target.value } })}
                      className="mt-2"
                    />
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Локализация */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">{t('localisationSection')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Languages className="w-3.5 h-3.5 text-muted-foreground" />
                    {t('primaryLanguage')}
                  </Label>
                  <Select value={primaryLanguage} onValueChange={setPrimaryLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pl">Polski</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="ru">Русский</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="ua">Українська</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Banknote className="w-3.5 h-3.5 text-muted-foreground" />
                    {t('primaryCurrency')}
                  </Label>
                  <Select value={primaryCurrency} onValueChange={setPrimaryCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLN">PLN (zł)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="UAH">UAH (₴)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CZK">CZK (Kč)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* SEO */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">{t('seoTranslations')}</h3>
              <Accordion type="multiple" className="space-y-2">
                <AccordionItem value="seo-title" className="border rounded-lg px-3">
                  <AccordionTrigger className="text-sm font-medium hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-muted-foreground" />
                      {t('seoTitleLabel')}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-3">
                    <div className="grid sm:grid-cols-3 gap-3">
                      {availableLangs.map(lang => (
                        <div key={lang} className="space-y-1.5">
                          <Label className="text-xs uppercase text-muted-foreground">{lang}</Label>
                          <Input
                            placeholder={`${t('seoTitleLabel')} (${lang})`}
                            value={seoTitleI18n[lang] || ''}
                            onChange={e => setSeoTitleI18n(prev => ({ ...prev, [lang]: e.target.value }))}
                          />
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="seo-description" className="border rounded-lg px-3">
                  <AccordionTrigger className="text-sm font-medium hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-muted-foreground" />
                      {t('seoDescriptionLabel')}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-3">
                    <div className="grid sm:grid-cols-3 gap-3">
                      {availableLangs.map(lang => (
                        <div key={lang} className="space-y-1.5">
                          <Label className="text-xs uppercase text-muted-foreground">{lang}</Label>
                          <Textarea
                            placeholder={`${t('seoDescriptionLabel')} (${lang})`}
                            value={seoDescriptionI18n[lang] || ''}
                            onChange={e => setSeoDescriptionI18n(prev => ({ ...prev, [lang]: e.target.value }))}
                            rows={2}
                          />
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </CardContent>

          <Separator />

          <div className="flex items-center justify-between p-6 bg-muted/30 rounded-b-xl">
            <Button type="submit" className="gap-2">
              <Save className="w-4 h-4" />
              {t('save')}
            </Button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                {t('saved')}
              </span>
            )}
          </div>
        </Card>
      </form>
    </div>
  );
}