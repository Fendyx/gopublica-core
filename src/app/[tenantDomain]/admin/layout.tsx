'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import { useTenant } from '@/entities/tenant/TenantContext';
import { NotificationProvider } from '@/shared/lib/useNotifications';
import AdminNotifications from '@/widgets/Admin/AdminNotifications';
import AdminLanguageSwitcher from '@/widgets/Admin/AdminLanguageSwitcher';
import { AdminBranchSwitcher } from '@/widgets/Admin/AdminBranchSwitcher';
import { loadMessages } from '@/shared/lib/adminLocale';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ImageIcon,
  CalendarCheck,
  Megaphone,
  Settings,
  LogOut,
  Store,
  ChartLine,
  FileText
} from 'lucide-react';
import { BranchProvider } from '@/entities/branch/BranchContext';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

const DEFAULT_LOCALE = 'pl';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [locale, setLocale] = useState(DEFAULT_LOCALE);
  const [messages, setMessages] = useState<Record<string, any> | null>(null);
  const tenant = useTenant();

  useEffect(() => {
    const savedToken = localStorage.getItem('saas_token');
    if (!savedToken) {
      router.push('/admin/login');
    } else {
      setToken(savedToken);
    }
  }, []);

  useEffect(() => {
    const storedLocale = localStorage.getItem('admin_locale') || DEFAULT_LOCALE;
    setLocale(storedLocale);
    loadMessages(storedLocale).then(setMessages);
  }, []);

  const handleLocaleChange = (newLocale: string) => {
    localStorage.setItem('admin_locale', newLocale);
    setLocale(newLocale);
    loadMessages(newLocale).then(setMessages);
  };

  if (!messages || !token) {
    if (pathname === '/admin/login') return <>{children}</>;
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (pathname === '/admin/login') return <>{children}</>;

  const tenantId = tenant?.tenantId || '';

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <NotificationProvider token={token} tenantId={tenantId}>
        <BranchProvider tenantId={tenantId}>
          <AdminLayoutInner token={token} locale={locale} onLocaleChange={handleLocaleChange}>
            {children}
          </AdminLayoutInner>
        </BranchProvider>
        <AdminNotifications />
      </NotificationProvider>
    </NextIntlClientProvider>
  );
}

function AdminLayoutInner({ token, locale, onLocaleChange, children }: any) {
  const t = useTranslations('admin');
  const pathname = usePathname();
  const router = useRouter();
  const tenant = useTenant();

  const navItems = [
    { href: '/admin', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/admin/gopublica', label: t('gopublica'), icon: Megaphone },
    { href: '/admin/menu', label: t('menu'), icon: UtensilsCrossed },
    { href: '/admin/gallery', label: t('gallery'), icon: ImageIcon },
    { href: '/admin/reservations', label: t('reservations'), icon: CalendarCheck },
    { href: '/admin/analytics', label: t('analytics'), icon: ChartLine },
    { href: '/admin/branches', label: t('branches'), icon: Store },
    { href: '/admin/jobs', label: t('jobs'), icon: FileText },
    { href: '/admin/settings', label: t('settings'), icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Сайдбар */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-4">
          <h2 className="font-bold text-lg text-foreground">{tenant?.clientName ?? ''}</h2>
          <p className="text-xs text-muted-foreground">{t('siteManagement')}</p>
        </div>
        <Separator />
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${isActive
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <Separator />
        <div className="p-3 space-y-2">
          <AdminLanguageSwitcher currentLocale={locale} onChange={onLocaleChange} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              localStorage.removeItem('saas_token');
              router.push('/admin/login');
            }}
            className="w-full justify-start text-muted-foreground hover:text-destructive"
          >
            <LogOut size={16} className="mr-2" />
            {t('logout')}
          </Button>
        </div>
      </aside>

      {/* Основной контент */}
      <main className="flex-1 p-6">
        <div className="flex justify-end mb-4">
          <AdminBranchSwitcher />
        </div>
        {children}
      </main>
    </div>
  );
}