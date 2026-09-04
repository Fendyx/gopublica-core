'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useTenant } from '@/entities/tenant/TenantContext';
import { useBranch } from '@/entities/branch/BranchContext';
import ProductFormPage from '@/features/ecommerce-management/ProductFormPage';

export default function NewProductPage() {
  const t = useTranslations('admin');
  const [token] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('saas_token');
    return null;
  });
  const tenant = useTenant();
  const { selectedBranch } = useBranch();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant?.tenantId) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    fetch(`${apiUrl}/api/saas/categories?tenantId=${tenant.tenantId}&niche=ecommerce`)
      .then((res) => res.json())
      .then(setCategories)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tenant?.tenantId]);

  if (!token) return <div className="text-center py-10">{t('loginRequired')}</div>;
  if (loading) return <div className="text-center py-10">{t('loading')}</div>;

  return (
    <ProductFormPage
      editingProduct={null}
      categories={categories}
      token={token}
    />
  );
}
