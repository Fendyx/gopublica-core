// src/app/[tenantDomain]/admin/menu/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useBranch } from '@/entities/branch/BranchContext';
import { useTenant } from '@/entities/tenant/TenantContext';
import MenuManager from '@/widgets/Admin/MenuManager';

export default function AdminMenuPage() {
  const t = useTranslations('admin');
  const { selectedBranch } = useBranch();
  const router = useRouter();
  const tenant = useTenant();
  const [token] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('saas_token');
    return null;
  });

  const canAccessMenu = tenant?.canManageMenu ?? tenant?.moduleAccess?.menu?.canManage ?? false;

  useEffect(() => {
    if (tenant && !canAccessMenu) {
      router.replace('/admin');
    }
  }, [canAccessMenu, router, tenant]);

  if (!token) return <div className="text-center py-10">{t('loginRequired')}</div>;

  if (!canAccessMenu) {
    return <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">{t('menuUnavailable')}</div>;
  }

  return <MenuManager key={selectedBranch?._id} token={token} />;
}