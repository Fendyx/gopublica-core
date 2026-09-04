'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTenant } from '@/entities/tenant/TenantContext';
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
  ShoppingCart,
  Sparkles,
  Users,
  Users2,
  Layout,
  ClipboardList,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminLanguageSwitcher from '@/widgets/Admin/AdminLanguageSwitcher';
import ThemeToggle from '@/shared/ui/ThemeToggle';

interface AdminSidebarProps {
  locale: string;
  onLocaleChange: (locale: string) => void;
  mobileOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ locale, onLocaleChange, mobileOpen, onClose }: AdminSidebarProps) {
  const t = useTranslations('admin');
  const pathname = usePathname();
  const router = useRouter();
  const tenant = useTenant();

  const isBeauty = tenant?.niche === 'beauty';
  const canManageMenu = tenant?.canManageMenu ?? tenant?.moduleAccess?.menu?.canManage ?? false;
  const canManageOrders = tenant?.canManageOrders ?? tenant?.moduleAccess?.orders?.canManage ?? false;
  const hasMenu = tenant?.features?.hasMenu ?? false;
  const hasOnlineOrdering = tenant?.features?.hasOnlineOrdering ?? false;

  const navItems = [
    { href: '/admin', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/admin/gopublica', label: t('gopublica'), icon: Megaphone },
    { href: '/admin/gopublica/orders', label: t('myOrders'), icon: ShoppingCart },
    { href: '/admin/page-builder', label: t('pageBuilder'), icon: Layout },
    ...(!isBeauty && hasMenu && canManageMenu
      ? [{ href: '/admin/menu', label: t('menu'), icon: UtensilsCrossed }]
      : []),
    ...(!isBeauty && hasOnlineOrdering
      ? [{ href: '/admin/ecommerce', label: t('catalog'), icon: Package }]
      : []),
    ...(canManageOrders ? [{ href: '/admin/orders', label: t('orders'), icon: FileText }] : []),
    ...(canManageOrders ? [{ href: '/admin/customers', label: t('customers'), icon: Users }] : []),
    ...(canManageOrders ? [{ href: '/admin/submissions', label: t('submissions'), icon: ClipboardList }] : []),
    ...(isBeauty ? [
      { href: '/admin/beauty-services', label: t('beautyServicesNav'), icon: Sparkles },
      { href: '/admin/beauty-masters', label: t('beautyMastersNav'), icon: Users2 },
    ] : []),
    { href: '/admin/gallery', label: t('gallery'), icon: ImageIcon },
    { href: '/admin/articles', label: t('articles'), icon: FileText },
    { href: '/admin/reservations', label: t('reservations'), icon: CalendarCheck },
    { href: '/admin/analytics', label: t('analytics'), icon: ChartLine },
    { href: '/admin/branches', label: t('branches'), icon: Store },
    { href: '/admin/jobs', label: t('jobs'), icon: FileText },
    { href: '/admin/settings', label: t('settings'), icon: Settings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          glass-panel
          fixed inset-y-0 left-0 z-40 w-64 flex flex-col
          transition-transform duration-300 ease-out
          lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:z-30
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="px-4 pt-5 pb-4 flex items-start justify-between">
          <div className="min-w-0">
            <h2 className="font-semibold text-[15px] text-foreground truncate">
              {tenant?.businessName || tenant?.clientName || ''}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t('siteManagement')}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden -mt-1 -mr-1 text-muted-foreground hover:text-foreground shrink-0"
            onClick={onClose}
          >
            <X size={18} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pb-3 space-y-0.5 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`glass-nav-item ${isActive ? 'active' : ''}`}
              >
                <item.icon size={18} className="shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 space-y-2 border-t border-border/50 pt-3">
          <AdminLanguageSwitcher currentLocale={locale} onChange={onLocaleChange} />
          <ThemeToggle />
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
    </>
  );
}
