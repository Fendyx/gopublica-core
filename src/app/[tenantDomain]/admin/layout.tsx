'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { TenantProvider } from '@/entities/tenant/TenantContext';
import { NotificationProvider } from '@/shared/lib/useNotifications';
import AdminNotifications from '@/widgets/Admin/AdminNotifications';
import AdminSidebar from '@/widgets/Admin/AdminSidebar';
import AdminTopBar from '@/widgets/Admin/AdminTopBar';
import { AdminBranchSwitcher } from '@/widgets/Admin/AdminBranchSwitcher';
import { loadMessages } from '@/shared/lib/adminLocale';
import { ToastProvider } from '@/shared/ui/Toast';
import { BranchProvider } from '@/entities/branch/BranchContext';

const DEFAULT_LOCALE = 'pl';

function AdminLayoutInner({ token, locale, onLocaleChange, children }: any) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar — sticky on desktop, slide-in on mobile */}
      <AdminSidebar
        locale={locale}
        onLocaleChange={onLocaleChange}
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <AdminTopBar
          onOpenMenu={() => setMobileMenuOpen(true)}
          showMenuButton={!mobileMenuOpen}
        />

        {/* Desktop: branch switcher row */}
        <div className="hidden lg:flex justify-end items-center px-6 pt-4 pb-2">
          <AdminBranchSwitcher />
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

// Helper to decode JWT payload (base64url) without external dependencies
function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    // base64url -> base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [locale, setLocale] = useState(DEFAULT_LOCALE);
  const [messages, setMessages] = useState<Record<string, any> | null>(null);
  const [tenantId, setTenantId] = useState<string>('');

  useEffect(() => {
    const savedToken = localStorage.getItem('saas_token');
    if (!savedToken) {
      router.push('/admin/login');
    } else {
      setToken(savedToken);
      // Extract tenantId from JWT payload
      const payload = decodeJwtPayload(savedToken);
      console.log('JWT Payload:', payload); // DEBUG: check what's in the token
      if (payload?.tenantId) {
        setTenantId(payload.tenantId);
      }
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

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <TenantProvider tenantId={tenantId}>
        <NotificationProvider token={token} tenantId={tenantId}>
          <BranchProvider tenantId={tenantId} token={token}>
            <ToastProvider>
              <AdminLayoutInner token={token} locale={locale} onLocaleChange={handleLocaleChange}>
                {children}
              </AdminLayoutInner>
            </ToastProvider>
          </BranchProvider>
          <AdminNotifications />
        </NotificationProvider>
      </TenantProvider>
    </NextIntlClientProvider>
  );
}