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
} from 'lucide-react';
import { BranchProvider } from '@/entities/branch/BranchContext';

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
    { href: '/admin/menu', label: t('menu'), icon: UtensilsCrossed },
    { href: '/admin/gallery', label: t('gallery'), icon: ImageIcon },
    { href: '/admin/reservations', label: t('reservations'), icon: CalendarCheck },
    { href: '/admin/gopublica', label: t('gopublica'), icon: Megaphone },
    { href: '/admin/branches', label: t('branches'), icon: Store },
    { href: '/admin/settings', label: t('settings'), icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col">
        <div className="p-4 border-b border-zinc-200">
          <h2 className="font-bold text-lg">{tenant?.clientName ?? ''}</h2>
          <p className="text-xs text-zinc-500">{t('siteManagement')}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                pathname === item.href
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-zinc-200 space-y-3">
          <AdminLanguageSwitcher currentLocale={locale} onChange={onLocaleChange} />
          <button
            onClick={() => {
              localStorage.removeItem('saas_token');
              router.push('/admin/login');
            }}
            className="w-full text-left text-sm text-zinc-500 hover:text-red-600 flex items-center gap-2"
          >
            <LogOut size={16} />
            {t('logout')}
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6">
        <div className="flex justify-end mb-4">
          <AdminBranchSwitcher />
        </div>
        {children}
      </main>
    </div>
  );
}