'use client';
import { useEffect, useRef, useState } from 'react';
import { useTenant } from '@/entities/tenant/TenantContext';
import { useTranslations } from 'next-intl';
import { useBranch } from '@/entities/branch/BranchContext';
import type { Branch } from '@/entities/branch/types';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
  Sparkles,
  Plus,
  Trash2,
  Store,
  Building2,
  FileText,
  MessageCircle,
  Send,
  Link2,
  Unlink,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Users,
  CalendarCheck,
} from 'lucide-react';
import {
  TelegramConnectionStatus,
  TelegramNotificationSettings,
  TelegramLinkTokenResponse,
} from '@/entities/telegram/types';
import {
  getTelegramStatus,
  getTelegramLinkToken,
  unlinkTelegram,
  getTelegramPreferences,
  updateTelegramPreferences,
} from '@/entities/telegram/api';

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export default function SettingsPageContent() {
  const t = useTranslations('admin.settingsPage');
  const tenant = useTenant();
  const { selectedBranch, branches, loading: branchLoading, refetchBranches } = useBranch();
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

  // 👈 НОВОЕ: фича "тизер скоро открытие" для ТЕКУЩЕГО выбранного филиала
  const [hasVeganTeaser, setHasVeganTeaser] = useState(false);

  // 👈 НОВОЕ: юридические реквизиты (Regulamin / Polityka prywatności)
  const [legal, setLegal] = useState({
    legalCompanyName: '',
    nip: '',
    regon: '',
    krs: '',
  });

  // 👈 НОВОЕ: Telegram Notifications — connection status and preferences
  const [telegramStatus, setTelegramStatus] = useState<TelegramConnectionStatus>({ linked: false });
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramSettings, setTelegramSettings] = useState<TelegramNotificationSettings>({
    newOrder: true,
    newReservation: true,
    newJobApplication: true,
    newPartnerRequest: true,
  });
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  // 👈 НОВОЕ: polling state for Telegram connection confirmation
  const [pollingActive, setPollingActive] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // 👈 НОВОЕ: подфилии (sub-venues) — только для основных филиалов (без parentBranchId)
  const isMainBranch = !!selectedBranch && !selectedBranch.parentBranchId;
  const subBranches = branches.filter(b => selectedBranch && b.parentBranchId === selectedBranch._id);
  const [newSubName, setNewSubName] = useState('');
  const [creatingSub, setCreatingSub] = useState(false);
  const [subError, setSubError] = useState('');

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

        // 👈 НОВОЕ: подтягиваем features.hasVeganTeaser текущего филиала
        setHasVeganTeaser(Boolean(data.features?.hasVeganTeaser));

        // 👈 НОВОЕ: подтягиваем юридические реквизиты
        setLegal({
          legalCompanyName: data.legal?.legalCompanyName || data.businessName || '',
          nip: data.legal?.nip || '',
          regon: data.legal?.regon || '',
          krs: data.legal?.krs || '',
        });

        if (data.notifications) {
          setNotifications(prev => ({
            ...prev,
            ...data.notifications,
            booking: { ...prev.booking, ...(data.notifications.booking || {}) },
          }));
        }

        // 👈 НОВОЕ: подтягиваем Telegram notification preferences
        if (data.notifications?.telegram) {
          const tg = data.notifications.telegram;
          setTelegramSettings({
            newOrder: tg.events?.newOrder ?? true,
            newReservation: tg.events?.newReservation ?? true,
            newJobApplication: tg.events?.newJobApplication ?? true,
            newPartnerRequest: tg.events?.newPartnerRequest ?? true,
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // 👈 НОВОЕ: отдельный запрос статуса Telegram-соединения
    setTelegramLoading(true);
    getTelegramStatus({
      tenantId: tenant?.tenantId || '',
      branchId: selectedBranch._id,
      token,
    })
      .then(setTelegramStatus)
      .catch(err => console.error('Failed to fetch Telegram status:', err))
      .finally(() => setTelegramLoading(false));
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
        // 👈 НОВОЕ: сохраняем фичи филиала (уходит в branch.settingsOverride.features)
        features: {
          hasVeganTeaser,
        },
        // 👈 НОВОЕ: юридические реквизиты (уходит в tenant.legal)
        legal,
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

  // 👈 НОВОЕ: Telegram handlers
  const handleTelegramConnect = async () => {
    if (!selectedBranch || !token) return;
    setConnecting(true);
    setConnectError(null);
    try {
      const response = await getTelegramLinkToken({
        tenantId: tenant?.tenantId || '',
        branchId: selectedBranch._id,
        token,
      });
      // Open Telegram deep link in new tab
      window.open(response.deepLink, '_blank', 'noopener,noreferrer');
      // Start polling for connection confirmation
      startTelegramPolling();
    } catch (err: any) {
      setConnectError(err?.message || t('telegram.errors.connectFailed'));
      console.error('Telegram connect failed:', err);
    } finally {
      setConnecting(false);
    }
  };

  const startTelegramPolling = () => {
    if (!selectedBranch || !token) return;
    setPollingActive(true);
    const poll = async () => {
      try {
        const status = await getTelegramStatus({
          tenantId: tenant?.tenantId || '',
          branchId: selectedBranch._id,
          token,
        });
        setTelegramStatus(status);
        if (status.linked) {
          stopTelegramPolling();
        }
      } catch (err) {
        console.error('Telegram polling error:', err);
      }
    };
    // Initial check
    poll();
    // Poll every 3 seconds
    pollingRef.current = setInterval(poll, 3000);
    // Auto-stop after 2 minutes
    setTimeout(stopTelegramPolling, 120000);
  };

  const stopTelegramPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setPollingActive(false);
  };

  const handleTelegramDisconnect = async () => {
    if (!selectedBranch || !token) return;
    setDisconnecting(true);
    try {
      await unlinkTelegram({
        tenantId: tenant?.tenantId || '',
        branchId: selectedBranch._id,
        token,
      });
      setTelegramStatus({ linked: false });
      setShowDisconnectConfirm(false);
    } catch (err: any) {
      console.error('Telegram disconnect failed:', err);
      alert(t('telegram.errors.disconnectFailed'));
    } finally {
      setDisconnecting(false);
    }
  };

  const handleTelegramSettingChange = async (key: keyof TelegramNotificationSettings, value: boolean) => {
    if (!selectedBranch || !token) return;
    const newSettings = { ...telegramSettings, [key]: value };
    setTelegramSettings(newSettings);
    setSettingsSaving(true);
    try {
      await updateTelegramPreferences({
        tenantId: tenant?.tenantId || '',
        branchId: selectedBranch._id,
        token,
        settings: newSettings,
      });
    } catch (err: any) {
      console.error('Failed to save Telegram settings:', err);
      // Revert on error
      setTelegramSettings(telegramSettings);
      alert(t('telegram.errors.settingsSaveFailed'));
    } finally {
      setSettingsSaving(false);
    }
  };

  // 👈 НОВОЕ: создать подфилию у текущего (основного) филиала
  const handleCreateSubBranch = async () => {
    if (!selectedBranch || !newSubName.trim() || !token) return;
    setCreatingSub(true);
    setSubError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/branches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: newSubName.trim(),
          city: selectedBranch.city,
          address: selectedBranch.address,
          phone: selectedBranch.phone,
          email: selectedBranch.email,
          parentBranchId: selectedBranch._id,
          venueType: 'concept',
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create sub-venue');
      }
      setNewSubName('');
      await refetchBranches();
    } catch (err: any) {
      setSubError(err.message || 'Ошибка создания подфилии');
    } finally {
      setCreatingSub(false);
    }
  };

  // 👈 НОВОЕ: удалить (soft-delete) подфилию
  const handleDeleteSubBranch = async (branch: Branch) => {
    if (!token) return;
    if (!confirm(`Удалить "${branch.name}"?`)) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/branches/${branch._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) await refetchBranches();
    } catch (err) {
      console.error(err);
    }
  };

  if (branchLoading || loading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">{t('loading')}</div>;
  }

  if (!selectedBranch) {
    return <div className="text-center py-20">{t('branchSelectionPrompt')}</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <MapPin className="w-4 h-4" />
          {t('branchInfo', { name: selectedBranch.name })} {selectedBranch.city && `(${selectedBranch.city})`}
          {!isMainBranch && (
            <span className="ml-2 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
              Sub-venue
            </span>
          )}
        </div>
        <h2 className="text-2xl font-bold">{t('title')}</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className={`grid w-full mb-8 ${isMainBranch ? 'grid-cols-2 sm:grid-cols-7' : 'grid-cols-2 sm:grid-cols-6'}`}>
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                <TabsTrigger value="localization">Localization</TabsTrigger>
                <TabsTrigger value="seo">SEO & Alerts</TabsTrigger>
                <TabsTrigger value="telegram">{t('telegram.tabLabel')}</TabsTrigger>
                <TabsTrigger value="legal">Prawne</TabsTrigger>
                {isMainBranch && <TabsTrigger value="subvenues">Sub-venues</TabsTrigger>}
              </TabsList>

              {/* --- ВКЛАДКА 1: GENERAL --- */}
              <TabsContent value="general" className="space-y-6">

                <div className="space-y-2">
  <Label htmlFor="businessName" className="flex items-center gap-1.5">
    {t('businessName')}
  </Label>
  <Input
    id="businessName"
    value={businessName}
    onChange={e => setBusinessName(e.target.value)}
    placeholder={t('exampleBusinessName')}
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
                  <Label className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-muted-foreground" />{t('workingHoursByDay')}</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-muted/20 p-4 rounded-xl border border-border">
                    {DAY_KEYS.map(day => (
                      <div key={day} className="flex flex-col gap-1.5">
                        <Label className="text-[11px] uppercase text-muted-foreground ml-1 font-semibold">{t(`days.${day}`)}</Label>
                        <Input placeholder="10:00 - 22:00" value={workingHours[day] || ''} onChange={e => setWorkingHours(prev => ({ ...prev, [day]: e.target.value }))} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 👈 НОВОЕ: тизер "скоро открытие" в Hero — только имеет смысл для основных филиалов,
                    у которых есть/будет подфилия в том же здании */}
                {isMainBranch && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between bg-muted/20 p-4 rounded-xl border border-border">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <Label htmlFor="vegan-teaser" className="cursor-pointer">
                            Показать тизер «Wkrótce otwarcie» в Hero
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1 max-w-md">
                            Включает 2-й слайд на главной с анонсом подфилии (например, вегетарианского
                            кафе в том же здании). Слайд появится только для этого филиала.
                          </p>
                        </div>
                      </div>
                      <Switch id="vegan-teaser" checked={hasVeganTeaser} onCheckedChange={setHasVeganTeaser} />
                    </div>
                  </>
                )}
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
                    <p className="text-xs text-muted-foreground">{t('leaveEmptyPageColor')}</p>
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
                    <p className="text-xs text-muted-foreground">{t('leaveEmptyDefaultColor')}</p>
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

              {/* --- ВКЛАДКА: TELEGRAM --- */}
              <TabsContent value="telegram" className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                    <MessageCircle className="w-3.5 h-3.5" />
                    {t('telegram.title')}
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-lg">{t('telegram.description')}</p>
                </div>

                {/* Connection Status */}
                <Card className="border-border">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-muted/50">
                          {telegramStatus.linked ? (
                            <CheckCircle className="w-6 h-6 text-emerald-500" />
                          ) : (
                            <MessageCircle className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {telegramStatus.linked
                              ? t('telegram.status.connected')
                              : t('telegram.status.disconnected')}
                          </p>
                          {telegramStatus.linked && telegramStatus.chatId && (
                            <p className="text-sm text-muted-foreground">
                              {t('telegram.status.connectedAs', { username: telegramStatus.chatId })}
                            </p>
                          )}
                          {telegramStatus.linked && telegramStatus.linkedAt && (
                            <p className="text-sm text-muted-foreground">
                              {t('telegram.status.connectedOn', {
                                date: new Date(telegramStatus.linkedAt).toLocaleDateString(),
                              })}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {telegramStatus.linked ? (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowDisconnectConfirm(true)}
                              disabled={disconnecting}
                              className="gap-2"
                            >
                              <Unlink className="w-4 h-4" />
                              {t('telegram.disconnectButton')}
                            </Button>
                          </>
                        ) : (
                          <Button
                            type="button"
                            onClick={handleTelegramConnect}
                            disabled={connecting || !token}
                            className="gap-2"
                          >
                            {connecting ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                {t('telegram.status.connecting')}
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                {t('telegram.connectButton')}
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {connectError && (
                      <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-destructive" />
                        <p className="text-sm text-destructive">{connectError}</p>
                      </div>
                    )}

                    {pollingActive && !telegramStatus.linked && (
                      <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                        <p className="text-sm text-primary">
                          {t('telegram.status.connecting')} — {t('telegram.instructions.step2')}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Instructions */}
                <Card className="border-border">
                  <CardContent className="p-6">
                    <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-muted-foreground" />
                      {t('telegram.instructions.title')}
                    </h4>
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">1</span>
                        {t('telegram.instructions.step1')}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">2</span>
                        {t('telegram.instructions.step2')}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">3</span>
                        {t('telegram.instructions.step3')}
                      </li>
                    </ol>
                  </CardContent>
                </Card>

                {/* Notification Preferences */}
                <Card className="border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-foreground flex items-center gap-2">
                        <Bell className="w-4 h-4 text-muted-foreground" />
                        {t('telegram.preferences')}
                      </h4>
                      {settingsSaving && (
                        <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">{t('telegram.preferencesDesc')}</p>

                    <div className="space-y-4">
                      {/* Orders */}
                      <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <ShoppingBag className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{t('telegram.notifications.orders')}</p>
                            <p className="text-xs text-muted-foreground">{t('telegram.notifications.ordersDesc')}</p>
                          </div>
                        </div>
                        <Switch
                          checked={telegramSettings.newOrder}
                          onCheckedChange={(checked) => handleTelegramSettingChange('newOrder', checked)}
                          disabled={settingsSaving}
                        />
                      </div>

                      {/* Reservations */}
                      <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <CalendarCheck className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{t('telegram.notifications.reservations')}</p>
                            <p className="text-xs text-muted-foreground">{t('telegram.notifications.reservationsDesc')}</p>
                          </div>
                        </div>
                        <Switch
                          checked={telegramSettings.newReservation}
                          onCheckedChange={(checked) => handleTelegramSettingChange('newReservation', checked)}
                          disabled={settingsSaving}
                        />
                      </div>

                      {/* Job Applications */}
                      <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <FileText className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{t('telegram.notifications.jobApplications')}</p>
                            <p className="text-xs text-muted-foreground">{t('telegram.notifications.jobApplicationsDesc')}</p>
                          </div>
                        </div>
                        <Switch
                          checked={telegramSettings.newJobApplication}
                          onCheckedChange={(checked) => handleTelegramSettingChange('newJobApplication', checked)}
                          disabled={settingsSaving}
                        />
                      </div>

                      {/* Partner Requests */}
                      <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Users className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{t('telegram.notifications.partnerRequests')}</p>
                            <p className="text-xs text-muted-foreground">{t('telegram.notifications.partnerRequestsDesc')}</p>
                          </div>
                        </div>
                        <Switch
                          checked={telegramSettings.newPartnerRequest}
                          onCheckedChange={(checked) => handleTelegramSettingChange('newPartnerRequest', checked)}
                          disabled={settingsSaving}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* --- ВКЛАДКА 5: PRAWNE (ЮРИДИЧЕСКИЕ РЕКВИЗИТЫ) --- */}
              <TabsContent value="legal" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">
                    Dane rejestrowe
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-lg">
                    Pola te są wstawiane automatycznie do strony Regulaminu i Polityki prywatności.
                    Pozostaw puste, jeśli nie dotyczy.
                  </p>

                  <div className="space-y-2">
                    <Label htmlFor="legalCompanyName" className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                      Nazwa firmy (wymagana w regulaminie)
                    </Label>
                    <Input
                      id="legalCompanyName"
                      value={legal.legalCompanyName}
                      onChange={e => setLegal(prev => ({ ...prev, legalCompanyName: e.target.value }))}
                      placeholder="np. Kawiarnia Kocia"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nip" className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                        NIP
                      </Label>
                      <Input
                        id="nip"
                        value={legal.nip}
                        onChange={e => setLegal(prev => ({ ...prev, nip: e.target.value }))}
                        placeholder="np. 1234567890"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regon" className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                        REGON
                      </Label>
                      <Input
                        id="regon"
                        value={legal.regon}
                        onChange={e => setLegal(prev => ({ ...prev, regon: e.target.value }))}
                        placeholder="np. 12345678901234"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="krs" className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                      KRS
                    </Label>
                    <Input
                      id="krs"
                      value={legal.krs}
                      onChange={e => setLegal(prev => ({ ...prev, krs: e.target.value }))}
                      placeholder="np. 0000123456"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* --- ВКЛАДКА 6 (НОВАЯ): SUB-VENUES --- */}
              {isMainBranch && (
                <TabsContent value="subvenues" className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                      <Store className="w-3.5 h-3.5" />
                      Sub-venues в этом здании
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-lg">
                      Подфилия — отдельное заведение в том же здании (например, веганское кафе в подвале
                      той же основной точки). У подфилии своё меню и настройки, но общий адрес/город
                      с родительским филиалом.
                    </p>
                  </div>

                  {subBranches.length > 0 && (
                    <div className="space-y-2">
                      {subBranches.map(sub => (
                        <div
                          key={sub._id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20"
                        >
                          <div>
                            <div className="text-sm font-medium">{sub.name}</div>
                            <div className="text-xs text-muted-foreground">{sub.city}</div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteSubBranch(sub)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-end gap-3 bg-muted/20 p-4 rounded-xl border border-border">
                    <div className="flex-1 space-y-1.5">
                      <Label htmlFor="new-sub-name">Название подфилии</Label>
                      <Input
                        id="new-sub-name"
                        placeholder="Kawiarnia wegańska"
                        value={newSubName}
                        onChange={e => setNewSubName(e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleCreateSubBranch}
                      disabled={!newSubName.trim() || creatingSub}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Добавить
                    </Button>
                  </div>
                  {subError && <p className="text-xs text-destructive">{subError}</p>}

                  <p className="text-xs text-muted-foreground">
                    После создания подфилии выберите её в переключателе филиалов вверху, чтобы настроить
                    её собственное меню, часы работы и SEO — независимо от основного филиала.
                  </p>
                </TabsContent>
              )}

            </Tabs>
          </CardContent>

          <Separator />

          <div className="flex items-center justify-between p-6 bg-muted/30 rounded-b-xl">
            <Button type="submit" className="gap-2"><Save className="w-4 h-4" />{t('save')}</Button>
            {saved && <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-medium"><CheckCircle2 className="w-4 h-4" />{t('saved')}</span>}
          </div>
        </Card>
      </form>

      {/* Disconnect Telegram Confirmation Dialog */}
      <Dialog open={showDisconnectConfirm} onOpenChange={setShowDisconnectConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('telegram.disconnectConfirm')}</DialogTitle>
            <DialogDescription>
              {t('telegram.disconnectConfirmDesc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisconnectConfirm(false)}>
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleTelegramDisconnect}
              disabled={disconnecting}
              className="gap-2"
            >
              {disconnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {t('telegram.disconnecting')}
                </>
              ) : (
                <>
                  <Unlink className="w-4 h-4" />
                  {t('telegram.disconnectButton')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}