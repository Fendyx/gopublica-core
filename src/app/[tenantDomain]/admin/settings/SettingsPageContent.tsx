'use client';
import { useEffect, useState } from 'react';
import { useTenant } from '@/entities/tenant/TenantContext';
import { useTranslations } from 'next-intl';
import { useBranch } from '@/entities/branch/BranchContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
  Paintbrush,
  ShoppingBag,
  MousePointerClick,
  Eye,
  Image,
} from 'lucide-react';

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export default function SettingsPageContent() {
  const t = useTranslations('admin.settingsPage');
  const tenant = useTenant();
  const { selectedBranch, loading: branchLoading } = useBranch();
  const [token, setToken] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState('');

  const [form, setForm] = useState({
    phone: '', address: '', email: '', hours: '', googleMapsUrl: '',
  });

  const [workingHours, setWorkingHours] = useState<Record<string, string>>({
    monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: ''
  });

  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [primaryLanguage, setPrimaryLanguage] = useState('pl');
  const [primaryCurrency, setPrimaryCurrency] = useState('PLN');

  // Оставили только радиус и вариант карточки (Каталог убран)
  const [radius, setRadius] = useState('lg');
  const [cardVariant, setCardVariant] = useState('action-bar');

  // Убрали hoursI18n
  const [seoTitleI18n, setSeoTitleI18n] = useState<Record<string, string>>({});
  const [seoDescriptionI18n, setSeoDescriptionI18n] = useState<Record<string, string>>({});

  const [notifications, setNotifications] = useState({
    booking: { sound: true, message: true, soundFile: '' },
  });

  const SUPPORTED_LANGUAGES = ['pl', 'en', 'de', 'ru', 'es', 'ua'];
  const availableLangs = SUPPORTED_LANGUAGES;

  const [categoryBgColor, setCategoryBgColor] = useState('');
  const [pageBgColor, setPageBgColor] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('saas_token');
    if (!savedToken) {
      window.location.href = '/admin/login';
    } else {
      setToken(savedToken);
    }
  }, []);

  useEffect(() => {
    if (!token || !selectedBranch) return;

    let url = `${process.env.NEXT_PUBLIC_API_URL}/api/saas/settings?tenantId=${tenant?.tenantId}&branchId=${selectedBranch._id}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setBusinessName(data.businessName || '');
        setForm({
          phone: data.phone || tenant?.contact?.phone || '',
          address: data.address || tenant?.contact?.address || '',
          email: data.email || tenant?.contact?.email || '',
          hours: data.hours || tenant?.contact?.hours || '',
          googleMapsUrl: data.googleMapsUrl || tenant?.contact?.googleMapsUrl || '',
        });

        setWorkingHours(data.workingHours || {});
        if (data.primaryLanguage) setPrimaryLanguage(data.primaryLanguage);
        if (data.primaryCurrency) setPrimaryCurrency(data.primaryCurrency);

        setRadius(data.theme?.radius || 'lg');
        setCardVariant(data.theme?.productCardVariant || 'action-bar');

        setSeoTitleI18n(data.seoTitleI18n || {});
        setSeoDescriptionI18n(data.seoDescriptionI18n || {});

        setCategoryBgColor(data.theme?.categoryBgColor || tenant?.theme?.categoryBgColor || '');
        setPageBgColor(data.theme?.pageBgColor || '');

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
  }, [token, selectedBranch, tenant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch) return alert('Сначала выберите филиал');

    try {
      const payload = {
        ...form,
        businessName,
        workingHours,
        notifications,
        primaryLanguage,
        primaryCurrency,
        seoTitleI18n,
        seoDescriptionI18n,
        branchId: selectedBranch._id,
        theme: {
          radius,
          productCardVariant: cardVariant,
          categoryBgColor,
          pageBgColor,
        },
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
    <div className="max-w-4xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <MapPin className="w-4 h-4" />
          Настройки для филиала: <strong>{selectedBranch.name}</strong> {selectedBranch.city && `(${selectedBranch.city})`}
        </div>
        <h2 className="text-2xl font-bold">{t('title')}</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-8">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                <TabsTrigger value="localization">Localization</TabsTrigger>
                <TabsTrigger value="seo">SEO & Alerts</TabsTrigger>
              </TabsList>

              {/* --- ВКЛАДКА 1: GENERAL --- */}
              <TabsContent value="general" className="space-y-6">

                <div className="space-y-2">
  <Label htmlFor="businessName" className="flex items-center gap-1.5">
    Название бизнеса
  </Label>
  <Input
    id="businessName"
    value={businessName}
    onChange={e => setBusinessName(e.target.value)}
    placeholder="Например: ООО «Ромашка»"
  />
</div>
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">{t('contactSection')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-muted-foreground" />{t('phone')}</Label>
                      <Input id="phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-muted-foreground" />{t('email')}</Label>
                      <Input id="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-muted-foreground" />{t('address')}</Label>
                    <Input id="address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="googleMaps" className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-muted-foreground" />{t('googleMapsUrl')}</Label>
                    <Input id="googleMaps" value={form.googleMapsUrl} onChange={e => setForm({ ...form, googleMapsUrl: e.target.value })} />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-muted-foreground" />Часы работы по дням</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-muted/20 p-4 rounded-xl border border-border">
                    {DAY_KEYS.map(day => (
                      <div key={day} className="flex flex-col gap-1.5">
                        <Label className="text-[11px] uppercase text-muted-foreground ml-1 font-semibold">{t(`days.${day}`)}</Label>
                        <Input placeholder="10:00 - 22:00" value={workingHours[day] || ''} onChange={e => setWorkingHours(prev => ({ ...prev, [day]: e.target.value }))} />
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* --- ВКЛАДКА 2: APPEARANCE --- */}
              <TabsContent value="appearance" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">UI Style</h3>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5"><Paintbrush className="w-3.5 h-3.5 text-muted-foreground" />Border Radius</Label>
                    <Select value={radius} onValueChange={setRadius}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sharp (0px)</SelectItem>
                        <SelectItem value="sm">Subtle (4px)</SelectItem>
                        <SelectItem value="lg">Default (10px)</SelectItem>
                        <SelectItem value="xl">Rounded (16px)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 pt-4">
                    <Label>Category Block Background</Label>
                    <div className="flex items-center gap-4">
                      <input
                        type="color"
                        value={categoryBgColor || '#ffffff'}
                        onChange={(e) => setCategoryBgColor(e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer border border-border bg-transparent p-1"
                      />
                      <Input
                        placeholder="Empty = Default"
                        value={categoryBgColor}
                        onChange={(e) => setCategoryBgColor(e.target.value)}
                        className="max-w-xs"
                      />
                      {categoryBgColor && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => setCategoryBgColor('')}>
                          Reset
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Оставьте пустым для использования цвета страницы по умолчанию.</p>
                  </div>

                  <div className="space-y-2 pt-4">
                    <Label>Page Background</Label>
                    <div className="flex items-center gap-4">
                      <input
                        type="color"
                        value={pageBgColor || '#ffffff'}
                        onChange={(e) => setPageBgColor(e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer border border-border bg-transparent p-1"
                      />
                      <Input
                        placeholder="Empty = Default"
                        value={pageBgColor}
                        onChange={(e) => setPageBgColor(e.target.value)}
                        className="max-w-xs"
                      />
                      {pageBgColor && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => setPageBgColor('')}>
                          Reset
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Оставьте пустым для использования цвета по умолчанию.</p>
                  </div>

                  {/* Настройки каталога для E-commerce (Убран Catalog Layout) */}
                  {tenant?.niche === 'ecommerce' && (
                    <div className="pt-4 space-y-6">
                      <Separator />
                      {/* Выбор стиля карточки товара */}
                      <div className="space-y-2">
                        <Label>Product Card Style</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[
                            { val: 'action-bar', label: 'Action Bar', desc: 'Button under image', icon: ShoppingBag },
                            { val: 'overlay', label: 'Hover Overlay', desc: 'Buttons on image', icon: Eye },
                            { val: 'minimal', label: 'Minimalist', desc: 'Only text & link', icon: MousePointerClick },
                            { val: 'clean', label: 'Clean', desc: 'Image + name overlay', icon: Image },
                            { val: 'hover-vertical', label: 'Vertical Overlay', desc: 'Vertical buttons', icon: Eye },
                            { val: 'action-overlay', label: 'Action + Overlay', desc: 'Info below + overlay', icon: Eye },
                          ].map(opt => (
                            <button
                              key={opt.val}
                              type="button"
                              onClick={() => setCardVariant(opt.val)}
                              className={`p-4 border rounded-xl text-left transition-all ${cardVariant === opt.val ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-gray-300'}`}
                            >
                              <opt.icon className="w-5 h-5 mb-2 text-primary" />
                              <div className="text-sm font-semibold text-foreground">{opt.label}</div>
                              <div className="text-xs text-muted-foreground mt-1">{opt.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* --- ВКЛАДКА 3: LOCALIZATION --- */}
              <TabsContent value="localization" className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5"><Languages className="w-3.5 h-3.5 text-muted-foreground" />{t('primaryLanguage')}</Label>
                    <Select value={primaryLanguage} onValueChange={setPrimaryLanguage}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <Label className="flex items-center gap-1.5"><Banknote className="w-3.5 h-3.5 text-muted-foreground" />{t('primaryCurrency')}</Label>
                    <Select value={primaryCurrency} onValueChange={setPrimaryCurrency}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
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
                {/* Полностью убрали Accordion с переводами часов */}
              </TabsContent>

              {/* --- ВКЛАДКА 4: SEO & ALERTS --- */}
              <TabsContent value="seo" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">{t('notifications.title')}</h3>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notif-sound" className="flex items-center gap-2 cursor-pointer"><Volume2 className="w-4 h-4 text-muted-foreground" />{t('notifications.sound')}</Label>
                    <Switch id="notif-sound" checked={notifications.booking.sound} onCheckedChange={(checked) => setNotifications({ ...notifications, booking: { ...notifications.booking, sound: checked } })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notif-message" className="flex items-center gap-2 cursor-pointer"><Bell className="w-4 h-4 text-muted-foreground" />{t('notifications.message')}</Label>
                    <Switch id="notif-message" checked={notifications.booking.message} onCheckedChange={(checked) => setNotifications({ ...notifications, booking: { ...notifications.booking, message: checked } })} />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">{t('seoTranslations')}</h3>
                  <Accordion type="multiple" className="space-y-2">
                    <AccordionItem value="seo-title" className="border rounded-lg px-3">
                      <AccordionTrigger className="text-sm font-medium hover:no-underline"><div className="flex items-center gap-2"><Search className="w-4 h-4 text-muted-foreground" />{t('seoTitleLabel')}</div></AccordionTrigger>
                      <AccordionContent className="pt-2 pb-3">
                        <div className="grid sm:grid-cols-3 gap-3">
                          {availableLangs.map(lang => (
                            <div key={lang} className="space-y-1.5">
                              <Label className="text-xs uppercase text-muted-foreground">{lang}</Label>
                              <Input placeholder={`${t('seoTitleLabel')} (${lang})`} value={seoTitleI18n[lang] || ''} onChange={e => setSeoTitleI18n(prev => ({ ...prev, [lang]: e.target.value }))} />
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* ВЕРНУЛИ SEO DESCRIPTION */}
                    <AccordionItem value="seo-description" className="border rounded-lg px-3">
                      <AccordionTrigger className="text-sm font-medium hover:no-underline"><div className="flex items-center gap-2"><Search className="w-4 h-4 text-muted-foreground" />{t('seoDescriptionLabel')}</div></AccordionTrigger>
                      <AccordionContent className="pt-2 pb-3">
                        <div className="grid sm:grid-cols-3 gap-3">
                          {availableLangs.map(lang => (
                            <div key={lang} className="space-y-1.5">
                              <Label className="text-xs uppercase text-muted-foreground">{lang}</Label>
                              <Textarea placeholder={`${t('seoDescriptionLabel')} (${lang})`} value={seoDescriptionI18n[lang] || ''} onChange={e => setSeoDescriptionI18n(prev => ({ ...prev, [lang]: e.target.value }))} rows={2} />
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </TabsContent>

            </Tabs>
          </CardContent>

          <Separator />

          <div className="flex items-center justify-between p-6 bg-muted/30 rounded-b-xl">
            <Button type="submit" className="gap-2"><Save className="w-4 h-4" />{t('save')}</Button>
            {saved && <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-medium"><CheckCircle2 className="w-4 h-4" />{t('saved')}</span>}
          </div>
        </Card>
      </form>
    </div>
  );
}