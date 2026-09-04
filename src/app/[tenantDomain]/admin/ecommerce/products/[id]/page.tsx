'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useTenant } from '@/entities/tenant/TenantContext';
import { useBranch } from '@/entities/branch/BranchContext';
import ProductFormPage from '@/features/ecommerce-management/ProductFormPage';
import type { MenuItem } from '@/entities/menu-item/types';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('admin');
  const [token] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('saas_token');
    return null;
  });
  const tenant = useTenant();
  const { selectedBranch } = useBranch();
  const [product, setProduct] = useState<MenuItem | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [productId, setProductId] = useState<string>('');

  useEffect(() => {
    params.then((p) => setProductId(p.id));
  }, [params]);

  useEffect(() => {
    if (!tenant?.tenantId || !productId) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    const fetchData = async () => {
      setLoading(true);
      try {
        let prodUrl = `${apiUrl}/api/saas/menu?tenantId=${tenant.tenantId}`;
        if (selectedBranch) prodUrl += `&branchId=${selectedBranch._id}`;
        const [prodRes, catRes] = await Promise.all([
          fetch(prodUrl),
          fetch(`${apiUrl}/api/saas/categories?tenantId=${tenant.tenantId}&niche=ecommerce`),
        ]);
        const products: MenuItem[] = await prodRes.json();
        const cats = await catRes.json();
        setCategories(cats);

        const found = products.find((p) => p._id === productId);
        if (found) {
          setProduct(found);
        } else {
          setError(t('productNotFound'));
        }
      } catch (err) {
        console.error(err);
        setError(t('failedToLoadProduct'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tenant?.tenantId, productId, selectedBranch]);

  if (!token) return <div className="text-center py-10">{t('loginRequired')}</div>;
  if (loading) return <div className="text-center py-10">{t('loading')}</div>;
  if (error) return <div className="text-center py-10 text-destructive">{error}</div>;

  return (
    <ProductFormPage
      editingProduct={product}
      categories={categories}
      token={token}
    />
  );
}
