// src/app/[tenantDomain]/admin/ecommerce/page.tsx
'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import ProductManager from '@/widgets/Admin/ProductManager';

export default function EcommercePage() {
  const t = useTranslations('admin');
  const [token] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('saas_token');
    return null;
  });

  if (!token) return <div className="text-center py-10">{t('loginRequired')}</div>;
  return <ProductManager token={token} />;
}