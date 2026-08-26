'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTenant } from '@/entities/tenant/TenantContext';
import CustomersPageContent from './CustomersPageContent';

export default function CustomersPage() {
  const router = useRouter();
  const tenant = useTenant();
  const t = useTranslations('admin.customersPage');
  // Same gating as the Orders page — CRM data derives from orders.
  const canAccessCustomers = tenant?.canManageOrders ?? tenant?.moduleAccess?.orders?.canManage ?? false;

  useEffect(() => {
    if (tenant && !canAccessCustomers) {
      router.replace('/admin');
    }
  }, [canAccessCustomers, router, tenant]);

  if (!canAccessCustomers) {
    return <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">{t('unavailable')}</div>;
  }

  return <CustomersPageContent />;
}
