// src/app/[tenantDomain]/admin/ecommerce/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTenant } from '@/entities/tenant/TenantContext';
import ProductManager from '@/widgets/Admin/ProductManager';

export default function EcommercePage() {
  const t = useTranslations('admin');
  const router = useRouter();
  const tenant = useTenant();
  const [token] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('saas_token');
    return null;
  });

  const hasOnlineOrdering = tenant?.features?.hasOnlineOrdering ?? false;

  useEffect(() => {
    if (tenant && !hasOnlineOrdering) {
      router.replace('/admin');
    }
  }, [hasOnlineOrdering, router, tenant]);

  if (!token) return <div className="text-center py-10">{t('loginRequired')}</div>;
  if (!hasOnlineOrdering) return <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">{t('ordersUnavailable')}</div>;

  return <ProductManager token={token} />;
}