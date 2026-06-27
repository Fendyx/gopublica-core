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
  FileText,
  Package,
  Menu,
  X,
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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isEcommerce = tenant?.niche === 'ecommerce';

  const navItems = [
    { href: '/admin', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/admin/gopublica', label: t('gopublica'), icon: Megaphone },
    {
      href: isEcommerce ? '/admin/ecommerce' : '/admin/menu',
      label: isEcommerce ? 'Catalog' : t('menu'),
      icon: isEcommerce ? Package : UtensilsCrossed,
    },
    { href: '/admin/orders', label: t('orders'), icon: FileText },
    { href: '/admin/gallery', label: t('gallery'), icon: ImageIcon },
    { href: '/admin/reservations', label: t('reservations'), icon: CalendarCheck },
    { href: '/admin/analytics', label: t('analytics'), icon: ChartLine },
    { href: '/admin/branches', label: t('branches'), icon: Store },
    { href: '/admin/jobs', label: t('jobs'), icon: FileText },
    { href: '/admin/settings', label: t('settings'), icon: Settings },
  ];

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="platform-ui flex min-h-screen bg-background relative">
      
      {/* Кнопка открытия меню (показываем только когда меню закрыто) */}
      {!mobileMenuOpen && (
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={20} />
          </Button>
        </div>
      )}

      {/* Сайдбар */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Шапка сайдбара с названием и кнопкой закрытия */}
        <div className="p-4 flex items-start justify-between">
          <div>
            <h2 className="font-bold text-lg text-foreground">
              {tenant?.businessName || tenant?.clientName || ''}
            </h2>
            <p className="text-xs text-muted-foreground">{t('siteManagement')}</p>
          </div>
          
          {/* Кнопка закрытия меню (в правом углу сайдбара) */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden -mt-1 -mr-1 text-muted-foreground hover:text-foreground"
            onClick={closeMobileMenu}
          >
            <X size={20} />
          </Button>
        </div>
        
        <Separator />
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-black/5 dark:bg-white/10 text-foreground font-medium backdrop-blur-sm shadow-sm'
                    : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground'
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

      {/* Оверлей для мобильного меню (затемнение фона) */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      <main className="flex-1 p-4 lg:p-6 pt-16 lg:pt-6">
        <div className="flex justify-end mb-4">
          <AdminBranchSwitcher />
        </div>
        {children}
      </main>
    </div>
  );
}