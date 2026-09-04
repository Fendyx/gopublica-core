'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useBranch } from '@/entities/branch/BranchContext';
import { useTenant } from '@/entities/tenant/TenantContext';
import OrdersPageContent from './OrdersPageContent';

export default function OrdersPage() {
  const t = useTranslations('admin');
  const { selectedBranch } = useBranch();
  const router = useRouter();
  const tenant = useTenant();
  const canAccessOrders = tenant?.canManageOrders ?? tenant?.moduleAccess?.orders?.canManage ?? false;

  useEffect(() => {
    if (tenant && !canAccessOrders) {
      router.replace('/admin');
    }
  }, [canAccessOrders, router, tenant]);

  if (!canAccessOrders) {
    return <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">{t('ordersUnavailable')}</div>;
  }

  return <OrdersPageContent key={selectedBranch?._id} />;
}